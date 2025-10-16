import { db } from '../db';
import { logger } from '../logger';
import { hashPassword, verifyPassword } from '../utils/passwords';
import { generateToken } from '../middleware/auth';
import { ConflictError, AuthenticationError, BadRequestError } from '../middleware/error';
import { 
  SignupRequest, 
  LoginRequest, 
  VerifyPhoneRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  ChangePhoneNumberRequest
} from '../schemas/auth';
import { smsService } from '../utils/sms';

export interface User {
  id: string;
  email: string;
  phone_number?: string;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  phoneVerified?: boolean;
  requiresPhoneVerification?: boolean;
}

export class AuthService {
  /**
   * Sign up a new user with email, password, and phone number
   * Phone number is stored but not verified yet - verification code is sent
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const { email, password, phoneNumber } = data;

    try {
      // Format phone number
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      // Check if user already exists with this email
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this email already exists');
      }

      // Check phone number usage limit (max 5 users per phone)
      const phoneUsageCount = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE phone_number = $1',
        [formattedPhone]
      );

      if (parseInt(phoneUsageCount.rows[0].count) >= 5) {
        throw new BadRequestError('This phone number has reached the maximum number of associated accounts');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, phone_number, phone_verified) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, phone_number, phone_verified, created_at, updated_at`,
        [email, passwordHash, formattedPhone, false]
      );

      const user = result.rows[0] as User;

      // Send verification code
      await this.sendVerificationCode(formattedPhone, 'signup', user.id);

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info({ userId: user.id, email: user.email }, 'User created successfully, verification code sent');

      return { 
        token,
        phoneVerified: false,
        requiresPhoneVerification: true 
      };
    } catch (error) {
      if (error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Signup failed', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Send a verification code to a phone number
   */
  async sendVerificationCode(
    phoneNumber: string,
    purpose: 'signup' | 'password_reset' | 'phone_change',
    userId?: string
  ): Promise<void> {
    try {
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      
      // Generate verification code
      const code = smsService.generateVerificationCode();
      
      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Store verification code in database
      await db.query(
        `INSERT INTO phone_verification_codes (phone_number, code, purpose, user_id, expires_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [formattedPhone, code, purpose, userId || null, expiresAt]
      );

      // Send SMS
      await smsService.sendVerificationCode(formattedPhone, code, purpose);

      logger.info({ phoneNumber: formattedPhone, purpose }, 'Verification code sent');
    } catch (error) {
      logger.error({ phoneNumber, purpose, error }, 'Failed to send verification code');
      throw new Error('Failed to send verification code. Please try again.');
    }
  }

  /**
   * Verify a phone number with a verification code
   */
  async verifyPhone(data: VerifyPhoneRequest): Promise<{ success: boolean; userId?: string }> {
    const { phoneNumber, code } = data;
    
    try {
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      // Find valid verification code
      const result = await db.query(
        `SELECT id, user_id, attempts, purpose 
         FROM phone_verification_codes 
         WHERE phone_number = $1 
           AND code = $2 
           AND verified = FALSE 
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [formattedPhone, code]
      );

      if (result.rows.length === 0) {
        // Increment attempts if code exists but is wrong
        await db.query(
          `UPDATE phone_verification_codes 
           SET attempts = attempts + 1 
           WHERE phone_number = $1 
             AND verified = FALSE 
             AND expires_at > NOW()`,
          [formattedPhone]
        );
        
        throw new BadRequestError('Invalid or expired verification code');
      }

      const verification = result.rows[0];

      // Check attempts limit (max 5 attempts)
      if (verification.attempts >= 5) {
        throw new BadRequestError('Too many verification attempts. Please request a new code.');
      }

      // Mark verification as complete
      await db.query(
        'UPDATE phone_verification_codes SET verified = TRUE WHERE id = $1',
        [verification.id]
      );

      // If this was for a signup, update user's phone_verified status
      if (verification.user_id) {
        await db.query(
          'UPDATE users SET phone_verified = TRUE WHERE id = $1',
          [verification.user_id]
        );
      }

      logger.info(
        { phoneNumber: formattedPhone, userId: verification.user_id, purpose: verification.purpose },
        'Phone verified successfully'
      );

      return { success: true, userId: verification.user_id };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ phoneNumber, error }, 'Phone verification failed');
      throw new Error('Phone verification failed');
    }
  }

  /**
   * Request a password reset - sends verification code to user's phone
   */
  async requestPasswordReset(data: RequestPasswordResetRequest): Promise<void> {
    const { email } = data;

    try {
      // Find user by email
      const result = await db.query(
        'SELECT id, phone_number, phone_verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if user exists or not
        logger.info({ email }, 'Password reset requested for non-existent user');
        return;
      }

      const user = result.rows[0];

      if (!user.phone_number || !user.phone_verified) {
        throw new BadRequestError('No verified phone number associated with this account. Please contact support.');
      }

      // Send verification code
      await this.sendVerificationCode(user.phone_number, 'password_reset', user.id);

      logger.info({ userId: user.id, email }, 'Password reset code sent');
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ email, error }, 'Password reset request failed');
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Reset password using phone verification code
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean }> {
    const { phoneNumber, code, newPassword } = data;

    try {
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      // Verify the code and get user ID
      const verification = await this.verifyPhone({ phoneNumber: formattedPhone, code });

      if (!verification.success || !verification.userId) {
        throw new BadRequestError('Invalid verification code');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user's password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, verification.userId]
      );

      logger.info({ userId: verification.userId }, 'Password reset successfully');

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ phoneNumber, error }, 'Password reset failed');
      throw new Error('Failed to reset password');
    }
  }

  async login(data: LoginRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    try {
      // Find user by email
      const result = await db.query('SELECT id, email, password_hash FROM users WHERE email = $1', [
        email,
      ]);

      const user = result.rows[0];

      if (!user) {
        await this.logLoginEvent(null, ip, userAgent, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(user.password_hash, password);

      if (!isPasswordValid) {
        await this.logLoginEvent(user.id, ip, userAgent, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Log successful login
      await this.logLoginEvent(user.id, ip, userAgent, true);

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

      return { token };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Login failed', error);
      throw new Error('Login failed');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await db.query(
        'SELECT id, email, phone_number, phone_verified, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to fetch user', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Change user's phone number with verification
   */
  async changePhoneNumber(userId: string, data: ChangePhoneNumberRequest): Promise<{ success: boolean }> {
    const { newPhoneNumber, code } = data;

    try {
      const formattedPhone = smsService.formatPhoneNumber(newPhoneNumber);

      // Verify the code for this new phone number
      const verification = await this.verifyPhone({ phoneNumber: formattedPhone, code });

      if (!verification.success) {
        throw new BadRequestError('Invalid verification code');
      }

      // Check phone number usage limit (max 5 users per phone)
      const phoneUsageCount = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE phone_number = $1 AND id != $2',
        [formattedPhone, userId]
      );

      if (parseInt(phoneUsageCount.rows[0].count) >= 5) {
        throw new BadRequestError('This phone number has reached the maximum number of associated accounts');
      }

      // Update user's phone number and mark as verified
      await db.query(
        'UPDATE users SET phone_number = $1, phone_verified = TRUE, updated_at = NOW() WHERE id = $2',
        [formattedPhone, userId]
      );

      logger.info({ userId, newPhoneNumber: formattedPhone }, 'Phone number changed successfully');

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ userId, newPhoneNumber, error }, 'Phone number change failed');
      throw new Error('Failed to change phone number');
    }
  }

  private async logLoginEvent(
    userId: string | null,
    ip?: string,
    userAgent?: string,
    success: boolean = false
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO login_events (user_id, ip, user_agent, success) 
         VALUES ($1, $2, $3, $4)`,
        [userId, ip, userAgent, success]
      );
    } catch (error) {
      logger.error('Failed to log login event', error);
      // Don't throw error here as it's not critical for the login flow
    }
  }
}

export const authService = new AuthService();

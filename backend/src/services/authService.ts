import { db, drizzleDb, users, loginEvents } from '../db';
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
import { eq } from 'drizzle-orm';

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

      // Check if user already exists
      const existingUser = await drizzleDb.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length > 0) {
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
      const result = await drizzleDb.insert(users)
        .values({
          email,
          passwordHash,
          phoneNumber: formattedPhone,
          phoneVerified: false,
        })
        .returning({
          id: users.id,
          email: users.email,
          phone_number: users.phoneNumber,
          phone_verified: users.phoneVerified,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        });

      const user = result[0] as User;

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
   * @param data - Phone number and code to verify
   * @param expectedPurpose - Optional purpose to validate against (for security)
   */
  async verifyPhone(
    data: VerifyPhoneRequest, 
    expectedPurpose?: 'signup' | 'password_reset' | 'phone_change'
  ): Promise<{ success: boolean; userId?: string }> {
    const { phoneNumber, code } = data;
    
    try {
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      // First check if ANY code exists for this phone number (to give better error messages)
      const anyCodeResult = await db.query(
        `SELECT id, attempts, verified, expires_at, created_at, purpose
         FROM phone_verification_codes 
         WHERE phone_number = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [formattedPhone]
      );

      // Build query with optional purpose filter
      let validCodeQuery = `
        SELECT id, user_id, attempts, purpose 
        FROM phone_verification_codes 
        WHERE phone_number = $1 
          AND code = $2 
          AND verified = FALSE 
          AND expires_at > NOW()`;
      
      const queryParams: any[] = [formattedPhone, code];
      
      // Add purpose filter if specified (for security)
      if (expectedPurpose) {
        validCodeQuery += ` AND purpose = $3`;
        queryParams.push(expectedPurpose);
      }
      
      validCodeQuery += ` ORDER BY created_at DESC LIMIT 1`;

      // Check if code with exact match exists and is valid
      const validCodeResult = await db.query(validCodeQuery, queryParams);

      // If no exact match found, give specific error message
      if (validCodeResult.rows.length === 0) {
        if (anyCodeResult.rows.length === 0) {
          throw new BadRequestError('No verification code found for this phone number. Please request a new code.');
        }

        const latestCode = anyCodeResult.rows[0];
        
        // Check if code was already used
        if (latestCode.verified) {
          throw new BadRequestError('This verification code has already been used. Please request a new code if needed.');
        }

        // Check if code is expired
        if (new Date(latestCode.expires_at) <= new Date()) {
          throw new BadRequestError('Verification code has expired. Please request a new code.');
        }

        // Check if too many attempts
        if (latestCode.attempts >= 5) {
          throw new BadRequestError('Too many failed attempts. Please request a new verification code.');
        }

        // Check if purpose mismatch (if we're enforcing purpose)
        if (expectedPurpose && latestCode.purpose !== expectedPurpose) {
          throw new BadRequestError('This verification code cannot be used for this purpose. Please request a new code.');
        }

        // Code exists but doesn't match - increment attempts
        await db.query(
          `UPDATE phone_verification_codes 
           SET attempts = attempts + 1 
           WHERE id = $1`,
          [latestCode.id]
        );

        const remainingAttempts = 5 - (latestCode.attempts + 1);
        if (remainingAttempts > 0) {
          throw new BadRequestError(
            `Incorrect verification code. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
          );
        } else {
          throw new BadRequestError('Incorrect verification code. Maximum attempts reached. Please request a new code.');
        }
      }

      const verification = validCodeResult.rows[0];

      // Double-check attempts limit (should be caught above, but safety check)
      if (verification.attempts >= 5) {
        throw new BadRequestError('Too many verification attempts. Please request a new code.');
      }

      // Mark verification as complete
      await db.query(
        'UPDATE phone_verification_codes SET verified = TRUE WHERE id = $1',
        [verification.id]
      );

      // Update user's phone_verified status only for signup and phone_change purposes
      // (password_reset doesn't need to update this as it requires already verified phone)
      if (verification.user_id && (verification.purpose === 'signup' || verification.purpose === 'phone_change')) {
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
   * Mask phone number for privacy (show last 4 digits)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      const lastFour = cleaned.slice(-4);
      // Format as +1 (***) ***-1234
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (***) ***-${lastFour}`;
      }
      return `***-***-${lastFour}`;
    }
    return phoneNumber;
  }

  /**
   * Request a password reset - sends verification code to user's phone
   */
  async requestPasswordReset(data: RequestPasswordResetRequest): Promise<{ maskedPhone?: string }> {
    const { email } = data;

    try {
      // Find user by email
      const result = await db.query(
        'SELECT id, phone_number, phone_verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if user exists or not - return success but no masked phone
        logger.info({ email }, 'Password reset requested for non-existent user');
        return {};
      }

      const user = result.rows[0];

      if (!user.phone_number || !user.phone_verified) {
        throw new BadRequestError('No verified phone number associated with this account. Please contact support.');
      }

      // Send verification code
      await this.sendVerificationCode(user.phone_number, 'password_reset', user.id);

      logger.info({ userId: user.id, email }, 'Password reset code sent');

      // Return masked phone number so user knows where code was sent
      return { maskedPhone: this.maskPhoneNumber(user.phone_number) };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ email, error }, 'Password reset request failed');
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Reset password using email and verification code
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean }> {
    const { email, code, newPassword } = data;

    try {
      // Find user by email to get their phone number
      const userResult = await db.query(
        'SELECT id, phone_number, phone_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new BadRequestError('Invalid email or verification code');
      }

      const user = userResult.rows[0];

      if (!user.phone_number || !user.phone_verified) {
        throw new BadRequestError('No verified phone number associated with this account');
      }

      // Verify the code using the phone number associated with this email
      // IMPORTANT: Pass 'password_reset' to ensure only password reset codes can be used
      const verification = await this.verifyPhone({ 
        phoneNumber: user.phone_number, 
        code 
      }, 'password_reset');

      if (!verification.success) {
        throw new BadRequestError('Invalid verification code');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user's password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, user.id]
      );

      logger.info({ userId: user.id }, 'Password reset successfully');

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error({ email, error }, 'Password reset failed');
      throw new Error('Failed to reset password');
    }
  }

  async login(data: LoginRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    try {
      // Find user by email
      const result = await drizzleDb.select({
        id: users.id,
        email: users.email,
        password_hash: users.passwordHash,
      })
        .from(users)
        .where(eq(users.email, email));

      const user = result[0];

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
      const result = await drizzleDb.select({
        id: users.id,
        email: users.email,
        phone_number: users.phoneNumber,
        phone_verified: users.phoneVerified,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
        .from(users)
        .where(eq(users.id, userId));

      const user = result[0];
      if (!user) return null;

      // Convert null to undefined and conditionally include phone_number
      const { phone_number, ...rest } = user;
      return {
        ...rest,
        ...(phone_number !== null && { phone_number }),
      } as User;
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
      // IMPORTANT: Pass 'phone_change' to ensure only phone change codes can be used
      const verification = await this.verifyPhone({ phoneNumber: formattedPhone, code }, 'phone_change');

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
      // Only log if we have a userId (schema requires it to be non-null)
      if (userId) {
        await drizzleDb.insert(loginEvents)
          .values({
            userId,
            ip,
            userAgent,
            success,
          });
      }
    } catch (error) {
      logger.error('Failed to log login event', error);
      // Don't throw error here as it's not critical for the login flow
    }
  }
}

export const authService = new AuthService();

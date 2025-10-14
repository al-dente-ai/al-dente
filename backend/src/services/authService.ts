import { db } from '../db';
import { logger } from '../logger';
import { hashPassword, verifyPassword } from '../utils/passwords';
import { generateToken } from '../middleware/auth';
import { ConflictError, AuthenticationError, NotFoundError, BadRequestError } from '../middleware/error';
import { SignupRequest, LoginRequest, VerifyEmailRequest, ResendVerificationRequest } from '../schemas/auth';
import { emailService } from '../utils/email';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  email_verified?: boolean;
}

export interface SignupResponse {
  message: string;
  email: string;
}

export class AuthService {
  async signup(data: SignupRequest): Promise<SignupResponse> {
    const { email, password } = data;

    try {
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        // If user exists but hasn't verified, allow them to resend verification
        if (!user.email_verified) {
          await this.sendVerificationCode(user.id, email);
          return {
            message: 'A verification code has been sent to your email. Please verify your account.',
            email,
          };
        }
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user (email_verified defaults to false)
      const result = await db.query(
        `INSERT INTO users (email, password_hash, email_verified) 
         VALUES ($1, $2, false) 
         RETURNING id, email, email_verified, created_at, updated_at`,
        [email, passwordHash]
      );

      const user = result.rows[0] as User;

      // Generate and send verification code
      await this.sendVerificationCode(user.id, email);

      logger.info({ userId: user.id, email: user.email }, 'User created successfully, verification email sent');

      return {
        message: 'Account created successfully. Please check your email for the verification code.',
        email: user.email,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Signup failed', error);
      throw new Error('Failed to create user');
    }
  }

  private generateVerificationCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendVerificationCode(userId: string, email: string): Promise<void> {
    // Generate verification code
    const code = this.generateVerificationCode();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing unverified codes for this user
    await db.query(
      'DELETE FROM email_verification_codes WHERE user_id = $1 AND verified = false',
      [userId]
    );

    // Store the verification code
    await db.query(
      `INSERT INTO email_verification_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, code, expiresAt]
    );

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, code);
    
    if (!emailSent) {
      logger.error({ userId, email }, 'Failed to send verification email');
      throw new Error('Failed to send verification email. Please try again.');
    }

    logger.info({ userId, email }, 'Verification code sent successfully');
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    const { email, code } = data;

    try {
      // Find user
      const userResult = await db.query(
        'SELECT id, email, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = userResult.rows[0];

      if (user.email_verified) {
        throw new BadRequestError('Email already verified');
      }

      // Find valid verification code
      const codeResult = await db.query(
        `SELECT id, expires_at FROM email_verification_codes 
         WHERE user_id = $1 AND code = $2 AND verified = false AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id, code]
      );

      if (codeResult.rows.length === 0) {
        throw new BadRequestError('Invalid or expired verification code');
      }

      // Mark code as verified
      await db.query(
        'UPDATE email_verification_codes SET verified = true WHERE id = $1',
        [codeResult.rows[0].id]
      );

      // Mark user email as verified
      await db.query(
        'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info({ userId: user.id, email: user.email }, 'Email verified successfully');

      return { token, email_verified: true };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Email verification failed', error);
      throw new Error('Failed to verify email');
    }
  }

  async resendVerification(data: ResendVerificationRequest): Promise<{ message: string }> {
    const { email } = data;

    try {
      // Find user
      const userResult = await db.query(
        'SELECT id, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = userResult.rows[0];

      if (user.email_verified) {
        throw new BadRequestError('Email already verified');
      }

      // Check if a recent code was sent (within last minute to prevent spam)
      const recentCodeResult = await db.query(
        `SELECT id FROM email_verification_codes 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
        [user.id]
      );

      if (recentCodeResult.rows.length > 0) {
        throw new BadRequestError('A verification code was recently sent. Please wait a minute before requesting another.');
      }

      // Send new verification code
      await this.sendVerificationCode(user.id, email);

      logger.info({ userId: user.id, email }, 'Verification code resent successfully');

      return { message: 'Verification code has been resent to your email' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Failed to resend verification code', error);
      throw new Error('Failed to resend verification code');
    }
  }

  async login(data: LoginRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    try {
      // Find user by email
      const result = await db.query(
        'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
        [email]
      );

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

      // Check if email is verified
      if (!user.email_verified) {
        await this.logLoginEvent(user.id, ip, userAgent, false);
        throw new AuthenticationError('Please verify your email before logging in. Check your inbox for the verification code.');
      }

      // Log successful login
      await this.logLoginEvent(user.id, ip, userAgent, true);

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

      return { token, email_verified: true };
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
        'SELECT id, email, email_verified, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to fetch user', error);
      throw new Error('Failed to fetch user');
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

import { drizzleDb, users, loginEvents } from '../db';
import { logger } from '../logger';
import { hashPassword, verifyPassword } from '../utils/passwords';
import { generateToken } from '../middleware/auth';
import { ConflictError, AuthenticationError } from '../middleware/error';
import { SignupRequest, LoginRequest } from '../schemas/auth';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
}

export class AuthService {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const { email, password } = data;

    try {
      // Check if user already exists
      const existingUser = await drizzleDb.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length > 0) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await drizzleDb.insert(users)
        .values({
          email,
          passwordHash,
        })
        .returning({
          id: users.id,
          email: users.email,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        });

      const user = result[0] as User;

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info({ userId: user.id, email: user.email }, 'User created successfully');

      return { token };
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Signup failed', error);
      throw new Error('Failed to create user');
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
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
        .from(users)
        .where(eq(users.id, userId));

      return result[0] || null;
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

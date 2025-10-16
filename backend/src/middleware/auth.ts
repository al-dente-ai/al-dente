import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../logger';
import { db } from '../db';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface JWTPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header with Bearer token required',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;

      (req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
      };

      next();
    } catch (jwtError) {
      logger.debug('JWT verification failed', jwtError);
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Middleware to require phone verification
 * Must be used AFTER authenticate middleware
 */
export async function requirePhoneVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user || !authenticatedReq.user.id) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Check if user's phone is verified
    const result = await db.query(
      'SELECT phone_verified FROM users WHERE id = $1',
      [authenticatedReq.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    const user = result.rows[0];

    if (!user.phone_verified) {
      res.status(403).json({
        error: {
          code: 'PHONE_VERIFICATION_REQUIRED',
          message: 'Phone verification is required to access this resource',
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Phone verification check failed', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify phone status',
      },
    });
  }
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
    },
    config.auth.jwtSecret,
    {
      expiresIn: '7d',
      algorithm: 'HS256',
    }
  );
}

// Alias for better naming in routes
export const requireAuth = authenticate;

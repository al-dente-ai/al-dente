import argon2 from 'argon2';
import { logger } from '../logger';

export async function hashPassword(password: string): Promise<string> {
  try {
    // Use argon2id variant with recommended settings
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    logger.error('Password hashing failed', error);
    throw new Error('Password hashing failed');
  }
}

export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    logger.error('Password verification failed', error);
    return false;
  }
}

import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Verification code must contain only digits'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequest = z.infer<typeof resendVerificationSchema>;

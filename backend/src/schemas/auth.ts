import { z } from 'zod';
import validator from 'validator';

// Custom phone number validator using the validator package
const phoneNumberSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .refine(
    (phone) => validator.isMobilePhone(phone, 'any', { strictMode: false }),
    'Invalid phone number format'
  );

export const signupSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phoneNumber: phoneNumberSchema,
});

export const verifyPhoneSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

export const sendVerificationCodeSchema = z.object({
  phoneNumber: phoneNumberSchema,
  purpose: z.enum(['signup', 'password_reset', 'phone_change']).default('signup'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const changePhoneNumberSchema = z.object({
  newPhoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type VerifyPhoneRequest = z.infer<typeof verifyPhoneSchema>;
export type SendVerificationCodeRequest = z.infer<typeof sendVerificationCodeSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RequestPasswordResetRequest = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePhoneNumberRequest = z.infer<typeof changePhoneNumberSchema>;

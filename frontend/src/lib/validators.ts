import { z } from 'zod';
import validator from 'validator';

// Phone number validation
const phoneNumberSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .refine(
    (phone) => validator.isMobilePhone(phone, 'any', { strictMode: false }),
    'Invalid phone number format'
  );

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phoneNumber: phoneNumberSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const VerifyPhoneSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

export const RequestPasswordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ChangePhoneSchema = z.object({
  newPhoneNumber: phoneNumberSchema,
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
});

// Item schemas
export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Name is too long'),
  amount: z.string().optional(),
  expiry: z.string().optional().refine((date) => {
    if (!date) return true;
    const expiryDate = new Date(date);
    return expiryDate > new Date();
  }, 'Expiry date must be in the future'),
  categories: z.array(z.string()).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  image_url: z.string().optional(), // Can be URL or data URL from file upload
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const ItemsQuerySchema = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  q: z.string().optional(),
  categories: z.array(z.string()).optional(),
  sort: z.enum(['name', 'expiry']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Recipe schemas
const DietaryEnum = z.enum([
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'soy_free',
  'egg_free',
  'shellfish_free',
  'pescatarian',
  'keto',
  'paleo',
  'halal',
  'kosher',
  'low_sodium',
  'low_carb',
  'low_fat',
  'diabetic_friendly',
  'high_protein',
]);

const CuisineEnum = z.enum([
  'italian',
  'mexican',
  'indian',
  'chinese',
  'japanese',
  'thai',
  'mediterranean',
  'middle_eastern',
  'french',
  'spanish',
  'greek',
  'korean',
  'vietnamese',
  'american',
  'latin_american',
  'african',
  'caribbean',
]);

export const GenerateRecipesSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'any']).optional(),
  user_prompt: z.string().max(500, 'Prompt is too long').optional(),
  count: z.number().min(1).max(5).optional(),
  generate_images: z.boolean().optional(),
  dietary: z.array(DietaryEnum).optional(),
  cuisines: z.array(CuisineEnum).optional(),
});

export const CreateRecipeSchema = z.object({
  title: z.string().min(1, 'Recipe title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().min(1).max(20).optional(),
  prep_time_minutes: z.number().min(1).max(1440).optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    quantity: z.string().optional(),
  })).min(1, 'At least one ingredient is required'),
  steps: z.array(z.string().min(1, 'Step cannot be empty')).min(1, 'At least one step is required'),
  uses_item_ids: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
});

// Export type inferences
export type LoginFormData = z.infer<typeof LoginSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type VerifyPhoneFormData = z.infer<typeof VerifyPhoneSchema>;
export type RequestPasswordResetFormData = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type ChangePhoneFormData = z.infer<typeof ChangePhoneSchema>;
export type CreateItemFormData = z.infer<typeof CreateItemSchema>;
export type UpdateItemFormData = z.infer<typeof UpdateItemSchema>;
export type GenerateRecipesFormData = z.infer<typeof GenerateRecipesSchema>;
export type CreateRecipeFormData = z.infer<typeof CreateRecipeSchema>;

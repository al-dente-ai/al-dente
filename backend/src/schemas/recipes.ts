import { z } from 'zod';

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').trim(),
  quantity: z.string().min(1, 'Ingredient quantity is required').trim(),
});

export const generateRecipesSchema = z.object({
  meal_type: mealTypeSchema.or(z.literal('any')).optional().default('any'),
  user_prompt: z.string().trim().optional(),
  count: z.coerce.number().min(1).max(5).default(1),
  generate_images: z.boolean().default(true),
  dietary: z.array(z.enum([
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
  ])).optional().default([]),
  cuisines: z.array(z.enum([
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
  ])).optional().default([]),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().trim().optional(),
  meal_type: mealTypeSchema,
  servings: z.number().min(1),
  prep_time_minutes: z.number().min(1),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(z.string().min(1, 'Step cannot be empty')).min(1, 'At least one step is required'),
  uses_item_ids: z.array(z.string().uuid()).optional().default([]),
  image_url: z.string().url().optional(),
});

export const recipesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const recipeParamsSchema = z.object({
  id: z.string().uuid('Invalid recipe ID format'),
});

// OpenAI recipe generation schema
export const aiRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  meal_type: mealTypeSchema,
  servings: z.number().min(1),
  prep_time_minutes: z.number().min(1),
  ingredients: z.array(ingredientSchema),
  steps: z.array(z.string()).min(1),
  uses_item_ids: z.array(z.string().uuid()).optional().default([]),
});

export type GenerateRecipesRequest = z.infer<typeof generateRecipesSchema>;
export type CreateRecipeRequest = z.infer<typeof createRecipeSchema>;
export type RecipesQuery = z.infer<typeof recipesQuerySchema>;
export type RecipeParams = z.infer<typeof recipeParamsSchema>;
export type MealType = z.infer<typeof mealTypeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type AIRecipe = z.infer<typeof aiRecipeSchema>;

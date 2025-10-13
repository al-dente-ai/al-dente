import { z } from 'zod';

export const categorySchema = z.enum([
  'produce',
  'dairy',
  'meat',
  'spices',
  'grains',
  'condiments',
  'baked',
  'beverages',
  'frozen',
  'canned',
  'other',
]);

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  amount: z.string().trim().optional(),
  expiry: z.string().date().optional(),
  categories: z.array(categorySchema).optional().default([]),
  notes: z.string().trim().optional(),
  image_url: z.string().url().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const itemsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  categories: z.string().optional().transform((val) => 
    val ? val.split(',').map(c => c.trim()).filter(Boolean) : undefined
  ),
  sort: z.enum(['name', 'expiry', 'amount', 'categories']).default('expiry'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const itemParamsSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
});

export type CreateItemRequest = z.infer<typeof createItemSchema>;
export type UpdateItemRequest = z.infer<typeof updateItemSchema>;
export type ItemsQuery = z.infer<typeof itemsQuerySchema>;
export type ItemParams = z.infer<typeof itemParamsSchema>;
export type Category = z.infer<typeof categorySchema>;

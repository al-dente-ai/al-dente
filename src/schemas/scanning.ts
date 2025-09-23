import { z } from 'zod';
import { categorySchema } from './items';

// OpenAI vision prediction schema
export const visionPredictionSchema = z.object({
  name: z.string(),
  amount: z.string().nullable().optional(),
  expiry: z.string().nullable().optional(), // ISO date string
  categories: z.array(categorySchema).optional().default([]),
  notes: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export const scanResponseSchema = z.object({
  image_url: z.string().url(),
  prediction: visionPredictionSchema,
});

export type VisionPrediction = z.infer<typeof visionPredictionSchema>;
export type ScanResponse = z.infer<typeof scanResponseSchema>;

// Shared TypeScript types based on backend API

export interface User {
  id: string;
  email: string;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  amount?: string;
  expiry?: string;
  categories: string[];
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequest {
  name: string;
  amount?: string;
  expiry?: string;
  categories?: string[];
  notes?: string;
  image_url?: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {}

export interface ItemsQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  categories?: string[];
  sort?: 'name' | 'expiry';
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings?: number;
  prep_time_minutes?: number;
  ingredients: { name: string; quantity?: string }[];
  steps: string[];
  uses_item_ids: string[];
  image_url?: string;
  created_at: string;
}

export interface GenerateRecipesRequest {
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  user_prompt?: string;
  count?: number;
  generate_images?: boolean;
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings?: number;
  prep_time_minutes?: number;
  ingredients: { name: string; quantity?: string }[];
  steps: string[];
  uses_item_ids?: string[];
  image_url?: string;
}

export interface ScanResponse {
  image_url: string;
  prediction: {
    name: string;
    amount?: string | null;
    expiry?: string | null;
    categories: string[];
    notes?: string | null;
    confidence: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface AuthResponse {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

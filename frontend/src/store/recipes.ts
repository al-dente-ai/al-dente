import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '../lib/api';
import type {
  Recipe,
  CreateRecipeRequest,
  GenerateRecipesRequest,
  PaginationResult,
  ApiError,
} from '../lib/types';

interface RecipesState {
  recipes: Recipe[];
  isLoading: boolean;
  isGenerating: boolean;
  isSubmitting: boolean;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface RecipesActions {
  fetchAll: (page?: number, pageSize?: number) => Promise<void>;
  generate: (request: GenerateRecipesRequest) => Promise<Recipe[]>;
  create: (recipe: CreateRecipeRequest) => Promise<Recipe>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type RecipesStore = RecipesState & RecipesActions;

export const useRecipes = create<RecipesStore>()(
  immer((set, get) => ({
    recipes: [],
    isLoading: false,
    isGenerating: false,
    isSubmitting: false,
    error: undefined,
    pagination: undefined,

    fetchAll: async (page = 1, pageSize = 20) => {
      set((state) => {
        state.isLoading = true;
        state.error = undefined;
      });

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        const { data } = await api.get<PaginationResult<Recipe>>(`/recipes?${params}`);

        set((state) => {
          state.recipes = data.data;
          state.pagination = {
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            totalPages: data.totalPages,
            hasNext: data.hasNext,
            hasPrev: data.hasPrev,
          };
          state.isLoading = false;
        });
      } catch (error) {
        const apiError = error as ApiError;
        set((state) => {
          state.isLoading = false;
          state.error = apiError.message;
        });
        throw error;
      }
    },

    generate: async (request: GenerateRecipesRequest) => {
      set((state) => {
        state.isGenerating = true;
        state.error = undefined;
      });

      try {
        const { data } = await api.post<{ data: Recipe[] }>('/recipes/generate', request);

        set((state) => {
          // Add generated recipes to the beginning of the list
          state.recipes = [...data.data, ...state.recipes];
          state.isGenerating = false;
        });

        return data.data;
      } catch (error) {
        const apiError = error as ApiError;
        set((state) => {
          state.isGenerating = false;
          state.error = apiError.message;
        });
        throw error;
      }
    },

    create: async (recipeData: CreateRecipeRequest) => {
      set((state) => {
        state.isSubmitting = true;
        state.error = undefined;
      });

      try {
        const { data } = await api.post<Recipe>('/recipes', recipeData);

        set((state) => {
          // Add new recipe to the beginning of the list
          state.recipes.unshift(data);
          state.isSubmitting = false;
        });

        return data;
      } catch (error) {
        const apiError = error as ApiError;
        set((state) => {
          state.isSubmitting = false;
          state.error = apiError.message;
        });
        throw error;
      }
    },

    remove: async (id: string) => {
      const originalRecipes = get().recipes;

      // Optimistic removal
      set((state) => {
        state.recipes = state.recipes.filter((recipe) => recipe.id !== id);
        state.isSubmitting = true;
        state.error = undefined;
      });

      try {
        await api.delete(`/recipes/${id}`);

        set((state) => {
          state.isSubmitting = false;
        });
      } catch (error) {
        // Rollback optimistic removal
        set((state) => {
          state.recipes = originalRecipes;
          state.isSubmitting = false;
          state.error = (error as ApiError).message;
        });
        throw error;
      }
    },

    clearError: () => {
      set((state) => {
        state.error = undefined;
      });
    },

    reset: () => {
      set((state) => {
        state.recipes = [];
        state.isLoading = false;
        state.isGenerating = false;
        state.isSubmitting = false;
        state.error = undefined;
        state.pagination = undefined;
      });
    },
  }))
);

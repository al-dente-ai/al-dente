import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '../lib/api';
import type {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ItemsQuery,
  PaginationResult,
  ApiError,
} from '../lib/types';

interface ItemsState {
  items: Item[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string;
  lastLoadedAt?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ItemsActions {
  fetchAll: (query?: ItemsQuery) => Promise<void>;
  create: (item: CreateItemRequest) => Promise<Item>;
  update: (id: string, updates: UpdateItemRequest) => Promise<Item>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type ItemsStore = ItemsState & ItemsActions;

export const useItems = create<ItemsStore>()(
  immer((set, get) => ({
    items: [],
    isLoading: false,
    isSubmitting: false,
    error: undefined,
    lastLoadedAt: undefined,
    pagination: undefined,

    fetchAll: async (query: ItemsQuery = {}) => {
      set((state) => {
        state.isLoading = true;
        state.error = undefined;
      });

      try {
        const params = new URLSearchParams();
        if (query.page) params.append('page', query.page.toString());
        if (query.pageSize) params.append('pageSize', query.pageSize.toString());
        if (query.q) params.append('q', query.q);
        if (query.categories?.length) params.append('categories', query.categories.join(','));
        if (query.sort) params.append('sort', query.sort);
        if (query.order) params.append('order', query.order);

        const { data } = await api.get<PaginationResult<Item>>(`/items?${params}`);

        set((state) => {
          state.items = data.data;
          state.pagination = {
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            totalPages: data.totalPages,
            hasNext: data.hasNext,
            hasPrev: data.hasPrev,
          };
          state.isLoading = false;
          state.lastLoadedAt = new Date().toISOString();
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

    create: async (itemData: CreateItemRequest) => {
      set((state) => {
        state.isSubmitting = true;
        state.error = undefined;
      });

      try {
        console.log('Creating item:', itemData);
        const { data } = await api.post<Item>('/items', itemData);

        set((state) => {
          // Optimistically add to the beginning of the list
          state.items.unshift(data);
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

    update: async (id: string, updates: UpdateItemRequest) => {
      const originalItems = get().items;
      const itemIndex = originalItems.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Optimistic update
      set((state) => {
        state.isSubmitting = true;
        state.error = undefined;
        const item = state.items[itemIndex];
        if (item) {
          Object.assign(item, updates);
        }
      });

      try {
        const { data } = await api.put<Item>(`/items/${id}`, updates);

        set((state) => {
          // Update with server response
          const index = state.items.findIndex((item) => item.id === id);
          if (index !== -1) {
            state.items[index] = data;
          }
          state.isSubmitting = false;
        });

        return data;
      } catch (error) {
        // Rollback optimistic update
        set((state) => {
          state.items = originalItems;
          state.isSubmitting = false;
          state.error = (error as ApiError).message;
        });
        throw error;
      }
    },

    remove: async (id: string) => {
      const originalItems = get().items;

      // Optimistic removal
      set((state) => {
        state.items = state.items.filter((item) => item.id !== id);
        state.isSubmitting = true;
        state.error = undefined;
      });

      try {
        await api.delete(`/items/${id}`);

        set((state) => {
          state.isSubmitting = false;
        });
      } catch (error) {
        // Rollback optimistic removal
        set((state) => {
          state.items = originalItems;
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
        state.items = [];
        state.isLoading = false;
        state.isSubmitting = false;
        state.error = undefined;
        state.lastLoadedAt = undefined;
        state.pagination = undefined;
      });
    },
  }))
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import api from '../lib/api';
import type { User, AuthResponse, LoginRequest, SignupRequest, ApiError } from '../lib/types';

interface AuthState {
  token?: string;
  user?: User;
  isLoading: boolean;
  error?: string;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuth = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      token: undefined,
      user: undefined,
      isLoading: false,
      error: undefined,

      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = undefined;
        });

        try {
          const { data } = await api.post<AuthResponse>('/auth/login', credentials);
          
          // Set auth header for future requests
          api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          
          set((state) => {
            state.token = data.token;
            state.isLoading = false;
            // Note: Backend only returns token, not user info
            // We'll derive user info from token or make a separate API call if needed
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

      signup: async (userData: SignupRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = undefined;
        });

        try {
          const { data } = await api.post<AuthResponse>('/auth/signup', userData);
          
          // Set auth header for future requests
          api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          
          set((state) => {
            state.token = data.token;
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

      logout: () => {
        // Clear auth header
        delete api.defaults.headers.common.Authorization;
        
        set((state) => {
          state.token = undefined;
          state.user = undefined;
          state.error = undefined;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = undefined;
        });
      },

      hydrate: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      },
    })),
    {
      name: 'app:auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// Computed values
export const useIsAuthenticated = () => useAuth((state) => Boolean(state.token));

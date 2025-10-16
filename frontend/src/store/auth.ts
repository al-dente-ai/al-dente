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
  phoneVerified?: boolean;
  requiresPhoneVerification?: boolean;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
  fetchUser: () => Promise<void>;
  setPhoneVerified: (verified: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuth = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      token: undefined,
      user: undefined,
      isLoading: false,
      error: undefined,
      phoneVerified: undefined,
      requiresPhoneVerification: undefined,

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
            state.phoneVerified = data.phoneVerified;
            state.requiresPhoneVerification = data.requiresPhoneVerification;
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
            state.phoneVerified = data.phoneVerified;
            state.requiresPhoneVerification = data.requiresPhoneVerification;
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
          state.phoneVerified = undefined;
          state.requiresPhoneVerification = undefined;
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
          // Fetch user data to get phone verification status
          get().fetchUser();
        }
      },

      fetchUser: async () => {
        try {
          const { data } = await api.get<User>('/auth/me');
          set((state) => {
            state.user = data;
            state.phoneVerified = data.phoneVerified;
            state.requiresPhoneVerification = !data.phoneVerified;
          });
        } catch (error) {
          // If fetching user fails, user might not be authenticated
          // We'll handle this gracefully
          console.error('Failed to fetch user:', error);
        }
      },

      setPhoneVerified: (verified: boolean) => {
        set((state) => {
          state.phoneVerified = verified;
          state.requiresPhoneVerification = !verified;
          if (state.user) {
            state.user.phoneVerified = verified;
          }
        });
      },
    })),
    {
      name: 'app:auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        phoneVerified: state.phoneVerified,
        requiresPhoneVerification: state.requiresPhoneVerification,
      }),
    }
  )
);

// Computed values
export const useIsAuthenticated = () => useAuth((state) => Boolean(state.token));
export const usePhoneVerified = () => useAuth((state) => state.phoneVerified);
export const useRequiresPhoneVerification = () =>
  useAuth((state) => state.requiresPhoneVerification);

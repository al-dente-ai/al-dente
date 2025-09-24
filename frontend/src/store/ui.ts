import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}

interface UIState {
  toasts: Toast[];
  modals: Modal[];
  isLoading: boolean;
}

interface UIActions {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (modal: Omit<Modal, 'id' | 'isOpen'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  setLoading: (loading: boolean) => void;
}

type UIStore = UIState & UIActions;

export const useUI = create<UIStore>()(
  immer((set) => ({
    toasts: [],
    modals: [],
    isLoading: false,

    addToast: (toast) => {
      const id = Date.now().toString();
      const newToast: Toast = {
        id,
        duration: 5000, // 5 seconds default
        ...toast,
      };

      set((state) => {
        state.toasts.push(newToast);
      });

      // Auto remove after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          set((state) => {
            state.toasts = state.toasts.filter(t => t.id !== id);
          });
        }, newToast.duration);
      }
    },

    removeToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter(t => t.id !== id);
      });
    },

    clearToasts: () => {
      set((state) => {
        state.toasts = [];
      });
    },

    openModal: (modal) => {
      const id = Date.now().toString();
      set((state) => {
        state.modals.push({
          id,
          isOpen: true,
          ...modal,
        });
      });
      return id;
    },

    closeModal: (id) => {
      set((state) => {
        const modal = state.modals.find(m => m.id === id);
        if (modal) {
          modal.isOpen = false;
          modal.onClose?.();
        }
      });
      
      // Remove modal after animation
      setTimeout(() => {
        set((state) => {
          state.modals = state.modals.filter(m => m.id !== id);
        });
      }, 300);
    },

    closeAllModals: () => {
      set((state) => {
        state.modals.forEach(modal => modal.onClose?.());
        state.modals = [];
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },
  }))
);

// Toast helper functions
export const toast = {
  success: (title: string, message?: string) => 
    useUI.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    useUI.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) => 
    useUI.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => 
    useUI.getState().addToast({ type: 'info', title, message }),
};

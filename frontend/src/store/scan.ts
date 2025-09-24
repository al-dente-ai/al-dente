import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '../lib/api';
import type { ScanResponse, ApiError } from '../lib/types';

interface ScanState {
  isSubmitting: boolean;
  error?: string;
  lastScanResult?: ScanResponse;
}

interface ScanActions {
  uploadImage: (file: File) => Promise<ScanResponse>;
  clearError: () => void;
  clearResult: () => void;
}

type ScanStore = ScanState & ScanActions;

export const useScan = create<ScanStore>()(
  immer((set) => ({
    isSubmitting: false,
    error: undefined,
    lastScanResult: undefined,

    uploadImage: async (file: File) => {
      console.log('🔄 [SCAN STORE] Starting image upload process', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });

      set((state) => {
        state.isSubmitting = true;
        state.error = undefined;
      });

      try {
        console.log('📤 [SCAN STORE] Creating FormData and sending API request');
        const formData = new FormData();
        formData.append('file', file);

        const startTime = Date.now();
        const { data } = await api.post<ScanResponse>('/scan/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const endTime = Date.now();

        console.log('✅ [SCAN STORE] API request successful', {
          duration: `${endTime - startTime}ms`,
          imageUrl: data.image_url,
          predictionName: data.prediction.name,
          confidence: data.prediction.confidence,
          categories: data.prediction.categories,
          timestamp: new Date().toISOString()
        });

        set((state) => {
          state.lastScanResult = data;
          state.isSubmitting = false;
        });

        return data;
      } catch (error) {
        const apiError = error as ApiError;
        console.error('❌ [SCAN STORE] Upload failed', {
          error: apiError.message,
          details: apiError.details,
          timestamp: new Date().toISOString()
        });
        
        set((state) => {
          state.isSubmitting = false;
          state.error = apiError.message;
        });
        throw error;
      }
    },

    clearError: () => {
      set((state) => {
        state.error = undefined;
      });
    },

    clearResult: () => {
      set((state) => {
        state.lastScanResult = undefined;
      });
    },
  }))
);

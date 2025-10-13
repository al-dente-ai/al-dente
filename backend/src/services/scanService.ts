import { supabaseService } from '../utils/supabase';
import { openaiService } from '../utils/openai';
import { logger } from '../logger';
import { ScanResponse } from '../schemas/scanning';

export class ScanService {
  async processImageScan(
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<ScanResponse> {
    const overallStartTime = Date.now();

    try {
      console.log('🔄 [SCAN SERVICE] Starting image processing pipeline', {
        userId,
        filename,
        mimeType,
        bufferSize: `${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
        timestamp: new Date().toISOString(),
      });

      // Upload image to Supabase
      logger.info({ userId, filename, mimeType }, 'Starting image upload');
      console.log('☁️ [SCAN SERVICE] Uploading image to Supabase');

      const uploadStartTime = Date.now();
      const { publicUrl } = await supabaseService.uploadImage(
        fileBuffer,
        userId,
        filename,
        mimeType
      );
      const uploadEndTime = Date.now();

      logger.info({ userId, publicUrl }, 'Image uploaded successfully');
      console.log('✅ [SCAN SERVICE] Supabase upload completed', {
        userId,
        publicUrl,
        uploadDuration: `${uploadEndTime - uploadStartTime}ms`,
        timestamp: new Date().toISOString(),
      });

      // Analyze image with OpenAI Vision
      logger.info({ userId, publicUrl }, 'Starting image analysis');
      console.log('🤖 [SCAN SERVICE] Starting OpenAI Vision analysis', {
        userId,
        imageUrl: publicUrl,
      });

      const analysisStartTime = Date.now();
      const prediction = await openaiService.analyzeImage(publicUrl);
      const analysisEndTime = Date.now();

      logger.info(
        {
          userId,
          prediction: {
            name: prediction.name,
            confidence: prediction.confidence,
          },
        },
        'Image analysis completed'
      );

      console.log('🎯 [SCAN SERVICE] OpenAI analysis completed', {
        userId,
        predictionName: prediction.name,
        confidence: prediction.confidence,
        categories: prediction.categories,
        amount: prediction.amount,
        expiry: prediction.expiry,
        analysisDuration: `${analysisEndTime - analysisStartTime}ms`,
        timestamp: new Date().toISOString(),
      });

      const overallEndTime = Date.now();
      const totalDuration = overallEndTime - overallStartTime;

      console.log('🏁 [SCAN SERVICE] Complete processing pipeline finished', {
        userId,
        totalDuration: `${totalDuration}ms`,
        uploadDuration: `${uploadEndTime - uploadStartTime}ms`,
        analysisDuration: `${analysisEndTime - analysisStartTime}ms`,
        finalImageUrl: publicUrl,
        finalPrediction: prediction.name,
        timestamp: new Date().toISOString(),
      });

      return {
        image_url: publicUrl,
        prediction,
      };
    } catch (error) {
      const overallEndTime = Date.now();
      const totalDuration = overallEndTime - overallStartTime;

      logger.error('Image scan processing failed', error);
      console.error('❌ [SCAN SERVICE] Processing pipeline failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${totalDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      throw new Error('Failed to process image scan');
    }
  }

  validateImageFile(
    file: Express.Multer.File,
    maxSizeBytes: number = 16 * 1024 * 1024 // 16MB
  ): void {
    // Check file size
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds maximum of ${maxSizeBytes / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        `File type ${file.mimetype} not allowed. Supported types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Check if file has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File appears to be empty');
    }
  }
}

export const scanService = new ScanService();

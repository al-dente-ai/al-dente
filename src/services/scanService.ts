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
    try {
      // Upload image to Supabase
      logger.info({ userId, filename, mimeType }, 'Starting image upload');
      
      const { publicUrl } = await supabaseService.uploadImage(
        fileBuffer,
        userId,
        filename,
        mimeType
      );

      logger.info({ userId, publicUrl }, 'Image uploaded successfully');

      // Analyze image with OpenAI Vision
      logger.info({ userId, publicUrl }, 'Starting image analysis');
      
      const prediction = await openaiService.analyzeImage(publicUrl);

      logger.info({ 
        userId, 
        prediction: { 
          name: prediction.name, 
          confidence: prediction.confidence 
        } 
      }, 'Image analysis completed');

      return {
        image_url: publicUrl,
        prediction,
      };
    } catch (error) {
      logger.error('Image scan processing failed', error);
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
      throw new Error(`File type ${file.mimetype} not allowed. Supported types: ${allowedMimeTypes.join(', ')}`);
    }

    // Check if file has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File appears to be empty');
    }
  }
}

export const scanService = new ScanService();

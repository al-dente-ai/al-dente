import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../logger';

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async uploadImage(
    buffer: Buffer,
    userId: string,
    originalFilename: string,
    mimeType: string
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      // Extract file extension from mime type or filename
      const extension = this.getFileExtension(mimeType, originalFilename);
      
      // Generate unique filename
      const filename = `${uuidv4()}${extension}`;
      const filePath = `${userId}/${filename}`;

      // Upload to Supabase storage
      const { data, error } = await this.client.storage
        .from(config.supabase.imageBucket)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        logger.error('Supabase upload error', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from(config.supabase.imageBucket)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      logger.error('Image upload failed', error);
      throw error;
    }
  }

  async deleteImage(filePath: string): Promise<void> {
    try {
      const { error } = await this.client.storage
        .from(config.supabase.imageBucket)
        .remove([filePath]);

      if (error) {
        logger.error('Supabase delete error', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      logger.error('Image deletion failed', error);
      throw error;
    }
  }

  private getFileExtension(mimeType: string, filename: string): string {
    // Try to get extension from mime type first
    const mimeExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    if (mimeExtensions[mimeType]) {
      return mimeExtensions[mimeType];
    }

    // Fallback to filename extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return filename.substring(lastDotIndex);
    }

    // Default to .jpg if we can't determine
    return '.jpg';
  }

  getPublicUrl(filePath: string): string {
    const { data } = this.client.storage
      .from(config.supabase.imageBucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}

export const supabaseService = new SupabaseService();
export { SupabaseService };

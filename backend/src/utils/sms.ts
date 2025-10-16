import twilio from 'twilio';
import { config } from '../config';
import { logger } from '../logger';

/**
 * SMS Service for sending verification codes via Twilio
 */
class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  constructor() {
    // Check if Twilio config is available
    if (!config.twilio || !config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
      logger.warn('Twilio configuration not found. SMS service will not be available.');
      return;
    }

    this.fromNumber = config.twilio.phoneNumber;
    
    try {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service', error);
      // Don't throw - allow app to start even if SMS is misconfigured
      // SMS operations will fail gracefully
    }
  }

  /**
   * Generate a random 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send a verification code via SMS
   */
  async sendVerificationCode(
    phoneNumber: string,
    code: string,
    purpose: 'signup' | 'password_reset' | 'phone_change' = 'signup'
  ): Promise<boolean> {
    if (!this.client) {
      logger.error('SMS client not initialized');
      throw new Error('SMS service is not available');
    }

    try {
      const messageMap = {
        signup: `Your Al Dente verification code is: ${code}. This code will expire in 10 minutes.`,
        password_reset: `Your Al Dente password reset code is: ${code}. This code will expire in 10 minutes.`,
        phone_change: `Your Al Dente phone verification code is: ${code}. This code will expire in 10 minutes.`,
      };

      const message = messageMap[purpose];

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      logger.info(
        { phoneNumber, purpose, messageSid: result.sid },
        'SMS verification code sent successfully'
      );

      return true;
    } catch (error) {
      logger.error({ phoneNumber, purpose, error }, 'Failed to send SMS verification code');
      throw new Error('Failed to send verification code. Please try again.');
    }
  }

  /**
   * Format phone number to E.164 format (if not already)
   * This is a simple implementation - you might want to use a library like libphonenumber-js
   * for more robust phone number parsing
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 (US/Canada), ensure it has the + prefix
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's 10 digits, assume US/Canada and add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has country code
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    // Return as-is if we can't determine format
    return phoneNumber;
  }

  /**
   * Validate phone number format
   * For production, consider using libphonenumber-js or similar library
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation - at least 10 digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const smsService = new SMSService();
export { SMSService };


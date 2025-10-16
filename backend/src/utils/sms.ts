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
   * Validate if phone number is a valid US/Canada number
   * Returns an object with validation result and formatted number
   */
  validateUSCanadaPhone(phoneNumber: string): { 
    isValid: boolean; 
    formatted?: string; 
    error?: string;
  } {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check for 10-digit US/Canada format
    if (cleaned.length === 10) {
      // Validate US/Canada number format (NPA-NXX-XXXX)
      // NPA (area code): 2-9 for first digit
      // NXX (exchange): 2-9 for first digit
      const firstDigit = cleaned[0];
      const fourthDigit = cleaned[3];
      
      if (firstDigit < '2' || firstDigit > '9') {
        return {
          isValid: false,
          error: 'Invalid area code. US/Canada area codes start with digits 2-9.'
        };
      }
      
      if (fourthDigit < '2' || fourthDigit > '9') {
        return {
          isValid: false,
          error: 'Invalid phone number format.'
        };
      }
      
      return {
        isValid: true,
        formatted: `+1${cleaned}`
      };
    }
    
    // Check for 11-digit with US/Canada country code (1)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const nationalNumber = cleaned.substring(1);
      const firstDigit = nationalNumber[0];
      const fourthDigit = nationalNumber[3];
      
      if (firstDigit < '2' || firstDigit > '9') {
        return {
          isValid: false,
          error: 'Invalid area code. US/Canada area codes start with digits 2-9.'
        };
      }
      
      if (fourthDigit < '2' || fourthDigit > '9') {
        return {
          isValid: false,
          error: 'Invalid phone number format.'
        };
      }
      
      return {
        isValid: true,
        formatted: `+${cleaned}`
      };
    }
    
    // Check if it might be an international number
    if (cleaned.length > 11 || (cleaned.length === 11 && !cleaned.startsWith('1'))) {
      return {
        isValid: false,
        error: 'Only US and Canada phone numbers are currently supported. Please use a +1 country code number.'
      };
    }
    
    if (cleaned.length < 10) {
      return {
        isValid: false,
        error: 'Phone number is too short. Please enter a valid 10-digit US/Canada phone number.'
      };
    }
    
    return {
      isValid: false,
      error: 'Invalid phone number format. Please enter a valid US/Canada phone number (10 digits).'
    };
  }

  /**
   * Format phone number to E.164 format (US/Canada only)
   * Throws error if not a valid US/Canada number
   */
  formatPhoneNumber(phoneNumber: string): string {
    const validation = this.validateUSCanadaPhone(phoneNumber);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid phone number format');
    }
    
    return validation.formatted!;
  }

  /**
   * Validate phone number format (US/Canada only)
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    const validation = this.validateUSCanadaPhone(phoneNumber);
    return validation.isValid;
  }
}

export const smsService = new SMSService();
export { SMSService };


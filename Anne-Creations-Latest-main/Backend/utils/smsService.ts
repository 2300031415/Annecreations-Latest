import axios from 'axios';

interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

interface Fast2SMSConfig {
  apiKey: string;
  baseUrl: string;
  senderId: string;
  route: 'v3' | 'otp' | 'q' | 'dlt';
  encryptionKey?: string;
  secretKey?: string;
  enableValidation: boolean;
  flash: 0 | 1;
  language: 'english' | 'hindi' | 'gujarati' | 'punjabi' | 'marathi' | 'tamil' | 'telugu';
}

class SMSService {
  private config: Fast2SMSConfig;

  constructor() {
    this.config = {
      apiKey: process.env.FAST2SMS_API_KEY || '',
      baseUrl: process.env.FAST2SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2',
      senderId: process.env.FAST2SMS_SENDER_ID || 'ANNECR',
      route: (process.env.FAST2SMS_ROUTE as Fast2SMSConfig['route']) || 'v3',
      encryptionKey: process.env.FAST2SMS_ENCRYPTION_KEY || '',
      secretKey: process.env.FAST2SMS_SECRET_KEY || '',
      enableValidation: process.env.FAST2SMS_ENABLE_VALIDATION === 'true',
      flash: process.env.FAST2SMS_FLASH === '1' ? 1 : 0,
      language: (process.env.FAST2SMS_LANGUAGE as Fast2SMSConfig['language']) || 'english',
    };

    if (!this.config.apiKey) {
      console.warn('Fast2SMS API key is not configured. SMS functionality will be disabled.');
    }
  }

  /**
   * Send OTP to mobile number using Fast2SMS
   * @param mobile - Mobile number (should be in format: 10 digits for India)
   * @param otp - 6-digit OTP code
   * @returns Promise with success status and message
   */
  /**
   * Validate mobile number format
   */
  private validateMobileNumber(mobile: string): {
    valid: boolean;
    cleaned: string;
    error?: string;
  } {
    // Clean mobile number (remove +91, spaces, dashes)
    const cleanMobile = mobile.replace(/[\s\-+()\u202F]/g, '');
    let mobileNumber = cleanMobile;

    // If mobile starts with country code, remove it
    if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
      mobileNumber = cleanMobile.substring(2);
    }

    // Validate mobile number (should be 10 digits for India starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return {
        valid: false,
        cleaned: mobileNumber,
        error: 'Invalid Indian mobile number format. Must be 10 digits starting with 6-9',
      };
    }

    return {
      valid: true,
      cleaned: mobileNumber,
    };
  }

  async sendOTP(mobile: string, otp: string): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiKey) {
      console.error('Fast2SMS API key is not configured');
      return {
        success: false,
        message: 'SMS service is not configured',
      };
    }

    try {
      // Validate mobile number
      const validation = this.validateMobileNumber(mobile);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid mobile number',
        };
      }

      const mobileNumber = validation.cleaned;

      // Build OTP message
      const message = `Your OTP for Anne Creations registration is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

      // Build request payload based on route
      const payload: Record<string, unknown> = {
        route: this.config.route,
        sender_id: this.config.senderId,
        language: this.config.language,
        flash: this.config.flash,
        numbers: mobileNumber,
      };

      // For OTP route, use variables_values parameter
      if (this.config.route === 'otp') {
        payload.variables_values = otp;
      } else {
        payload.message = message;
      }

      // Add encryption if configured
      if (this.config.encryptionKey) {
        payload.encryption_key = this.config.encryptionKey;
      }

      // Add secret key if configured
      if (this.config.secretKey) {
        payload.secret_key = this.config.secretKey;
      }

      console.log(`Sending OTP to ${mobileNumber} via route: ${this.config.route}`);

      const response = await axios.post<Fast2SMSResponse>(this.config.baseUrl, payload, {
        headers: {
          authorization: this.config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.return) {
        console.log(`OTP sent successfully to ${mobileNumber}`, {
          requestId: response.data.request_id,
          route: this.config.route,
        });
        return {
          success: true,
          message: 'OTP sent successfully',
        };
      } else {
        console.error('Fast2SMS API returned false:', response.data);
        return {
          success: false,
          message: 'Failed to send OTP',
        };
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Fast2SMS API error:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send SMS',
        };
      }
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  /**
   * Send custom SMS message
   * @param mobile - Mobile number
   * @param message - SMS message content
   */
  async sendSMS(mobile: string, message: string): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiKey) {
      console.error('Fast2SMS API key is not configured');
      return {
        success: false,
        message: 'SMS service is not configured',
      };
    }

    try {
      // Validate mobile number
      const validation = this.validateMobileNumber(mobile);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid mobile number',
        };
      }

      const mobileNumber = validation.cleaned;

      // Build request payload
      const payload: Record<string, unknown> = {
        route: this.config.route === 'otp' ? 'v3' : this.config.route, // Use v3 for custom messages
        sender_id: this.config.senderId,
        message: message,
        language: this.config.language,
        flash: this.config.flash,
        numbers: mobileNumber,
      };

      // Add encryption if configured
      if (this.config.encryptionKey) {
        payload.encryption_key = this.config.encryptionKey;
      }

      // Add secret key if configured
      if (this.config.secretKey) {
        payload.secret_key = this.config.secretKey;
      }

      console.log(`Sending SMS to ${mobileNumber}`);

      const response = await axios.post<Fast2SMSResponse>(this.config.baseUrl, payload, {
        headers: {
          authorization: this.config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.return) {
        console.log(`SMS sent successfully to ${mobileNumber}`, {
          requestId: response.data.request_id,
        });
        return {
          success: true,
          message: 'SMS sent successfully',
        };
      } else {
        console.error('Fast2SMS API returned false:', response.data);
        return {
          success: false,
          message: 'Failed to send SMS',
        };
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Fast2SMS API error:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send SMS',
        };
      }
      console.error('Error sending SMS:', error);
      return {
        success: false,
        message: 'Failed to send SMS',
      };
    }
  }
}

// Export singleton instance
const smsService = new SMSService();
export default smsService;

// Export helper functions
export const sendOTP = (mobile: string, otp: string) => smsService.sendOTP(mobile, otp);
export const sendSMS = (mobile: string, message: string) => smsService.sendSMS(mobile, message);

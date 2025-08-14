import twilio from 'twilio';

// SMS Service for sending OTP
export interface SMSResponse {
  success: boolean;
  message: string;
  sid?: string;
}

export class SMSService {
  private static instance: SMSService;
  private twilioClient: any;
  private twilioPhoneNumber: string;

  private constructor() {
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  private isConfigured(): boolean {
    return !!(this.twilioClient && this.twilioPhoneNumber);
  }

  public async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      // Format phone number for international format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.isConfigured()) {
        console.warn('Twilio not configured. Using demo mode.');
        console.log(`📱 Demo SMS: OTP ${otp} would be sent to ${formattedPhone}`);
        
        // Show alert to user in demo mode
        alert(`Demo Mode: Your OTP is ${otp}\n\nTo receive real SMS:\n1. Sign up at https://console.twilio.com/\n2. Get Account SID, Auth Token, and Phone Number\n3. Add them to your .env file`);
        
        return {
          success: true,
          message: `Demo: OTP ${otp} displayed (would be sent to ${formattedPhone})`,
          sid: 'demo_' + Date.now()
        };
      }

      // Send real SMS using Twilio
      const message = await this.twilioClient.messages.create({
        body: `Your OTP for Training Portal verification is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: this.twilioPhoneNumber,
        to: formattedPhone
      });

      console.log('SMS sent successfully:', message.sid);
      
      return {
        success: true,
        message: `OTP sent successfully to ${formattedPhone}`,
        sid: message.sid
      };
    } catch (error: any) {
      console.error('SMS sending failed:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to send SMS. Please try again.';
      
      if (error.code === 21211) {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 21608) {
        errorMessage = 'Phone number is not reachable. Please verify the number.';
      } else if (error.code === 21614) {
        errorMessage = 'Invalid phone number. Please enter a valid mobile number.';
      } else if (error.message?.includes('authenticate')) {
        errorMessage = 'SMS service configuration error. Please contact support.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code for India if not present
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    // If already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    
    // For other countries, you can add more logic here
    return '+91' + cleaned.slice(-10);
  }
}

export const smsService = SMSService.getInstance();
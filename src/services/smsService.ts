// SMS Service for sending OTP
export interface SMSResponse {
  success: boolean;
  message: string;
  sid?: string;
}

export class SMSService {
  private static instance: SMSService;
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;

  private constructor() {
    this.twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  private isConfigured(): boolean {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber);
  }

  public async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    // For demo purposes, we'll simulate SMS sending
    // In production, you would use Twilio's REST API
    
    if (!this.isConfigured()) {
      console.warn('Twilio not configured. Using demo mode.');
      return this.simulateSMS(phoneNumber, otp);
    }

    try {
      // Format phone number for international format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // In a real implementation, you would make an API call to Twilio
      // const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
      // const message = await client.messages.create({
      //   body: `Your OTP for training portal verification is: ${otp}. Valid for 5 minutes.`,
      //   from: this.twilioPhoneNumber,
      //   to: formattedPhone
      // });

      // For now, simulate the API call
      await this.delay(1000);
      
      return {
        success: true,
        message: `OTP sent successfully to ${phoneNumber}`,
        sid: 'demo_message_sid_' + Date.now()
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        message: 'Failed to send SMS. Please try again.'
      };
    }
  }

  private simulateSMS(phoneNumber: string, otp: string): Promise<SMSResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`📱 SMS Simulation: Sending OTP ${otp} to ${phoneNumber}`);
        resolve({
          success: true,
          message: `OTP sent to ${phoneNumber} (Demo Mode)`,
          sid: 'demo_' + Date.now()
        });
      }, 1000);
    });
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
    
    return '+91' + cleaned.slice(-10);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const smsService = SMSService.getInstance();
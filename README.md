# Training Verification & Enrollment Portal

A comprehensive web application for training program verification and enrollment with SMS OTP functionality.

## Features

- **Mobile Verification**: SMS-based OTP verification using Twilio
- **Document Upload**: Aadhar card verification with OCR simulation
- **Registration System**: Complete candidate registration with training details
- **Status Tracking**: Check training status by Aadhar or mobile number
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## SMS Integration Setup

This application uses Twilio for SMS functionality. To enable real SMS sending:

### 1. Create a Twilio Account

1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get a phone number from Twilio
3. Note down your Account SID and Auth Token

### 2. Configure Environment Variables

Update the `.env` file in the root directory with your actual Twilio credentials:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_32_character_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Quick Setup Guide

1. **Sign up**: Go to [https://console.twilio.com/](https://console.twilio.com/)
2. **Verify your phone**: Twilio will ask you to verify your phone number
3. **Get a phone number**: Purchase a phone number from Twilio (usually $1/month)
4. **Find credentials**: 
   - Account SID: Found on your Twilio Console Dashboard
   - Auth Token: Click "Show" next to Auth Token on Dashboard
   - Phone Number: The number you purchased (format: +1234567890)
5. **Update .env**: Replace the placeholder values with your real credentials
6. **Restart app**: Stop and restart your development server

### 4. Production Implementation

For production use, you'll need to:

1. Ensure all Twilio credentials are properly set
2. Test with your own phone number first
3. Consider implementing rate limiting for production
4. Add phone number validation for your target region
5. Monitor SMS usage and costs in Twilio Console

## Demo Mode

Without Twilio configuration, the app runs in demo mode:
- SMS sending shows an alert with the OTP
- Console logs show what would be sent
- OTP generation and validation still work
- All other features remain functional

**Current Status**: The app will show you the OTP in an alert popup if Twilio is not configured, so you can still test the complete flow.
## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local server URL

## Usage

1. **Verification**: Enter mobile number to receive OTP
2. **Document Upload**: Upload Aadhar card for verification
3. **Registration**: Complete training program registration
4. **Status Check**: Track training progress and status

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **SMS Service**: Twilio
- **Build Tool**: Vite

## Security Features

- OTP expiration (5 minutes)
- Maximum attempt limits (3 attempts)
- Phone number validation
- Secure token handling
- Input sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
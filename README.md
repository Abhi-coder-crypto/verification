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

Create a `.env` file in the root directory with:

```env
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### 3. Production Implementation

For production use, you'll need to:

1. Uncomment the Twilio client code in `src/services/smsService.ts`
2. Install the Twilio SDK server-side component
3. Implement proper error handling and rate limiting
4. Add phone number validation for your target region

## Demo Mode

Without Twilio configuration, the app runs in demo mode:
- SMS sending is simulated with console logs
- OTP generation and validation still work
- All other features remain functional

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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, FileText, Shield, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useCandidateContext } from '../context/CandidateContext';
import { smsService } from '../services/smsService';
import { otpService } from '../services/otpService';

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentCandidate, isAlreadyTrained } = useCandidateContext();
  
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [aadharUploaded, setAadharUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Mock Aadhar data that gets filled when document is uploaded
  const mockAadharData = {
    name: 'Anjali Mehta',
    dob: '1996-05-12',
    aadhar: '987654321098'
  };

  const handleSendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Generate OTP
      const generatedOTP = otpService.generateOTP();
      
      // Send SMS
      const smsResponse = await smsService.sendOTP(mobile, generatedOTP);
      
      if (smsResponse.success) {
        // Store OTP for validation
        otpService.storeOTP(mobile, generatedOTP);
        
        setOtpSent(true);
        setSuccess(smsResponse.message);
        
        // Start resend timer (30 seconds)
        setCanResendOTP(false);
        setResendTimer(30);
        
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResendOTP(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(smsResponse.message);
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
      console.error('OTP sending error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP) return;
    
    // Clear previous OTP
    otpService.clearOTP(mobile);
    setOtp('');
    setError('');
    
    await handleSendOTP();
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }
    
    setError('');
    
    const validation = otpService.validateOTP(mobile, otp);
    
    if (validation.valid) {
      setOtpSent(true);
      setOtpVerified(true);
      setSuccess(validation.message);
      setOtpAttempts(0);
    } else {
      setError(validation.message);
      if (validation.attemptsLeft !== undefined) {
        setOtpAttempts(3 - validation.attemptsLeft);
      }
      
      // If max attempts exceeded, allow resending
      if (validation.message.includes('Maximum attempts exceeded')) {
        setOtpSent(false);
        setCanResendOTP(true);
        setResendTimer(0);
      }
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setMobile(value);
      
      // Reset OTP state if mobile number changes
      if (otpSent && value !== mobile) {
        setOtpSent(false);
        setOtpVerified(false);
        setOtp('');
        otpService.clearOTP(mobile);
      }
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setOtp(value);
      setError(''); // Clear error when user starts typing
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.length >= 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  const handleProceed = () => {
    if (isAlreadyTrained(mockAadharData.aadhar, mobile)) {
      setError('This candidate is already trained and cannot be registered again.');
      setSuccess('');
      return;
    }

    navigate('/registration');
  };

  const handleAadharUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    // Simulate file processing and OCR
    setTimeout(() => {
      setAadharUploaded(true);
      setCurrentCandidate({
        ...mockAadharData,
        mobile
      });
      setSuccess('Aadhar document processed successfully!');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Candidate Verification</h2>
          <p className="text-gray-600">Complete mobile and document verification to proceed</p>
        </div>

        {/* Mobile Verification */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Phone className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Mobile Verification</h3>
            {otpVerified && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                maxLength={10}
                disabled={otpVerified}
              />
            </div>

            {!otpSent && (
              <button
                onClick={handleSendOTP}
                disabled={loading || !mobile}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            )}

            {otpSent && !otpVerified && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    OTP sent to <span className="font-semibold">{formatPhoneDisplay(mobile)}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Valid for 5 minutes • Attempts: {otpAttempts}/3
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={handleOTPChange}
                    placeholder="Enter 4-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    maxLength={4}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={!otp || otp.length !== 4}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={handleResendOTP}
                    disabled={!canResendOTP || loading}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aadhar Upload */}
        {otpVerified && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Aadhar Document</h3>
              {aadharUploaded && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
            </div>
            
            {!aadharUploaded ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors duration-200">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    {loading ? 'Processing...' : 'Upload Aadhar Document'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleAadharUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Upload clear image or PDF of Aadhar card
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Document Verified</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {mockAadharData.name}</p>
                  <p><span className="font-medium">Date of Birth:</span> {new Date(mockAadharData.dob).toLocaleDateString()}</p>
                  <p><span className="font-medium">Aadhar Number:</span> {mockAadharData.aadhar}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Proceed Button */}
        {otpVerified && aadharUploaded && (
          <div className="text-center">
            <button
              onClick={handleProceed}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 text-lg"
            >
              Proceed to Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
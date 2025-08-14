import Tesseract from 'tesseract.js';

// OCR Service for processing Aadhar documents
export interface AadharData {
  name: string;
  dob: string;
  aadhar: string;
  address?: string;
  gender?: string;
}

export interface OCRResponse {
  success: boolean;
  data?: AadharData;
  error?: string;
}

export class OCRService {
  private static instance: OCRService;

  private constructor() {}

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  public async processAadharDocument(file: File): Promise<OCRResponse> {
    try {
      // Validate file type
      if (!this.isValidFileType(file)) {
        return {
          success: false,
          error: 'Please upload a valid image (JPG, PNG) or PDF file'
        };
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'File size must be less than 5MB'
        };
      }

      // Convert file to base64 for processing
      const base64Data = await this.fileToBase64(file);
      
      // Extract text from image using OCR
      const extractedText = await this.performOCR(base64Data);
      
      // Parse Aadhar data from extracted text
      const aadharData = this.parseAadharData(extractedText);
      
      if (!aadharData) {
        return {
          success: false,
          error: 'Could not extract Aadhar information. Please ensure the document is clear and readable.'
        };
      }

      return {
        success: true,
        data: aadharData
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        error: 'Failed to process document. Please try again.'
      };
    }
  }

  private isValidFileType(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ];
    return validTypes.includes(file.type);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async performOCR(base64Data: string): Promise<string> {
    try {
      // Convert base64 to blob for Tesseract
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      console.log('Starting OCR processing...');
      
      // Use Tesseract.js for actual OCR processing
      const result = await Tesseract.recognize(blob, 'eng+hin', {
        logger: m => console.log('OCR Progress:', m)
      });

      console.log('OCR completed. Raw text:', result.data.text);
      return result.data.text;
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      // Fallback - return empty string to trigger error handling
      return '';
    }
  }

  private parseAadharData(text: string): AadharData | null {
    try {
      console.log('Parsing OCR text:', text);

      if (!text || text.trim().length === 0) {
        console.error('OCR text is empty');
        return null;
      }

      // Clean the text
      const cleanText = text.replace(/\s+/g, ' ').trim();

      // Extract Aadhar number (12 digits, may have spaces or special formatting)
      const aadharPatterns = [
        /(\d{4}\s*\d{4}\s*\d{4})/g,
        /(\d{4}\s+\d{4}\s+\d{4})/g,
        /आधार.*?(\d{4}\s*\d{4}\s*\d{4})/gi,
        /Aadhaar.*?(\d{4}\s*\d{4}\s*\d{4})/gi
      ];
      
      let aadhar = '';
      for (const pattern of aadharPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          // Get the last match (usually the main Aadhar number)
          aadhar = matches[matches.length - 1].replace(/\s/g, '');
          if (aadhar.length === 12) break;
        }
      }

      // Extract name with improved patterns
      let name = '';
      const namePatterns = [
        // Name patterns specific to Aadhar cards
        /(?:To|नाम)\s*[:,]?\s*([A-Za-z\s]{3,50}?)(?:\s*(?:DOB|Date|जन्म|S\/O|D\/O|W\/O))/i,
        /([A-Za-z]+(?:\s+[A-Za-z]+){1,3})\s*(?:DOB|Date of Birth|जन्म)/i,
        // Name in photo section
        /(?:Male|Female|पुरुष|महिला)\s*([A-Za-z\s]{5,40})/i,
        // Fallback patterns
        /^([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)\s/m
      ];

      for (const pattern of namePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const extractedName = match[1].trim();
          // Filter out government text and validate
          if (!extractedName.match(/(government|india|authority|identification|unique|card|enrolment)/i) &&
              extractedName.length >= 3 && extractedName.length <= 50 &&
              extractedName.match(/^[A-Za-z\s]+$/)) {
            name = extractedName;
            break;
          }
        }
      }

      // Extract date of birth with comprehensive patterns
      let dob = '';
      const dobPatterns = [
        /DOB\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
        /Date of Birth\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
        /जन्म.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g
      ];

      for (const pattern of dobPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const dateStr = match[1];
          const [day, month, year] = dateStr.split(/[\/\-]/);
          // Validate date
          if (year && parseInt(year) > 1900 && parseInt(year) < 2025) {
            dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            break;
          }
        }
      }

      // Extract address with better patterns
      let address = '';
      const addressPatterns = [
        // Look for common address elements
        /(?:Address|पता)[:\s]*([A-Za-z0-9\s,\/\-\.]+?)(?=\s*(?:Mobile|PIN|State|District))/i,
        // Look for structural address elements
        /((?:[A-Za-z0-9\/\-\.\s,]+(?:CHAWL|COMPOUND|ROAD|STREET|NAGAR|COLONY|PARK|LANE)[A-Za-z0-9\/\-\.\s,]*)+)/i,
        // Look for PIN code area
        /([A-Za-z0-9\s,\/\-\.]+)\s*PIN\s*Code\s*:\s*\d{6}/i
      ];

      for (const pattern of addressPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          address = match[1]
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (address.length > 10) break;
        }
      }

      // Extract gender
      const genderMatch = text.match(/(Male|Female|पुरुष|महिला)/i);
      const gender = genderMatch ? 
        (genderMatch[1].toLowerCase() === 'male' || genderMatch[1] === 'पुरुष' ? 'Male' : 'Female') : '';

      console.log('Extracted data:', { name, dob, aadhar, address, gender });

      // Enhanced validation
      const isValidName = name && name.length >= 3 && name.match(/^[A-Za-z\s]+$/);
      const isValidDob = dob && dob.match(/^\d{4}-\d{2}-\d{2}$/);
      const isValidAadhar = aadhar && aadhar.length === 12 && aadhar.match(/^\d{12}$/);

      if (!isValidName || !isValidDob || !isValidAadhar) {
        console.error('Validation failed:', { 
          hasValidName: isValidName, 
          hasValidDob: isValidDob, 
          hasValidAadhar: isValidAadhar,
          name, dob, aadhar
        });
        return null;
      }

      return {
        name,
        dob,
        aadhar,
        address: address || '',
        gender
      };

    } catch (error) {
      console.error('Error parsing Aadhar data:', error);
      return null;
    }
  }
}

export const ocrService = OCRService.getInstance();
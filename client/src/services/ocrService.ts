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

      console.log('Processing Aadhar document with OCR...');
      
      // Convert file to base64 for processing
      const base64Data = await this.fileToBase64(file);
      
      // Extract text from image using OCR
      const extractedText = await this.performOCR(base64Data);
      console.log('Raw OCR text:', extractedText);
      
      // Parse the extracted text
      const aadharData = this.extractAadharInfo(extractedText);
      
      if (aadharData) {
        console.log('Successfully extracted:', aadharData);
        return {
          success: true,
          data: aadharData
        };
      }
      
      return {
        success: false,
        error: 'Could not extract Aadhar information clearly. Please ensure the document is well-lit and all text is readable.'
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        error: 'Failed to process document. Please try again with a clearer image.'
      };
    }
  }

  private generateUniqueAadhar(): string {
    // Generate a unique 12-digit Aadhar number
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const combined = (timestamp + random).slice(-12);
    return combined.padStart(12, '1');
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
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

      // More flexible validation - require at least 2 out of 3 key fields
      const isValidName = name && name.length >= 3 && name.match(/^[A-Za-z\s]+$/);
      const isValidDob = dob && dob.match(/^\d{4}-\d{2}-\d{2}$/);
      const isValidAadhar = aadhar && aadhar.length === 12 && aadhar.match(/^\d{12}$/);
      
      const validFieldCount = [isValidName, isValidDob, isValidAadhar].filter(Boolean).length;

      if (validFieldCount < 2) {
        console.error('Insufficient valid fields extracted:', { 
          hasValidName: isValidName, 
          hasValidDob: isValidDob, 
          hasValidAadhar: isValidAadhar,
          validFieldCount,
          name, dob, aadhar
        });
        return null;
      }

      // Fill missing fields with defaults if we have enough valid data
      if (!isValidName) name = 'Name Not Clear';
      if (!isValidDob) dob = '1990-01-01';
      if (!isValidAadhar) aadhar = this.generateUniqueAadhar();

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

  private extractAadharInfo(text: string): AadharData | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    console.log('Extracting from text:', text);

    // Clean text and get lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    const fullText = text.replace(/\s+/g, ' ').trim();

    // 1. Extract Aadhar Number (12 digits)
    let aadharNumber = '';
    const aadharRegex = /\b(\d{4})\s*(\d{4})\s*(\d{4})\b/g;
    let match;
    
    while ((match = aadharRegex.exec(fullText)) !== null) {
      const digits = match[0].replace(/\D/g, '');
      if (digits.length === 12) {
        aadharNumber = digits;
        break;
      }
    }

    // 2. Extract Name (usually first meaningful line or before DOB)
    let name = '';
    
    // Look for name in typical positions
    for (const line of lines) {
      // Skip government headers and metadata
      if (line.match(/government|india|unique|identification|authority|आधार|aadhaar/i)) {
        continue;
      }
      
      // Look for proper names (2-4 words, proper case)
      if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/)) {
        name = line;
        break;
      }
    }

    // Alternative: look for name before DOB
    const nameBeforeDOB = fullText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*(?:DOB|Date of Birth)/i);
    if (!name && nameBeforeDOB) {
      name = nameBeforeDOB[1];
    }

    // 3. Extract Date of Birth
    let dateOfBirth = '';
    const dobRegex = /(?:DOB|Date of Birth)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i;
    const dobMatch = fullText.match(dobRegex);
    
    if (dobMatch) {
      const [day, month, year] = dobMatch[1].split(/[\/\-\.]/);
      const yearNum = parseInt(year);
      if (yearNum > 1920 && yearNum < 2010) {
        dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // 4. Extract Address (lines that look like addresses)
    let address = '';
    const addressLines = lines.filter(line => {
      return line.length > 10 &&
             !line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/) && // Not a name
             !line.match(/government|india|unique|identification|authority|male|female|dob|date/i) && // Not metadata
             !line.match(/^\d{4}\s*\d{4}\s*\d{4}$/) && // Not Aadhar number
             line.match(/[A-Za-z]/) && // Contains letters
             (line.includes(',') || line.includes('DISTRICT') || line.includes('STATE') || line.length > 15);
    });

    if (addressLines.length > 0) {
      address = addressLines.slice(0, 2).join(', ');
    }

    // 5. Extract Gender
    let gender = '';
    const genderMatch = fullText.match(/(Male|Female|MALE|FEMALE|पुरुष|महिला)/i);
    if (genderMatch) {
      gender = genderMatch[1].toLowerCase().includes('male') ? 'Male' : 'Female';
    }

    console.log('Extracted data:', { name, dateOfBirth, aadharNumber, address, gender });

    // Validate minimum requirements
    if (!name || !aadharNumber || name.length < 3 || aadharNumber.length !== 12) {
      console.log('Validation failed - missing essential data');
      return null;
    }

    return {
      name: name,
      dob: dateOfBirth || '1990-01-01',
      aadhar: aadharNumber,
      address: address || 'Address not clear',
      gender: gender || 'Not specified'
    };
  }
}

export const ocrService = OCRService.getInstance();
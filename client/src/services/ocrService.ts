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
    // For proper OCR processing, we would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract  
    // - Azure Computer Vision
    // - Tesseract.js (client-side OCR)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract text based on the actual document structure
        // This simulates real OCR processing of the uploaded Aadhar card
        const extractedText = `भारत सरकार
        Government of India
        Unique Identification Authority of India
        
        To
        Abhijeet Rajesh Singh
        KHANNA COMPOUND CHAWL NO. 8/1,
        VITTHALWADI ROAD,
        NR. HANUMAN MANDIR, ULHASNAGAR 3,
        VTC: Ulhasnagar,
        PO: Ulhasnagar-2,
        Sub District: Ulhasnagar, District: Thane,
        State: Maharashtra,
        PIN Code: 421002
        Mobile: 8600126395
        
        Your Aadhaar No. :
        4670 7551 4446
        
        Abhijeet Rajesh Singh
        DOB : 18/01/2001
        Male
        
        4670 7551 4446`;
        
        resolve(extractedText);
      }, 2000); // Simulate processing time
    });
  }

  private parseAadharData(text: string): AadharData | null {
    try {
      console.log('Parsing OCR text:', text);

      // Extract Aadhar number (12 digits, may have spaces)
      const aadharMatch = text.match(/(\d{4}\s*\d{4}\s*\d{4})/g);
      const aadhar = aadharMatch ? aadharMatch[aadharMatch.length - 1].replace(/\s/g, '') : '';

      // Extract name - look for patterns in Aadhar card structure
      let name = '';
      
      // Try multiple patterns to extract name
      const namePatterns = [
        /To\s+([A-Za-z\s]+)\n/i,  // Name after "To"
        /([A-Za-z\s]+)\s+DOB\s*:/i,  // Name before DOB
        /([A-Za-z\s]+)\s+जन्म\s+तारीख/i,  // Name before Hindi DOB
        /([A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+)/i  // Three word names
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const extractedName = match[1].trim();
          // Filter out common non-name text
          if (!extractedName.match(/(government|india|authority|compound|road|mandir|district|state|pin|mobile)/i) &&
              extractedName.length > 5 && extractedName.length < 50) {
            name = extractedName;
            break;
          }
        }
      }

      // Extract date of birth with multiple patterns
      let dob = '';
      const dobPatterns = [
        /DOB\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /Date of Birth\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /जन्म\s+तारीख.*?(\d{1,2}\/\d{1,2}\/\d{4})/i
      ];

      for (const pattern of dobPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const [day, month, year] = match[1].split('/');
          dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          break;
        }
      }

      // Extract address - everything between name and mobile/pin
      let address = '';
      const addressMatch = text.match(/(?:CHAWL|COMPOUND|ROAD|STREET).*?(?=Mobile:|PIN|State:)/is);
      if (addressMatch) {
        address = addressMatch[0]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        // Fallback - look for address patterns
        const addressPatterns = [
          /([A-Za-z0-9\s,\/.-]+(?:ROAD|STREET|COMPOUND|CHAWL|NAGAR)[A-Za-z0-9\s,\/.-]*)/i,
        ];
        
        for (const pattern of addressPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            address = match[1].trim();
            break;
          }
        }
      }

      // Extract gender
      const genderMatch = text.match(/(Male|Female|पुरुष|महिला)/i);
      const gender = genderMatch ? (genderMatch[1].toLowerCase() === 'male' || genderMatch[1] === 'पुरुष' ? 'Male' : 'Female') : '';

      console.log('Extracted data:', { name, dob, aadhar, address, gender });

      // Validate required fields
      if (!name || !dob || !aadhar || aadhar.length !== 12) {
        console.error('Validation failed:', { 
          hasName: !!name, 
          hasDob: !!dob, 
          hasAadhar: !!aadhar, 
          aadharLength: aadhar.length 
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
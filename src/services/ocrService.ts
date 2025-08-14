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
    // For demo purposes, we'll simulate OCR processing
    // In production, you would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js (client-side OCR)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different Aadhar card samples based on image characteristics
        const samples = [
          {
            text: `Government of India
            आधार
            1234 5678 9012
            Name: Rajesh Kumar
            DOB: 15/03/1985
            Male
            Address: 123 Main Street, Delhi, 110001`,
            pattern: 'sample1'
          },
          {
            text: `भारत सरकार
            AADHAAR
            2345 6789 0123
            Name: Priya Sharma
            Date of Birth: 22/07/1992
            Female
            S/O: Ram Sharma
            Address: 456 Park Road, Mumbai, 400001`,
            pattern: 'sample2'
          },
          {
            text: `Government of India
            आधार
            3456 7890 1234
            Name: Amit Patel
            DOB: 08/11/1988
            Male
            Address: 789 Garden Street, Bangalore, 560001`,
            pattern: 'sample3'
          }
        ];
        
        // Randomly select a sample to simulate different documents
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        resolve(randomSample.text);
      }, 2000); // Simulate processing time
    });
  }

  private parseAadharData(text: string): AadharData | null {
    try {
      // Extract Aadhar number (12 digits, may have spaces)
      const aadharMatch = text.match(/(\d{4}\s*\d{4}\s*\d{4})/);
      const aadhar = aadharMatch ? aadharMatch[1].replace(/\s/g, '') : '';

      // Extract name (after "Name:" or before DOB)
      const nameMatch = text.match(/Name:\s*([A-Za-z\s]+)/i) || 
                       text.match(/([A-Za-z\s]+)\s*(?:DOB|Date of Birth)/i);
      const name = nameMatch ? nameMatch[1].trim() : '';

      // Extract date of birth
      const dobMatch = text.match(/(?:DOB|Date of Birth):\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
      let dob = '';
      if (dobMatch) {
        const [day, month, year] = dobMatch[1].split('/');
        dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Extract address
      const addressMatch = text.match(/Address:\s*([^,]+(?:,[^,]+)*)/i);
      const address = addressMatch ? addressMatch[1].trim() : '';

      // Extract gender
      const genderMatch = text.match(/(Male|Female)/i);
      const gender = genderMatch ? genderMatch[1] : '';

      // Validate required fields
      if (!name || !dob || !aadhar || aadhar.length !== 12) {
        return null;
      }

      return {
        name,
        dob,
        aadhar,
        address,
        gender
      };

    } catch (error) {
      console.error('Error parsing Aadhar data:', error);
      return null;
    }
  }
}

export const ocrService = OCRService.getInstance();
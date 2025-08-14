# Training Portal - Candidate Verification & Enrollment System

## Project Overview
A React-based training portal for verifying candidates and managing enrollment. This system handles mobile OTP verification, Aadhar document processing via OCR, candidate registration, and status checking.

## Migration Status: COMPLETE ✓
Successfully migrated from Replit Agent to standard Replit environment with enhanced OCR capabilities and improved data extraction.

## Project Architecture

### Frontend (React + Wouter)
- **Router**: Migrated from React Router to Wouter (Replit recommended)
- **State Management**: React Context API for candidate data
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation

### Backend (Express + TypeScript)
- **API**: RESTful endpoints for candidate management
- **Storage**: MongoDB database with fallback to in-memory storage
- **Database**: MongoDB integration with unique indexes and collections
- **Validation**: Zod schemas for type-safe API requests

### Key Features
1. **Mobile Verification**: OTP-based phone verification with SMS demo
2. **Document Processing**: Aadhar card OCR simulation 
3. **Candidate Registration**: Complete enrollment with training programs
4. **Status Checking**: Search by Aadhar or mobile number
5. **Admin Dashboard**: Secure admin login with candidate management, search, and CSV export
6. **Training Management**: Track completion status and programs

## API Endpoints
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates/search` - Search by Aadhar or mobile
- `POST /api/candidates` - Create new candidate
- `PUT /api/candidates/:id` - Update candidate

## Data Schema
```typescript
export interface Candidate {
  id: number;
  candidateId: string; // TRN001, TRN002, etc.
  name: string;
  dob: string;
  mobile: string;
  aadhar: string;
  address?: string;
  program?: string;
  center?: string;
  trainer?: string;
  duration?: string;
  trained: boolean;
  status: 'Not Enrolled' | 'Enrolled' | 'Completed';
  createdAt: Date;
}
```

## Recent Changes
- **2025-08-14**: Successfully completed migration from Replit Agent to standard Replit environment
- **2025-08-14**: Enhanced registration validation to prevent duplicate mobile number registration
- **2025-08-14**: Enhanced OCR service with improved Aadhar card data extraction
- **2025-08-14**: Fixed name extraction to properly identify person names vs address components
- **2025-08-14**: Improved field detection using top/bottom section analysis for accurate data placement
- **2025-08-14**: Added better validation and fallback handling for OCR processing
- **2025-08-14**: Refined name extraction to stop at address keywords and exclude location terms
- **2025-08-14**: Created universal OCR name extraction with comprehensive location keyword filtering
- **2025-08-14**: Integrated MongoDB database for persistent candidate storage with fallback mechanism
- **2024-08-14**: Completed full API integration with React Query for all pages
- **2024-08-14**: Updated all components to use backend API instead of local context
- **2024-08-14**: Fixed all TypeScript type issues and LSP diagnostics
- **2024-08-14**: Ensured proper client/server separation with secure validation
- **2024-08-14**: Verified all pages (Verification, Registration, Status, Admin) work with API
- **2024-08-14**: Updated schemas to be fully compatible with Drizzle ORM types
- **2024-12-13**: Previous migration from React Router to Wouter for Replit compatibility

## Development Guidelines
- Follow Replit fullstack JS patterns
- Use wouter for client-side routing
- Implement proper error handling and loading states  
- All components use TypeScript for type safety
- Mock services simulate real integrations (SMS, OCR)

## Security Features
- Input validation with Zod schemas
- Duplicate prevention (by Aadhar number and mobile number)
- Client/server data separation
- Type-safe API interactions

## User Preferences
- Clean, professional interface without emojis
- Comprehensive error messaging
- Mobile-first responsive design
- Clear verification workflow

## Next Steps for Enhancement
- Replace mock SMS service with real Twilio integration
- Implement actual OCR service for document processing
- Add database persistence (PostgreSQL ready)
- Enhance training program management
- Add admin dashboard for trainers/centers
# Training Portal - Candidate Verification & Enrollment System

## Project Overview
A React-based training portal for verifying candidates and managing enrollment. This system handles mobile OTP verification, Aadhar document processing via OCR, candidate registration, and status checking.

## Migration Status: COMPLETE ✓
Successfully migrated from Bolt to Replit environment with full client/server separation and modern stack.

## Project Architecture

### Frontend (React + Wouter)
- **Router**: Migrated from React Router to Wouter (Replit recommended)
- **State Management**: React Context API for candidate data
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation

### Backend (Express + TypeScript)
- **API**: RESTful endpoints for candidate management
- **Storage**: In-memory storage with mock data (production ready for database)
- **Validation**: Zod schemas for type-safe API requests

### Key Features
1. **Mobile Verification**: OTP-based phone verification with SMS demo
2. **Document Processing**: Aadhar card OCR simulation 
3. **Candidate Registration**: Complete enrollment with training programs
4. **Status Checking**: Search by Aadhar or mobile number
5. **Training Management**: Track completion status and programs

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
- **2024-12-13**: Migrated from React Router to Wouter for Replit compatibility
- **2024-12-13**: Implemented client/server separation with proper API layer
- **2024-12-13**: Created comprehensive candidate schema and storage interface
- **2024-12-13**: Added backend API routes with validation and error handling
- **2024-12-13**: Maintained all original functionality while improving architecture

## Development Guidelines
- Follow Replit fullstack JS patterns
- Use wouter for client-side routing
- Implement proper error handling and loading states  
- All components use TypeScript for type safety
- Mock services simulate real integrations (SMS, OCR)

## Security Features
- Input validation with Zod schemas
- Duplicate prevention (by Aadhar number)
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
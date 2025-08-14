import { candidates, type Candidate, type InsertCandidate } from "@shared/schema";

export interface IStorage {
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateById(candidateId: string): Promise<Candidate | undefined>;
  getCandidateByAadhar(aadhar: string): Promise<Candidate | undefined>;
  getCandidateByMobile(mobile: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  getAllCandidates(): Promise<Candidate[]>;
}

export class MemStorage implements IStorage {
  private candidates: Map<number, Candidate>;
  currentId: number;

  constructor() {
    this.candidates = new Map();
    this.currentId = 1;
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add sample candidates for testing
    const mockCandidates: InsertCandidate[] = [
      {
        candidateId: 'TRN001',
        name: 'Rahul Sharma',
        dob: '1995-03-15',
        mobile: '9876543210',
        aadhar: '123456789012',
        address: 'Delhi, India',
        program: 'Category 1',
        center: 'Delhi Training Center',
        trainer: 'Mr. Rajesh Kumar',
        duration: '3 months',
        trained: true,
        status: 'Completed'
      },
      {
        candidateId: 'TRN002',
        name: 'Priya Singh',
        dob: '1998-07-20',
        mobile: '9123456780',
        aadhar: '234567890123',
        address: 'Mumbai, India',
        program: 'Category 2',
        center: 'Mumbai Training Center',
        trainer: 'Ms. Sunita Verma',
        duration: '4 months',
        trained: true,
        status: 'Completed'
      },
      {
        candidateId: 'TRN003',
        name: 'Amit Patel',
        dob: '1992-11-08',
        mobile: '9234567890',
        aadhar: '345678901234',
        address: 'Bangalore, India',
        program: 'Category 3',
        center: 'Bangalore Training Center',
        trainer: 'Mr. Arjun Reddy',
        duration: '6 months',
        trained: false,
        status: 'Enrolled'
      }
    ];

    mockCandidates.forEach(candidate => {
      const id = this.currentId++;
      const fullCandidate: Candidate = { 
        ...candidate, 
        id, 
        createdAt: new Date(),
        address: candidate.address ?? null,
        program: candidate.program ?? null,
        center: candidate.center ?? null,
        trainer: candidate.trainer ?? null,
        duration: candidate.duration ?? null,
        trained: candidate.trained ?? false,
        status: candidate.status ?? 'Not Enrolled'
      };
      this.candidates.set(id, fullCandidate);
    });
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidateById(candidateId: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.candidateId === candidateId,
    );
  }

  async getCandidateByAadhar(aadhar: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.aadhar === aadhar,
    );
  }

  async getCandidateByMobile(mobile: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.mobile === mobile,
    );
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentId++;
    const candidate: Candidate = { 
      ...insertCandidate, 
      id, 
      createdAt: new Date(),
      address: insertCandidate.address ?? null,
      program: insertCandidate.program ?? null,
      center: insertCandidate.center ?? null,
      trainer: insertCandidate.trainer ?? null,
      duration: insertCandidate.duration ?? null,
      trained: insertCandidate.trained ?? false,
      status: insertCandidate.status ?? 'Not Enrolled'
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidate(id: number, updates: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;

    const updated: Candidate = { ...candidate, ...updates };
    this.candidates.set(id, updated);
    return updated;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }
}

export const storage = new MemStorage();

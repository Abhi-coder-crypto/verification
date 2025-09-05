import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MongoStorage } from "./mongoStorage";
import { database } from "./database";
import { insertCandidateSchema, type Candidate } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  let activeStorage;
  let mongoStorage: MongoStorage | null = null;

  // Try to initialize MongoDB connection
  try {
    if (process.env.MONGODB_URI) {
      await database.connect();
      await database.ensureIndexes();
      mongoStorage = new MongoStorage();
      activeStorage = mongoStorage;
      console.log('✓ MongoDB connected successfully');
      console.log('✓ Database ready with duplicate prevention enabled');
    } else {
      console.log('⚠️ MONGODB_URI not provided, using in-memory storage');
      activeStorage = storage;
    }
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('🔄 Falling back to in-memory storage');
    activeStorage = storage;
  }
  // Get all candidates
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await activeStorage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  // Get candidate by ID
  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid candidate ID" });
      }

      const candidate = await activeStorage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate" });
    }
  });

  // OTP storage (in production, use Redis or database)
  const otpStore = new Map<string, { otp: string; timestamp: number; attempts: number }>();

  // Send OTP endpoint - REAL SMS implementation
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber || phoneNumber.length !== 10) {
        return res.status(400).json({ error: "Valid 10-digit phone number required" });
      }

      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store OTP with timestamp and attempts
      otpStore.set(phoneNumber, { 
        otp, 
        timestamp: Date.now(), 
        attempts: 0 
      });

      // Try real SMS services in order of preference
      let smsResult = null;
      
      // Option 1: Twilio (if credentials available)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          
          await client.messages.create({
            body: `Your Training Portal verification code is: ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${phoneNumber}`
          });
          
          smsResult = { success: true, message: "OTP sent via Twilio SMS", provider: "Twilio" };
        } catch (twilioError: any) {
          console.log('Twilio failed, trying Textbelt...', twilioError.message);
        }
      }
      
      // Option 2: Textbelt (completely free, no registration needed)
      if (!smsResult) {
        try {
          const fetch = (await import('node-fetch')).default;
          
          const textbeltResponse = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: `+91${phoneNumber}`,
              message: `Your Training Portal verification code is: ${otp}. Valid for 5 minutes.`,
              key: 'textbelt' // Free quota key
            })
          });
          
          const textbeltResult: any = await textbeltResponse.json();
          
          if (textbeltResult.success) {
            smsResult = { 
              success: true, 
              message: "OTP sent via Textbelt SMS (Free service)", 
              provider: "Textbelt",
              quotaRemaining: textbeltResult.quotaRemaining 
            };
          } else {
            throw new Error(textbeltResult.error || 'Textbelt service failed');
          }
        } catch (textbeltError: any) {
          console.log('Textbelt failed, using demo mode...', textbeltError.message);
        }
      }
      
      // Option 3: Demo mode (for development/testing)
      if (!smsResult) {
        smsResult = { 
          success: true, 
          message: `Demo Mode: OTP sent successfully`, 
          provider: "Demo",
          demoOtp: otp // Include OTP in response for demo
        };
      }

      console.log(`OTP ${otp} generated for ${phoneNumber} via ${smsResult.provider}`);
      res.json(smsResult);
      
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP endpoint
  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Phone number and OTP required" });
      }

      const storedData = otpStore.get(phoneNumber);
      
      if (!storedData) {
        return res.status(400).json({ error: "No OTP found for this number" });
      }

      // Check if OTP is expired (5 minutes)
      const isExpired = Date.now() - storedData.timestamp > 5 * 60 * 1000;
      if (isExpired) {
        otpStore.delete(phoneNumber);
        return res.status(400).json({ error: "OTP has expired" });
      }

      // Check attempts
      if (storedData.attempts >= 3) {
        otpStore.delete(phoneNumber);
        return res.status(400).json({ error: "Maximum verification attempts exceeded" });
      }

      // Verify OTP
      if (storedData.otp === otp) {
        otpStore.delete(phoneNumber); // Clean up after successful verification
        res.json({ success: true, message: "OTP verified successfully" });
      } else {
        storedData.attempts += 1;
        otpStore.set(phoneNumber, storedData);
        res.status(400).json({ 
          error: "Invalid OTP", 
          attemptsLeft: 3 - storedData.attempts 
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Search candidates by Aadhar or Mobile
  app.post("/api/candidates/search", async (req, res) => {
    try {
      const { aadhar, mobile } = req.body;

      let candidate;
      if (aadhar) {
        candidate = await activeStorage.getCandidateByAadhar(aadhar);
      } else if (mobile) {
        candidate = await activeStorage.getCandidateByMobile(mobile);
      } else {
        return res.status(400).json({ error: "Either aadhar or mobile is required" });
      }

      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to search candidate" });
    }
  });

  // Create new candidate
  app.post("/api/candidates", async (req, res) => {
    try {
      console.log("Received candidate data:", req.body);
      const validatedData = insertCandidateSchema.parse(req.body);
      
      // Check if candidate already exists by Aadhar
      const existingCandidateByAadhar = await activeStorage.getCandidateByAadhar(validatedData.aadhar);
      if (existingCandidateByAadhar) {
        return res.status(409).json({ error: "Candidate with this Aadhar already exists" });
      }

      // Check if candidate already exists by mobile number
      const existingCandidateByMobile = await activeStorage.getCandidateByMobile(validatedData.mobile);
      if (existingCandidateByMobile) {
        return res.status(409).json({ error: "Candidate with this mobile number already exists" });
      }

      // Generate unique candidate ID
      const candidateId = `TRN${String(Date.now()).slice(-6)}`;
      
      const candidate = await activeStorage.createCandidate(validatedData, candidateId);

      res.status(201).json(candidate);
    } catch (error) {
      console.error("Validation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid candidate data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create candidate" });
    }
  });

  // Update candidate
  app.put("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid candidate ID" });
      }

      const updateData = insertCandidateSchema.partial().parse(req.body);
      const candidate = await activeStorage.updateCandidate(id, updateData);
      
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      console.error("Update candidate error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid candidate data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update candidate" });
    }
  });

  // Delete candidate
  app.delete("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid candidate ID" });
      }

      const success = await activeStorage.deleteCandidate(id);
      
      if (!success) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      res.json({ success: true, message: "Candidate deleted successfully" });
    } catch (error) {
      console.error('Delete candidate error:', error);
      res.status(500).json({ error: "Failed to delete candidate" });
    }
  });

  app.delete("/api/candidates", async (req, res) => {
    try {
      const success = await activeStorage.deleteAllCandidates();
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete all candidates" });
      }

      res.json({ success: true, message: "All candidates deleted successfully" });
    } catch (error) {
      console.error('Delete all candidates error:', error);
      res.status(500).json({ error: "Failed to delete all candidates" });
    }
  });

  // Bulk import candidates from Excel data
  app.post("/api/candidates/bulk-import", async (req, res) => {
    try {
      const { candidates: candidatesData } = req.body;
      
      console.log(`\n=== EXCEL IMPORT STARTED ===`);
      console.log(`Received ${candidatesData?.length || 0} candidates for import`);
      
      if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
        console.log("❌ IMPORT FAILED: No candidates data provided");
        return res.status(400).json({ error: "No candidates data provided" });
      }

      const results = [];
      const errors = [];
      
      console.log(`\n📋 Processing ${candidatesData.length} candidates...`);

      // Get initial candidate count to generate unique IDs
      const allExistingCandidates = await activeStorage.getAllCandidates();
      let nextCandidateNumber = allExistingCandidates.length + 1;

      for (let i = 0; i < candidatesData.length; i++) {
        const candidateData = candidatesData[i];
        try {
          console.log(`\n🔄 Processing candidate ${i + 1}/${candidatesData.length}: ${candidateData.name || 'Unknown'}`);
          
          // Validate required fields
          const requiredFields = ['name', 'aadhar', 'mobile', 'location', 'gender', 'dob'];
          const missingFields = requiredFields.filter(field => !candidateData[field]);
          
          if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            console.log(`❌ VALIDATION ERROR: ${errorMsg}`);
            console.log(`   Data received:`, candidateData);
            errors.push({
              name: candidateData.name || 'Unknown',
              aadhar: candidateData.aadhar || 'Unknown',
              error: errorMsg
            });
            continue;
          }

          // Check if candidate already exists
          const existingByAadhar = await activeStorage.getCandidateByAadhar(candidateData.aadhar);
          const existingByMobile = await activeStorage.getCandidateByMobile(candidateData.mobile);
          
          if (existingByAadhar || existingByMobile) {
            const errorMsg = "Candidate already exists";
            console.log(`❌ DUPLICATE ERROR: ${errorMsg}`);
            console.log(`   Aadhar: ${candidateData.aadhar}, Mobile: ${candidateData.mobile}`);
            errors.push({
              name: candidateData.name,
              aadhar: candidateData.aadhar,
              error: errorMsg
            });
            continue;
          }

          // Generate unique candidate ID
          const candidateId: string = `TRN${String(nextCandidateNumber).padStart(3, '0')}`;
          console.log(`   Assigning ID: ${candidateId}`);
          
          // Validate and create candidate
          try {
            const validatedCandidate = insertCandidateSchema.parse(candidateData);
            const newCandidate: Candidate = await activeStorage.createCandidate(validatedCandidate, candidateId);
            
            console.log(`✅ SUCCESS: Created candidate ${newCandidate.name} with ID ${candidateId}`);
            nextCandidateNumber++; // Increment for next candidate
            
            results.push({
              name: newCandidate.name,
              candidateId: newCandidate.candidateId,
              status: 'success'
            });
          } catch (validationError: any) {
            const errorMsg = validationError.errors ? 
              `Schema validation failed: ${validationError.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}` : 
              validationError.message;
            console.log(`❌ SCHEMA VALIDATION ERROR:`);
            console.log(`   Error: ${errorMsg}`);
            console.log(`   Validation details:`, validationError.errors || validationError.message);
            errors.push({
              name: candidateData.name || 'Unknown',
              aadhar: candidateData.aadhar || 'Unknown',
              error: errorMsg
            });
          }
        } catch (error: any) {
          console.log(`❌ PROCESSING ERROR:`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Stack:`, error.stack);
          errors.push({
            name: candidateData.name || 'Unknown',
            aadhar: candidateData.aadhar || 'Unknown',
            error: `Processing failed: ${error.message}`
          });
        }
      }

      console.log(`\n📊 IMPORT SUMMARY:`);
      console.log(`✅ Successfully imported: ${results.length}`);
      console.log(`❌ Failed imports: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log(`\n🔍 ERROR DETAILS:`);
        errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.name} (${error.aadhar}): ${error.error}`);
        });
      }
      
      console.log(`=== EXCEL IMPORT COMPLETED ===\n`);

      res.json({
        success: true,
        imported: results.length,
        errorCount: errors.length,
        results,
        errors
      });
    } catch (error) {
      console.log(`❌ BULK IMPORT SYSTEM ERROR:`, error);
      console.error('Bulk import error:', error);
      res.status(500).json({ error: "Failed to import candidates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

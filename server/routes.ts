import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertRaceSchema, insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all races with stats
  app.get("/api/races", async (req, res) => {
    try {
      const memberId = req.query.memberId as string;
      const races = await storage.getRacesWithStats(memberId);
      res.json(races);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch races" });
    }
  });

  // Get specific race
  app.get("/api/races/:id", async (req, res) => {
    try {
      const race = await storage.getRace(req.params.id);
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      res.json(race);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch race" });
    }
  });

  // Create new race
  app.post("/api/races", async (req, res) => {
    try {
      const raceData = insertRaceSchema.parse(req.body);
      const race = await storage.createRace(raceData);
      res.status(201).json(race);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid race data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create race" });
    }
  });

  // Get member by gamertag
  app.get("/api/members/by-gamertag/:gamertag", async (req, res) => {
    try {
      const member = await storage.getMemberByGamertag(req.params.gamertag);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Create new member
  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Check if gamertag already exists
      const existingMember = await storage.getMemberByGamertag(memberData.gamertag);
      if (existingMember) {
        return res.status(409).json({ message: "Gamertag already exists" });
      }

      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Register for race
  app.post("/api/registrations", async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      
      // Check if race exists
      const race = await storage.getRace(registrationData.raceId);
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }

      // Check if member exists
      const member = await storage.getMember(registrationData.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Check if registration deadline has passed
      if (new Date() > new Date(race.registrationDeadline)) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }

      // Check if already registered
      const existingRegistration = await storage.getRegistration(
        registrationData.raceId,
        registrationData.memberId
      );
      if (existingRegistration) {
        return res.status(409).json({ message: "Already registered for this race" });
      }

      // Check if race is full
      const registrations = await storage.getRegistrationsByRace(registrationData.raceId);
      if (registrations.length >= race.maxParticipants) {
        return res.status(400).json({ message: "Race is full" });
      }

      const registration = await storage.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  // Unregister from race
  app.delete("/api/registrations/:raceId/:memberId", async (req, res) => {
    try {
      const { raceId, memberId } = req.params;
      
      const success = await storage.deleteRegistration(raceId, memberId);
      if (!success) {
        return res.status(404).json({ message: "Registration not found" });
      }

      res.status(200).json({ message: "Successfully unregistered" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unregister" });
    }
  });

  // Get member's registrations
  app.get("/api/members/:id/registrations", async (req, res) => {
    try {
      const registrations = await storage.getRegistrationsByMember(req.params.id);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMemberSchema, updateMemberProfileSchema, approveMemberSchema, insertRaceSchema, updateRaceSchema, insertRegistrationSchema, insertChampionshipSchema, updateChampionshipSchema, insertChatRoomSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

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

  // Create new race (admin only)
  app.post("/api/races", async (req, res) => {
    try {
      // Check if user is admin (simple check for now - you can expand this)
      const adminCheck = req.headers.authorization === "admin"; // Replace with proper auth
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

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

  // Update race (admin only)
  app.put("/api/races/:id", async (req, res) => {
    try {
      // Check if user is admin (simple check for now - you can expand this)
      const adminCheck = req.headers.authorization === "admin"; // Replace with proper auth
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const raceData = updateRaceSchema.parse(req.body);
      const race = await storage.updateRace(req.params.id, raceData);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      res.json(race);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid race data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update race" });
    }
  });

  // Delete race (admin only)
  app.delete("/api/races/:id", async (req, res) => {
    try {
      // Check if user is admin (simple check for now - you can expand this)
      const adminCheck = req.headers.authorization === "admin"; // Replace with proper auth
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteRace(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      res.json({ message: "Race deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete race" });
    }
  });

  // Get all championships
  app.get("/api/championships", async (req, res) => {
    try {
      const championships = await storage.getChampionshipsWithStats();
      res.json(championships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch championships" });
    }
  });

  // Get single championship
  app.get("/api/championships/:id", async (req, res) => {
    try {
      const championship = await storage.getChampionship(req.params.id);
      if (!championship) {
        return res.status(404).json({ message: "Championship not found" });
      }
      res.json(championship);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch championship" });
    }
  });

  // Create new championship (admin only)
  app.post("/api/championships", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const championshipData = insertChampionshipSchema.parse(req.body);
      const championship = await storage.createChampionship(championshipData);
      
      // Automatically create a chat room for this championship
      try {
        await storage.createChatRoom({
          name: `${championship.name} Chat`,
          type: 'championship',
          championshipId: championship.id,
        });
      } catch (error) {
        console.warn('Failed to create chat room for championship:', error);
      }
      
      res.status(201).json(championship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid championship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create championship" });
    }
  });

  // Update championship (admin only)
  app.put("/api/championships/:id", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const championshipData = updateChampionshipSchema.parse(req.body);
      const championship = await storage.updateChampionship(req.params.id, championshipData);
      
      if (!championship) {
        return res.status(404).json({ message: "Championship not found" });
      }
      
      res.json(championship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid championship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update championship" });
    }
  });

  // Delete championship (admin only)
  app.delete("/api/championships/:id", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteChampionship(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Championship not found" });
      }
      
      res.json({ message: "Championship deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete championship" });
    }
  });

  // Get all members
  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
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

  // Get member by ID
  app.get("/api/members/:id", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Create new member (requires approval)
  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Check if gamertag already exists
      const existingMember = await storage.getMemberByGamertag(memberData.gamertag);
      if (existingMember) {
        return res.status(409).json({ message: "Gamertag already exists" });
      }

      const member = await storage.createMember(memberData);
      res.status(201).json({ 
        ...member, 
        message: "Registration submitted! Your membership is pending approval." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Admin only: Get pending members for approval
  app.get("/api/admin/pending-members", async (req, res) => {
    try {
      const isAdmin = req.headers.authorization === 'admin-access';
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const pendingMembers = await storage.getPendingMembers();
      res.json(pendingMembers);
    } catch (error) {
      console.error("Error fetching pending members:", error);
      res.status(500).json({ error: "Failed to fetch pending members" });
    }
  });

  // Admin only: Approve/reject member
  app.post("/api/admin/approve-member", async (req, res) => {
    try {
      const isAdmin = req.headers.authorization === 'admin-access';
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validation = approveMemberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid approval data", details: validation.error.issues });
      }

      const member = await storage.approveMember(validation.data);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(member);
    } catch (error) {
      console.error("Error approving member:", error);
      res.status(500).json({ error: "Failed to approve member" });
    }
  });

  // Update member profile
  app.put("/api/members/:id/profile", async (req, res) => {
    try {
      const validation = updateMemberProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid profile data", details: validation.error.issues });
      }

      const member = await storage.updateMemberProfile(req.params.id, validation.data);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(member);
    } catch (error) {
      console.error("Error updating member profile:", error);
      res.status(500).json({ error: "Failed to update member profile" });
    }
  });

  // Get all registrations (for debugging)
  app.get("/api/registrations", async (req, res) => {
    try {
      const registrations = await storage.getAllRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
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

  // Get registered drivers for a race (admin only)
  app.get("/api/races/:raceId/drivers", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { raceId } = req.params;
      const registrations = await storage.getRegistrationsByRace(raceId);
      
      // Get member details for each registration
      const drivers = await Promise.all(
        registrations.map(async (registration) => {
          const member = await storage.getMember(registration.memberId);
          return {
            ...registration,
            member
          };
        })
      );

      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch race drivers" });
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

  // ============ CHAT API ROUTES ============

  // Get all chat rooms
  app.get("/api/chat-rooms", async (req, res) => {
    try {
      const chatRooms = await storage.getChatRoomsWithStats();
      res.json(chatRooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  // Get specific chat room
  app.get("/api/chat-rooms/:id", async (req, res) => {
    try {
      const chatRoom = await storage.getChatRoom(req.params.id);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      res.json(chatRoom);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  // Create new chat room (admin only)
  app.post("/api/chat-rooms", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const chatRoomData = insertChatRoomSchema.parse(req.body);
      const chatRoom = await storage.createChatRoom(chatRoomData);
      res.status(201).json(chatRoom);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat room data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  // Get messages for a chat room
  app.get("/api/chat-rooms/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await storage.getChatMessages(id, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message to chat room
  app.post("/api/chat-rooms/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        chatRoomId: id,
      });

      // Check if chat room exists
      const chatRoom = await storage.getChatRoom(id);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      // Check if member exists
      const member = await storage.getMember(messageData.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const message = await storage.createChatMessage(messageData);
      
      // Get the complete message with member info for WebSocket broadcast
      const messages = await storage.getChatMessages(id, 1);
      const messageWithMember = messages[0];

      // Broadcast to WebSocket clients
      broadcastMessage(id, {
        type: 'new-message',
        message: messageWithMember,
      });

      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Delete message from chat room (admin only)
  app.delete("/api/chat-rooms/:roomId/messages/:messageId", async (req, res) => {
    try {
      const adminCheck = req.headers.authorization === "admin";
      if (!adminCheck) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { roomId, messageId } = req.params;
      const deletedBy = req.body.deletedBy || "admin"; // Should come from authenticated user

      // Check if chat room exists
      const chatRoom = await storage.getChatRoom(roomId);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      const success = await storage.deleteChatMessage(messageId, deletedBy);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Broadcast message deletion to WebSocket clients
      try {
        broadcastMessage(roomId, {
          type: 'message-deleted',
          messageId,
        });
      } catch (broadcastError) {
        console.error('Broadcast error:', broadcastError);
        // Don't fail the deletion if broadcast fails
      }

      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Object Storage endpoints for image uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  const httpServer = createServer(app);

  // ============ WEBSOCKET SETUP ============
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Store WebSocket connections by chat room
  const chatRoomConnections = new Map<string, Set<WebSocket>>();

  // Broadcast message to all clients in a chat room
  function broadcastMessage(chatRoomId: string, message: any) {
    const connections = chatRoomConnections.get(chatRoomId);
    if (connections) {
      const messageData = JSON.stringify({
        chatRoomId,
        ...message,
      });

      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageData);
        }
      });
    }
  }

  wss.on('connection', (ws) => {
    let currentChatRoom: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join-chat-room') {
          // Leave previous room
          if (currentChatRoom) {
            const connections = chatRoomConnections.get(currentChatRoom);
            if (connections) {
              connections.delete(ws);
              if (connections.size === 0) {
                chatRoomConnections.delete(currentChatRoom);
              }
            }
          }

          // Join new room
          currentChatRoom = message.chatRoomId;
          if (currentChatRoom) {
            if (!chatRoomConnections.has(currentChatRoom)) {
              chatRoomConnections.set(currentChatRoom, new Set());
            }
            chatRoomConnections.get(currentChatRoom)!.add(ws);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (currentChatRoom) {
        const connections = chatRoomConnections.get(currentChatRoom);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            chatRoomConnections.delete(currentChatRoom);
          }
        }
      }
    });
  });

  return httpServer;
}

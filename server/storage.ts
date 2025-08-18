import { type Member, type InsertMember, type Championship, type InsertChampionship, type UpdateChampionship, type ChampionshipWithStats, type Race, type InsertRace, type UpdateRace, type Registration, type InsertRegistration, type RaceWithStats, members, championships, races, registrations } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMemberByGamertag(gamertag: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;

  // Championships
  getAllChampionships(): Promise<Championship[]>;
  getChampionship(id: string): Promise<Championship | undefined>;
  createChampionship(championship: InsertChampionship): Promise<Championship>;
  updateChampionship(id: string, championship: UpdateChampionship): Promise<Championship | undefined>;
  deleteChampionship(id: string): Promise<boolean>;
  getChampionshipsWithStats(): Promise<ChampionshipWithStats[]>;

  // Races
  getRace(id: string): Promise<Race | undefined>;
  getAllRaces(): Promise<Race[]>;
  createRace(race: InsertRace): Promise<Race>;
  updateRace(id: string, race: UpdateRace): Promise<Race | undefined>;
  deleteRace(id: string): Promise<boolean>;
  getRacesWithStats(memberId?: string): Promise<RaceWithStats[]>;

  // Registrations
  getRegistration(raceId: string, memberId: string): Promise<Registration | undefined>;
  getRegistrationsByRace(raceId: string): Promise<Registration[]>;
  getRegistrationsByMember(memberId: string): Promise<Registration[]>;
  getAllRegistrations(): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  deleteRegistration(raceId: string, memberId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Members
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByGamertag(gamertag: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.gamertag, gamertag));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }

  // Championships
  async getAllChampionships(): Promise<Championship[]> {
    return await db.select().from(championships).where(eq(championships.isActive, true));
  }

  async getChampionship(id: string): Promise<Championship | undefined> {
    const [championship] = await db.select().from(championships).where(eq(championships.id, id));
    return championship || undefined;
  }

  async createChampionship(insertChampionship: InsertChampionship): Promise<Championship> {
    const [championship] = await db.insert(championships).values(insertChampionship).returning();
    return championship;
  }

  async updateChampionship(id: string, updateChampionship: UpdateChampionship): Promise<Championship | undefined> {
    const [championship] = await db.update(championships).set(updateChampionship).where(eq(championships.id, id)).returning();
    return championship || undefined;
  }

  async deleteChampionship(id: string): Promise<boolean> {
    const result = await db.update(championships).set({ isActive: false }).where(eq(championships.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getChampionshipsWithStats(): Promise<ChampionshipWithStats[]> {
    const allChampionships = await this.getAllChampionships();
    const allRaces = await this.getAllRaces();
    const allRegistrations = await this.getAllRegistrations();

    return allChampionships.map(championship => {
      const championshipRaces = allRaces.filter(race => race.championshipId === championship.id);
      const totalRegistrations = championshipRaces.reduce((sum, race) => {
        const raceRegistrations = allRegistrations.filter(reg => reg.raceId === race.id);
        return sum + raceRegistrations.length;
      }, 0);

      return {
        ...championship,
        raceCount: championshipRaces.length,
        totalRegistrations,
      };
    });
  }

  // Races
  async getRace(id: string): Promise<Race | undefined> {
    const [race] = await db.select().from(races).where(eq(races.id, id));
    return race || undefined;
  }

  async getAllRaces(): Promise<Race[]> {
    return await db.select().from(races).where(eq(races.isActive, true));
  }

  async createRace(insertRace: InsertRace): Promise<Race> {
    const [race] = await db.insert(races).values(insertRace).returning();
    return race;
  }

  async updateRace(id: string, updateRace: UpdateRace): Promise<Race | undefined> {
    const [race] = await db.update(races).set(updateRace).where(eq(races.id, id)).returning();
    return race || undefined;
  }

  async deleteRace(id: string): Promise<boolean> {
    const result = await db.update(races).set({ isActive: false }).where(eq(races.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRacesWithStats(memberId?: string): Promise<RaceWithStats[]> {
    const allRaces = await this.getAllRaces();
    const allChampionships = await this.getAllChampionships();
    const allRegistrations = await this.getAllRegistrations();

    return allRaces.map(race => {
      const raceRegistrations = allRegistrations.filter(reg => reg.raceId === race.id);
      const championship = allChampionships.find(c => c.id === race.championshipId);
      
      const isRegistered = memberId ? 
        raceRegistrations.some(reg => reg.memberId === memberId) : false;

      const now = new Date();
      const deadline = new Date(race.registrationDeadline);
      const timeUntilDeadline = deadline > now ? 
        `${Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days` : 
        'Closed';

      return {
        ...race,
        registeredCount: raceRegistrations.length,
        isRegistered,
        timeUntilDeadline,
        championshipName: championship?.name || undefined,
      };
    }).sort((a, b) => {
      if (a.roundNumber && b.roundNumber) {
        return a.roundNumber - b.roundNumber;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  // Registrations
  async getRegistration(raceId: string, memberId: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(
      and(eq(registrations.raceId, raceId), eq(registrations.memberId, memberId))
    );
    return registration || undefined;
  }

  async getRegistrationsByRace(raceId: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.raceId, raceId));
  }

  async getRegistrationsByMember(memberId: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.memberId, memberId));
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return await db.select().from(registrations);
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }

  async deleteRegistration(raceId: string, memberId: string): Promise<boolean> {
    const result = await db.delete(registrations).where(
      and(eq(registrations.raceId, raceId), eq(registrations.memberId, memberId))
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export class MemStorage implements IStorage {
  private members: Map<string, Member>;
  private championships: Map<string, Championship>;
  private races: Map<string, Race>;
  private registrations: Map<string, Registration>;

  constructor() {
    this.members = new Map();
    this.championships = new Map();
    this.races = new Map();
    this.registrations = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Create GT4 Mornings championship
    const championship1: Championship = {
      id: randomUUID(),
      name: "GT4 Mornings Season 2",
      description: "Sunday morning GT4 racing championship",
      season: "2024 Season 2",
      startDate: new Date("2024-08-01T00:00:00Z"),
      endDate: new Date("2024-12-31T23:59:59Z"),
      isActive: true,
      maxParticipants: 20,
      rules: "GT4 car class only. Grid position will be determined by qualifying. Points: 25-18-15-12-10-8-6-4-2-1 for top 10 finishers.",
    };

    this.championships.set(championship1.id, championship1);

    // Create GT4 Mornings races with proper Sunday morning schedule (21:00 UTC = 10:00 BST)
    const race1: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 1",
      track: "Red Bull Ring",
      carClass: "GT4",
      date: new Date("2024-08-25T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-08-24T21:00:00Z"),
      isActive: true,
      roundNumber: 1,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race2: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 2",
      track: "Zolder",
      carClass: "GT4",
      date: new Date("2024-09-01T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-08-31T21:00:00Z"),
      isActive: true,
      roundNumber: 2,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race3: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 3",
      track: "Monza",
      carClass: "GT4",
      date: new Date("2024-09-08T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-09-07T21:00:00Z"),
      isActive: true,
      roundNumber: 3,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race4: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 4",
      track: "Laguna Seca",
      carClass: "GT4",
      date: new Date("2024-09-15T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-09-14T21:00:00Z"),
      isActive: true,
      roundNumber: 4,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race5: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 5",
      track: "Hungaroring",
      carClass: "GT4",
      date: new Date("2024-09-22T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-09-21T21:00:00Z"),
      isActive: true,
      roundNumber: 5,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race6: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 6",
      track: "Paul Ricard",
      carClass: "GT4",
      date: new Date("2024-09-29T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-09-28T21:00:00Z"),
      isActive: true,
      roundNumber: 6,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race7: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 7",
      track: "Watkins Glen",
      carClass: "GT4",
      date: new Date("2024-10-06T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-10-05T21:00:00Z"),
      isActive: true,
      roundNumber: 7,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race8: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "GT4 Mornings Round 8",
      track: "Donington Park",
      carClass: "GT4",
      date: new Date("2024-10-13T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-10-12T21:00:00Z"),
      isActive: true,
      roundNumber: 8,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race9: Race = {
      id: randomUUID(),
      championshipId: null,
      name: "GT4 Mornings THE FINAL",
      track: "Zandvoort",
      carClass: "GT4",
      date: new Date("2024-10-20T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-10-19T21:00:00Z"),
      isActive: true,
      roundNumber: null,
      points: null,
    };

    this.races.set(race1.id, race1);
    this.races.set(race2.id, race2);
    this.races.set(race3.id, race3);
    this.races.set(race4.id, race4);
    this.races.set(race5.id, race5);
    this.races.set(race6.id, race6);
    this.races.set(race7.id, race7);
    this.races.set(race8.id, race8);
    this.races.set(race9.id, race9);
  }

  async getMember(id: string): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByGamertag(gamertag: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.gamertag === gamertag,
    );
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const member: Member = { ...insertMember, id, isAdmin: false };
    this.members.set(id, member);
    return member;
  }

  async getRace(id: string): Promise<Race | undefined> {
    return this.races.get(id);
  }

  async getAllRaces(): Promise<Race[]> {
    return Array.from(this.races.values()).filter(race => race.isActive);
  }

  async createRace(insertRace: InsertRace): Promise<Race> {
    const id = randomUUID();
    const race: Race = { 
      ...insertRace, 
      id, 
      isActive: true,
      championshipId: insertRace.championshipId || null,
      roundNumber: insertRace.roundNumber || null,
      points: insertRace.points || null,
    };
    this.races.set(id, race);
    return race;
  }

  async updateRace(id: string, updateRace: UpdateRace): Promise<Race | undefined> {
    const existingRace = this.races.get(id);
    if (!existingRace) return undefined;
    
    const updatedRace: Race = { ...existingRace, ...updateRace };
    this.races.set(id, updatedRace);
    return updatedRace;
  }

  async deleteRace(id: string): Promise<boolean> {
    if (!this.races.has(id)) return false;
    
    // Also remove all registrations for this race
    const registrationsToDelete = Array.from(this.registrations.entries())
      .filter(([_, reg]) => reg.raceId === id)
      .map(([regId]) => regId);
    
    registrationsToDelete.forEach(regId => this.registrations.delete(regId));
    
    return this.races.delete(id);
  }

  // Championship methods
  async getAllChampionships(): Promise<Championship[]> {
    return Array.from(this.championships.values()).filter(championship => championship.isActive);
  }

  async getChampionship(id: string): Promise<Championship | undefined> {
    return this.championships.get(id);
  }

  async createChampionship(insertChampionship: InsertChampionship): Promise<Championship> {
    const id = randomUUID();
    const championship: Championship = { 
      ...insertChampionship, 
      id, 
      isActive: true,
      description: insertChampionship.description || null,
      maxParticipants: insertChampionship.maxParticipants || null,
      rules: insertChampionship.rules || null,
    };
    this.championships.set(id, championship);
    return championship;
  }

  async updateChampionship(id: string, updateChampionship: UpdateChampionship): Promise<Championship | undefined> {
    const existingChampionship = this.championships.get(id);
    if (!existingChampionship) return undefined;
    
    const updatedChampionship: Championship = { ...existingChampionship, ...updateChampionship };
    this.championships.set(id, updatedChampionship);
    return updatedChampionship;
  }

  async deleteChampionship(id: string): Promise<boolean> {
    if (!this.championships.has(id)) return false;
    
    // Remove championship reference from all races
    Array.from(this.races.entries())
      .filter(([_, race]) => race.championshipId === id)
      .forEach(([raceId, race]) => {
        this.races.set(raceId, { ...race, championshipId: null, roundNumber: null, points: null });
      });
    
    return this.championships.delete(id);
  }

  async getChampionshipsWithStats(): Promise<ChampionshipWithStats[]> {
    const championships = await this.getAllChampionships();
    
    return Promise.all(championships.map(async (championship) => {
      const races = Array.from(this.races.values()).filter(race => 
        race.championshipId === championship.id && race.isActive
      );
      
      let totalRegistrations = 0;
      for (const race of races) {
        const registrations = await this.getRegistrationsByRace(race.id);
        totalRegistrations += registrations.length;
      }
      
      return {
        ...championship,
        raceCount: races.length,
        totalRegistrations,
      };
    }));
  }

  async getRacesWithStats(memberId?: string): Promise<RaceWithStats[]> {
    const races = await this.getAllRaces();
    const racesWithStats: RaceWithStats[] = [];

    for (const race of races) {
      const registrations = await this.getRegistrationsByRace(race.id);
      const registeredCount = registrations.length;
      const isRegistered = memberId ? 
        registrations.some(reg => reg.memberId === memberId) : false;

      // Get championship name if race is part of a championship
      let championshipName: string | undefined;
      if (race.championshipId) {
        const championship = await this.getChampionship(race.championshipId);
        championshipName = championship?.name;
      }

      const now = new Date();
      const deadline = new Date(race.registrationDeadline);
      const timeUntilDeadline = deadline > now ? 
        this.formatTimeRemaining(deadline.getTime() - now.getTime()) : "Closed";

      racesWithStats.push({
        ...race,
        registeredCount,
        isRegistered,
        timeUntilDeadline,
        championshipName,
      });
    }

    return racesWithStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private formatTimeRemaining(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return "< 1 hour";
    }
  }

  async getRegistration(raceId: string, memberId: string): Promise<Registration | undefined> {
    return Array.from(this.registrations.values()).find(
      (reg) => reg.raceId === raceId && reg.memberId === memberId,
    );
  }

  async getRegistrationsByRace(raceId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(
      (reg) => reg.raceId === raceId,
    );
  }

  async getRegistrationsByMember(memberId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(
      (reg) => reg.memberId === memberId,
    );
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return Array.from(this.registrations.values());
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const registration: Registration = { 
      ...insertRegistration, 
      id, 
      registeredAt: new Date() 
    };
    this.registrations.set(id, registration);
    return registration;
  }

  async deleteRegistration(raceId: string, memberId: string): Promise<boolean> {
    const registration = await this.getRegistration(raceId, memberId);
    if (registration) {
      this.registrations.delete(registration.id);
      return true;
    }
    return false;
  }
}

export const storage = new DatabaseStorage();

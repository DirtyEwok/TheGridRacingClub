import { type Member, type InsertMember, type Championship, type InsertChampionship, type UpdateChampionship, type ChampionshipWithStats, type Race, type InsertRace, type UpdateRace, type Registration, type InsertRegistration, type RaceWithStats } from "@shared/schema";
import { randomUUID } from "crypto";

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
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  deleteRegistration(raceId: string, memberId: string): Promise<boolean>;
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
    // Create sample championship
    const championship1: Championship = {
      id: randomUUID(),
      name: "2024 Winter Championship",
      description: "Winter season championship with F1 and GT3 races",
      season: "2024 Season 1",
      startDate: new Date("2024-12-01T00:00:00Z"),
      endDate: new Date("2025-02-28T23:59:59Z"),
      isActive: true,
      maxParticipants: 24,
      rules: "Standard F1 and GT3 regulations apply. Points: 25-18-15-12-10-8-6-4-2-1 for top 10 finishers.",
    };

    this.championships.set(championship1.id, championship1);

    // Create some sample races
    const race1: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "Silverstone GP Championship",
      track: "Silverstone Circuit - GP Layout",
      carClass: "Formula 1",
      date: new Date("2024-12-15T20:00:00Z"),
      maxParticipants: 24,
      registrationDeadline: new Date("2024-12-14T23:59:59Z"),
      isActive: true,
      roundNumber: 1,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    const race2: Race = {
      id: randomUUID(),
      championshipId: null,
      name: "Spa-Francorchamps Endurance",
      track: "Circuit de Spa-Francorchamps",
      carClass: "GT3",
      date: new Date("2024-12-18T19:30:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-12-16T23:59:59Z"),
      isActive: true,
      roundNumber: null,
      points: null,
    };

    const race3: Race = {
      id: randomUUID(),
      championshipId: championship1.id,
      name: "Monaco Street Circuit",
      track: "Circuit de Monaco",
      carClass: "Formula 1",
      date: new Date("2024-12-22T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-12-21T23:59:59Z"),
      isActive: true,
      roundNumber: 2,
      points: "25-18-15-12-10-8-6-4-2-1",
    };

    this.races.set(race1.id, race1);
    this.races.set(race2.id, race2);
    this.races.set(race3.id, race3);
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

export const storage = new MemStorage();

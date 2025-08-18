import { type Member, type InsertMember, type Race, type InsertRace, type Registration, type InsertRegistration, type RaceWithStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMemberByGamertag(gamertag: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;

  // Races
  getRace(id: string): Promise<Race | undefined>;
  getAllRaces(): Promise<Race[]>;
  createRace(race: InsertRace): Promise<Race>;
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
  private races: Map<string, Race>;
  private registrations: Map<string, Registration>;

  constructor() {
    this.members = new Map();
    this.races = new Map();
    this.registrations = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Create some sample races
    const race1: Race = {
      id: randomUUID(),
      name: "Silverstone GP Championship",
      track: "Silverstone Circuit - GP Layout",
      carClass: "Formula 1",
      date: new Date("2024-12-15T20:00:00Z"),
      maxParticipants: 24,
      registrationDeadline: new Date("2024-12-14T23:59:59Z"),
      isActive: true,
    };

    const race2: Race = {
      id: randomUUID(),
      name: "Spa-Francorchamps Endurance",
      track: "Circuit de Spa-Francorchamps",
      carClass: "GT3",
      date: new Date("2024-12-18T19:30:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-12-16T23:59:59Z"),
      isActive: true,
    };

    const race3: Race = {
      id: randomUUID(),
      name: "Monaco Street Circuit",
      track: "Circuit de Monaco",
      carClass: "Formula 1",
      date: new Date("2024-12-22T21:00:00Z"),
      maxParticipants: 20,
      registrationDeadline: new Date("2024-12-21T23:59:59Z"),
      isActive: true,
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
    const member: Member = { ...insertMember, id };
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
    const race: Race = { ...insertRace, id, isActive: true };
    this.races.set(id, race);
    return race;
  }

  async getRacesWithStats(memberId?: string): Promise<RaceWithStats[]> {
    const races = await this.getAllRaces();
    const racesWithStats: RaceWithStats[] = [];

    for (const race of races) {
      const registrations = await this.getRegistrationsByRace(race.id);
      const registeredCount = registrations.length;
      const isRegistered = memberId ? 
        registrations.some(reg => reg.memberId === memberId) : false;

      const now = new Date();
      const deadline = new Date(race.registrationDeadline);
      const timeUntilDeadline = deadline > now ? 
        this.formatTimeRemaining(deadline.getTime() - now.getTime()) : "Closed";

      racesWithStats.push({
        ...race,
        registeredCount,
        isRegistered,
        timeUntilDeadline,
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

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
    // Create GT4 Mornings championship with correct data
    const championship1: Championship = {
      id: "f1d7cc7c-9508-4cd6-9056-0cb42e881745",
      name: "GT4 Mornings",
      description: `Welcome to the Grid Racing Club GT4 Mornings Season 2 on ACC!

Strap yourselves because it's time to simulate the morning commute! If it were on racing circuits with GT4 cars.

Session Times:
• Qualifying: 11 am - 6 min (Friday)
• Race 5 am - 25 mins (Saturday)
• Qualifying: 9 am - 6 minutes (Saturday)
• Race: 7 am - 25 mins (Sunday)

Race Format:
• RT-Red Bull Ring
• R2-Zolder
• R3-Monza
• R4-Laguna Seca
• R5-Hungaroring
• R6-Paul Ricard Final-Zandvoort

Registration is an agreement to all club rules and regs.

Settings:
• Random weather
• No mandatory pit stop
• No car change permitted
• Custom setups permitted

#RACEANDRESPECT`,
      season: "Season 2",
      startDate: new Date("2025-01-21T00:00:00.000Z"),
      endDate: new Date("2025-02-10T23:59:59.000Z"),
      isActive: true,
      maxParticipants: 30,
      rules: null,
    };

    this.championships.set(championship1.id, championship1);

    // Create GT4 Mornings races with CORRECT dates and 20:00 UK time (NEVER CHANGE)
    const race1: Race = {
      id: "gt4-round-1",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 1",
      track: "Red Bull Ring",
      carClass: "GT4",
      date: new Date("2025-01-26T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-01-25T20:00:00.000Z"),
      isActive: true,
      roundNumber: 1,
      points: null,
    };

    const race2: Race = {
      id: "gt4-round-2",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 2",
      track: "Zolder",
      carClass: "GT4",
      date: new Date("2025-02-02T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-01T20:00:00.000Z"),
      isActive: true,
      roundNumber: 2,
      points: null,
    };

    const race3: Race = {
      id: "gt4-round-3",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 3",
      track: "Monza",
      carClass: "GT4",
      date: new Date("2025-02-09T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-08T20:00:00.000Z"),
      isActive: true,
      roundNumber: 3,
      points: null,
    };

    const race4: Race = {
      id: "gt4-round-4",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 4",
      track: "Laguna Seca",
      carClass: "GT4",
      date: new Date("2025-02-16T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-15T20:00:00.000Z"),
      isActive: true,
      roundNumber: 4,
      points: null,
    };

    const race5: Race = {
      id: "gt4-round-5",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 5",
      track: "Hungaroring",
      carClass: "GT4",
      date: new Date("2025-02-23T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-22T20:00:00.000Z"),
      isActive: true,
      roundNumber: 5,
      points: null,
    };

    const race6: Race = {
      id: "gt4-round-6",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 6",
      track: "Paul Ricard",
      carClass: "GT4",
      date: new Date("2025-03-02T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-03-01T20:00:00.000Z"),
      isActive: true,
      roundNumber: 6,
      points: null,
    };

    const race7: Race = {
      id: "gt4-round-7",
      championshipId: championship1.id,
      name: "GT4 Mornings Round 7",
      track: "Zandvoort",
      carClass: "GT4",
      date: new Date("2025-03-09T20:00:00.000Z"), // 20:00 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-03-08T20:00:00.000Z"),
      isActive: true,
      roundNumber: 7,
      points: null,
    };

    // Now create GT3 Mid Evo Masters championship
    const championship2: Championship = {
      id: "gt3-mid-evo-masters",
      name: "GT3 Mid Evo Masters",
      description: `Assetto Corsa Competizione - GT3 Mid Evo Masters

A 5-week series, 90-minute endurance races for anything GT3 spec with the engine in the middle.

Sessions:
• No practice
• 20 mins Q
• 90 mins R

No mandatory pit stop.
Random weather

Rounds:
• Round 1: Mount Panorama
• Round 2: Silverstone
• Round 3: Hungaroring
• Round 4: Spa
• Round 5: Kyalami

Cars - any model of the following:
• Audi R8
• Ferrari 488
• Honda NSX 
• Lamborghini Huracan
• McLaren 650s & 720s
• Reiter Engineering

*Evo models can be used

Settings:
• Usual full damage
• Mech damage
• License on
• No car swaps

Server Info:
Password: GT390
Party opens at 19:45
Server goes live at 20:00`,
      season: "Season 1",
      startDate: new Date("2025-08-09T00:00:00.000Z"),
      endDate: new Date("2025-09-06T23:59:59.000Z"),
      isActive: true,
      maxParticipants: 30,
      rules: null,
    };

    this.championships.set(championship2.id, championship2);

    // Create GT3 races with 19:45 UK time (FIXED REQUIREMENT)
    const gt3Race1: Race = {
      id: "gt3-round-1",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 1",
      track: "Mount Panorama",
      carClass: "GT3",
      date: new Date("2025-08-09T18:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-08T18:45:00.000Z"),
      isActive: true,
      roundNumber: 1,
      points: null,
    };

    const gt3Race2: Race = {
      id: "gt3-round-2",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 2",
      track: "Silverstone",
      carClass: "GT3",
      date: new Date("2025-08-16T18:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-15T18:45:00.000Z"),
      isActive: true,
      roundNumber: 2,
      points: null,
    };

    const gt3Race3: Race = {
      id: "gt3-round-3",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 3",
      track: "Hungaroring",
      carClass: "GT3",
      date: new Date("2025-08-23T18:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-22T18:45:00.000Z"),
      isActive: true,
      roundNumber: 3,
      points: null,
    };

    const gt3Race4: Race = {
      id: "gt3-round-4",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 4",
      track: "Spa-Francorchamps",
      carClass: "GT3",
      date: new Date("2025-08-30T18:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-29T18:45:00.000Z"),
      isActive: true,
      roundNumber: 4,
      points: null,
    };

    const gt3Race5: Race = {
      id: "gt3-round-5",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 5",
      track: "Kyalami",
      carClass: "GT3",
      date: new Date("2025-09-06T18:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-09-05T18:45:00.000Z"),
      isActive: true,
      roundNumber: 5,
      points: null,
    };

    // Add all races to the storage
    this.races.set(race1.id, race1);
    this.races.set(race2.id, race2);
    this.races.set(race3.id, race3);
    this.races.set(race4.id, race4);
    this.races.set(race5.id, race5);
    this.races.set(race6.id, race6);
    this.races.set(race7.id, race7);
    this.races.set(gt3Race1.id, gt3Race1);
    this.races.set(gt3Race2.id, gt3Race2);
    this.races.set(gt3Race3.id, gt3Race3);
    this.races.set(gt3Race4.id, gt3Race4);
    this.races.set(gt3Race5.id, gt3Race5);
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

export const storage = new MemStorage();

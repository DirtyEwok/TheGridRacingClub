import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name").notNull(),
  gamertag: text("gamertag").notNull().unique(),
  experienceLevel: text("experience_level").notNull(), // "Beginner", "Intermediate", "Advanced", "Professional"
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const championships = pgTable("championships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  season: text("season").notNull(), // e.g., "2024 Season 1", "Winter Championship"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  maxParticipants: integer("max_participants"),
  rules: text("rules"), // Championship-specific rules
});

export const races = pgTable("races", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  championshipId: varchar("championship_id"), // Optional - races can be standalone or part of championship
  name: text("name").notNull(),
  track: text("track").notNull(),
  carClass: text("car_class").notNull(),
  date: timestamp("date").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  roundNumber: integer("round_number"), // For championship races (Round 1, Round 2, etc.)
  points: text("points"), // Points structure for championship races
});

export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raceId: varchar("race_id").notNull(),
  memberId: varchar("member_id").notNull(),
  registeredAt: timestamp("registered_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertMemberSchema = createInsertSchema(members).pick({
  displayName: true,
  gamertag: true,
  experienceLevel: true,
});

export const updateChampionshipSchema = createInsertSchema(championships).pick({
  name: true,
  description: true,
  season: true,
  startDate: true,
  endDate: true,
  maxParticipants: true,
  rules: true,
  isActive: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateRaceSchema = createInsertSchema(races).pick({
  championshipId: true,
  name: true,
  track: true,
  carClass: true,
  date: true,
  maxParticipants: true,
  registrationDeadline: true,
  roundNumber: true,
  points: true,
  isActive: true,
}).extend({
  date: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
});

export const insertChampionshipSchema = createInsertSchema(championships).pick({
  name: true,
  description: true,
  season: true,
  startDate: true,
  endDate: true,
  maxParticipants: true,
  rules: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const insertRaceSchema = createInsertSchema(races).pick({
  championshipId: true,
  name: true,
  track: true,
  carClass: true,
  date: true,
  maxParticipants: true,
  registrationDeadline: true,
  roundNumber: true,
  points: true,
}).extend({
  date: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).pick({
  raceId: true,
  memberId: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertChampionship = z.infer<typeof insertChampionshipSchema>;
export type UpdateChampionship = z.infer<typeof updateChampionshipSchema>;
export type Championship = typeof championships.$inferSelect;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type UpdateRace = z.infer<typeof updateRaceSchema>;
export type Race = typeof races.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

export type RaceWithStats = Race & {
  registeredCount: number;
  isRegistered?: boolean;
  timeUntilDeadline?: string;
  championshipName?: string;
};

export type ChampionshipWithStats = Championship & {
  raceCount: number;
  totalRegistrations: number;
};

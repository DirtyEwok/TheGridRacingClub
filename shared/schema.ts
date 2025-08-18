import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name").notNull(),
  gamertag: text("gamertag").notNull().unique(),
  experienceLevel: text("experience_level").notNull(), // "Beginner", "Intermediate", "Advanced", "Professional"
});

export const races = pgTable("races", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  track: text("track").notNull(),
  carClass: text("car_class").notNull(),
  date: timestamp("date").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  isActive: boolean("is_active").notNull().default(true),
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

export const insertRaceSchema = createInsertSchema(races).pick({
  name: true,
  track: true,
  carClass: true,
  date: true,
  maxParticipants: true,
  registrationDeadline: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).pick({
  raceId: true,
  memberId: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type Race = typeof races.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

export type RaceWithStats = Race & {
  registeredCount: number;
  isRegistered?: boolean;
  timeUntilDeadline?: string;
};

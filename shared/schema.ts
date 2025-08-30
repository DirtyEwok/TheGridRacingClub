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
  // Profile fields
  bio: text("bio"),
  favoriteTrack: text("favorite_track"),
  favoriteCarClass: text("favorite_car_class"),
  carNumber: text("car_number"),
  profileImageUrl: text("profile_image_url"),
  streamLink: text("stream_link"),
  streamLink2: text("stream_link_2"),
  // Approval system
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "general" or "championship"
  championshipId: varchar("championship_id"), // null for general chat
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull(),
  memberId: varchar("member_id").notNull(),
  message: text("message").notNull(),
  replyToMessageId: varchar("reply_to_message_id"), // ID of the message this is replying to
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedBy: varchar("deleted_by"),
  deletedAt: timestamp("deleted_at"),
  isPinned: boolean("is_pinned").notNull().default(false),
  pinnedBy: varchar("pinned_by"),
  pinnedAt: timestamp("pinned_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const messageLikes = pgTable("message_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  memberId: varchar("member_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  messageId: varchar("message_id").notNull(),
  type: text("type").notNull(), // 'mention'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  question: text("question").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  allowMultipleVotes: boolean("allow_multiple_votes").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at"),
});

export const pollOptions = pgTable("poll_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  text: text("text").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionId: varchar("option_id").notNull(),
  memberId: varchar("member_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertMemberSchema = createInsertSchema(members).pick({
  displayName: true,
  gamertag: true,
  experienceLevel: true,
});

export const updateMemberProfileSchema = createInsertSchema(members).pick({
  displayName: true,
  bio: true,
  favoriteTrack: true,
  favoriteCarClass: true,
  carNumber: true,
  profileImageUrl: true,
  streamLink: true,
  streamLink2: true,
  experienceLevel: true,
});

export const approveMemberSchema = z.object({
  memberId: z.string(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
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
  isActive: true,
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

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  type: true,
  championshipId: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  chatRoomId: true,
  memberId: true,
  message: true,
  replyToMessageId: true,
});

export const insertMessageLikeSchema = createInsertSchema(messageLikes).pick({
  messageId: true,
  memberId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  memberId: true,
  messageId: true,
  type: true,
});

export const insertPollSchema = createInsertSchema(polls).pick({
  chatRoomId: true,
  createdBy: true,
  question: true,
  allowMultipleVotes: true,
  expiresAt: true,
});

export const insertPollOptionSchema = createInsertSchema(pollOptions).pick({
  pollId: true,
  text: true,
  displayOrder: true,
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).pick({
  pollId: true,
  optionId: true,
  memberId: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  memberId: true,
  endpoint: true,
  p256dhKey: true,
  authKey: true,
  userAgent: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type UpdateMemberProfile = z.infer<typeof updateMemberProfileSchema>;
export type ApproveMember = z.infer<typeof approveMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertChampionship = z.infer<typeof insertChampionshipSchema>;
export type UpdateChampionship = z.infer<typeof updateChampionshipSchema>;
export type Championship = typeof championships.$inferSelect;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type UpdateRace = z.infer<typeof updateRaceSchema>;
export type Race = typeof races.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertMessageLike = z.infer<typeof insertMessageLikeSchema>;
export type MessageLike = typeof messageLikes.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;
export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export type RegistrationWithMember = Registration & {
  member?: Member;
};

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

export type ChatMessageWithMember = ChatMessage & {
  member: Member;
  likeCount: number;
  isLikedByCurrentUser: boolean;
};

export type ChatRoomWithStats = ChatRoom & {
  messageCount: number;
  lastMessage?: ChatMessageWithMember;
};

export type NotificationWithMessage = Notification & {
  message: ChatMessageWithMember;
  chatRoom: ChatRoom;
};

export type PollOptionWithVotes = PollOption & {
  voteCount: number;
  hasUserVoted: boolean;
};

export type PollWithDetails = Poll & {
  options: PollOptionWithVotes[];
  totalVotes: number;
  hasUserVoted: boolean;
  creator: Member;
};

import { type Member, type InsertMember, type UpdateMemberProfile, type ApproveMember, type Championship, type InsertChampionship, type UpdateChampionship, type ChampionshipWithStats, type Race, type InsertRace, type UpdateRace, type Registration, type InsertRegistration, type RaceWithStats, type ChatRoom, type InsertChatRoom, type ChatMessage, type InsertChatMessage, type MessageLike, type InsertMessageLike, type ChatMessageWithMember, type ChatRoomWithStats, type Notification, type InsertNotification, type NotificationWithMessage, type Poll, type InsertPoll, type PollOption, type InsertPollOption, type PollVote, type InsertPollVote, type PollWithDetails, type PollOptionWithVotes, type PushSubscription, type InsertPushSubscription, members, championships, races, registrations, chatRooms, chatMessages, messageLikes, notifications, polls, pollOptions, pollVotes, pushSubscriptions } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMemberByGamertag(gamertag: string): Promise<Member | undefined>;
  getAllMembers(): Promise<Member[]>;
  getPendingMembers(): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMemberProfile(id: string, profile: UpdateMemberProfile): Promise<Member | undefined>;
  approveMember(approval: ApproveMember): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;

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

  // Chat Rooms
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  getChatRoomByChampionship(championshipId: string): Promise<ChatRoom | undefined>;
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getChatRoomsWithStats(): Promise<ChatRoomWithStats[]>;

  // Chat Messages
  getChatMessages(chatRoomId: string, limit?: number, currentUserId?: string): Promise<ChatMessageWithMember[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(messageId: string, deletedBy: string): Promise<boolean>;
  pinMessage(messageId: string, pinnedBy: string): Promise<boolean>;
  unpinMessage(messageId: string): Promise<boolean>;
  getPinnedMessages(chatRoomId: string, currentUserId?: string): Promise<ChatMessageWithMember[]>;

  // Message Likes
  likeMessage(messageId: string, memberId: string): Promise<boolean>;
  unlikeMessage(messageId: string, memberId: string): Promise<boolean>;
  getMessageLikes(messageId: string): Promise<MessageLike[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUnreadNotifications(memberId: string): Promise<NotificationWithMessage[]>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  markAllNotificationsAsRead(memberId: string): Promise<boolean>;
  getUnreadNotificationCount(memberId: string): Promise<number>;

  // Polls
  createPoll(poll: InsertPoll, options: string[]): Promise<Poll>;
  getPollsInChatRoom(chatRoomId: string, currentUserId?: string): Promise<PollWithDetails[]>;
  getPoll(pollId: string, currentUserId?: string): Promise<PollWithDetails | undefined>;
  votePoll(pollId: string, optionId: string, memberId: string): Promise<boolean>;
  unvotePoll(pollId: string, optionId: string, memberId: string): Promise<boolean>;
  closePoll(pollId: string): Promise<boolean>;
  deletePoll(pollId: string): Promise<boolean>;

  // Push Subscriptions
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByMember(memberId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(id: string): Promise<boolean>;
  deletePushSubscriptionByEndpoint(endpoint: string): Promise<boolean>;
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

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getPendingMembers(): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.status, "pending"));
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values({
      ...insertMember,
      status: "pending", // All new members need approval
    }).returning();
    return member;
  }

  async updateMemberProfile(id: string, profile: UpdateMemberProfile): Promise<Member | undefined> {
    const [member] = await db.update(members)
      .set(profile)
      .where(eq(members.id, id))
      .returning();
    return member || undefined;
  }

  async approveMember(approval: ApproveMember): Promise<Member | undefined> {
    const updateData: any = {
      status: approval.approved ? "approved" : "rejected",
      approvedBy: "CJ DirtyEwok", // Admin gamertag
      approvedAt: new Date(),
    };

    if (!approval.approved && approval.rejectionReason) {
      updateData.rejectionReason = approval.rejectionReason;
    }

    const [member] = await db.update(members)
      .set(updateData)
      .where(eq(members.id, approval.memberId))
      .returning();
    return member || undefined;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id));
    return (result.rowCount ?? 0) > 0;
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

  // Chat Rooms
  async getAllChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).where(eq(chatRooms.isActive, true));
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return chatRoom || undefined;
  }

  async getChatRoomByChampionship(championshipId: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.championshipId, championshipId));
    return chatRoom || undefined;
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    // Check if a chat room for this championship already exists
    if (insertChatRoom.championshipId) {
      const existingRoom = await this.getChatRoomByChampionship(insertChatRoom.championshipId);
      if (existingRoom) {
        return existingRoom; // Return existing room instead of creating duplicate
      }
    }

    const [chatRoom] = await db.insert(chatRooms).values(insertChatRoom).returning();
    return chatRoom;
  }

  async getChatRoomsWithStats(): Promise<ChatRoomWithStats[]> {
    const rooms = await this.getAllChatRooms();
    const roomsWithStats: ChatRoomWithStats[] = [];

    for (const room of rooms) {
      const messages = await this.getChatMessages(room.id, 1);
      roomsWithStats.push({
        ...room,
        messageCount: messages.length,
        lastMessage: messages[0] || undefined,
      });
    }

    return roomsWithStats;
  }

  // Chat Messages
  async getChatMessages(chatRoomId: string, limit = 50, currentUserId?: string): Promise<ChatMessageWithMember[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        chatRoomId: chatMessages.chatRoomId,
        memberId: chatMessages.memberId,
        message: chatMessages.message,
        replyToMessageId: chatMessages.replyToMessageId,
        isDeleted: chatMessages.isDeleted,
        deletedBy: chatMessages.deletedBy,
        deletedAt: chatMessages.deletedAt,
        isPinned: chatMessages.isPinned,
        pinnedBy: chatMessages.pinnedBy,
        pinnedAt: chatMessages.pinnedAt,
        createdAt: chatMessages.createdAt,
        member: {
          id: members.id,
          displayName: members.displayName,
          gamertag: members.gamertag,
          experienceLevel: members.experienceLevel,
          isAdmin: members.isAdmin,
          bio: members.bio,
          favoriteTrack: members.favoriteTrack,
          favoriteCarClass: members.favoriteCarClass,
          carNumber: members.carNumber,
          profileImageUrl: members.profileImageUrl,
          streamLink: members.streamLink,
          streamLink2: members.streamLink2,
          status: members.status,
          approvedBy: members.approvedBy,
          approvedAt: members.approvedAt,
          rejectionReason: members.rejectionReason,
          createdAt: members.createdAt,
        },
      })
      .from(chatMessages)
      .innerJoin(members, eq(chatMessages.memberId, members.id))
      .where(and(
        eq(chatMessages.chatRoomId, chatRoomId),
        eq(chatMessages.isDeleted, false)
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    // Add like information to each message
    const messagesWithLikes = await Promise.all(
      messages.map(async (message) => {
        // Get total like count
        const likes = await db.select().from(messageLikes).where(eq(messageLikes.messageId, message.id));
        const likeCount = likes.length;
        
        // Check if current user liked this message
        const isLikedByCurrentUser = currentUserId 
          ? likes.some(like => like.memberId === currentUserId)
          : false;

        return {
          ...message,
          likeCount,
          isLikedByCurrentUser,
        };
      })
    );

    return messagesWithLikes.reverse(); // Reverse to show oldest first
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertChatMessage).returning();
    return message;
  }

  async deleteChatMessage(messageId: string, deletedBy: string): Promise<boolean> {
    const [result] = await db
      .update(chatMessages)
      .set({
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      })
      .where(eq(chatMessages.id, messageId))
      .returning();

    return !!result;
  }

  async pinMessage(messageId: string, pinnedBy: string): Promise<boolean> {
    const [result] = await db
      .update(chatMessages)
      .set({
        isPinned: true,
        pinnedBy,
        pinnedAt: new Date(),
      })
      .where(eq(chatMessages.id, messageId))
      .returning();

    return !!result;
  }

  async unpinMessage(messageId: string): Promise<boolean> {
    const [result] = await db
      .update(chatMessages)
      .set({
        isPinned: false,
        pinnedBy: null,
        pinnedAt: null,
      })
      .where(eq(chatMessages.id, messageId))
      .returning();

    return !!result;
  }

  async getPinnedMessages(chatRoomId: string, currentUserId?: string): Promise<ChatMessageWithMember[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        chatRoomId: chatMessages.chatRoomId,
        memberId: chatMessages.memberId,
        message: chatMessages.message,
        replyToMessageId: chatMessages.replyToMessageId,
        isDeleted: chatMessages.isDeleted,
        deletedBy: chatMessages.deletedBy,
        deletedAt: chatMessages.deletedAt,
        isPinned: chatMessages.isPinned,
        pinnedBy: chatMessages.pinnedBy,
        pinnedAt: chatMessages.pinnedAt,
        createdAt: chatMessages.createdAt,
        member: {
          id: members.id,
          displayName: members.displayName,
          gamertag: members.gamertag,
          experienceLevel: members.experienceLevel,
          isAdmin: members.isAdmin,
          bio: members.bio,
          favoriteTrack: members.favoriteTrack,
          favoriteCarClass: members.favoriteCarClass,
          carNumber: members.carNumber,
          profileImageUrl: members.profileImageUrl,
          streamLink: members.streamLink,
          streamLink2: members.streamLink2,
          status: members.status,
          approvedBy: members.approvedBy,
          approvedAt: members.approvedAt,
          rejectionReason: members.rejectionReason,
          createdAt: members.createdAt,
        },
      })
      .from(chatMessages)
      .innerJoin(members, eq(chatMessages.memberId, members.id))
      .where(and(
        eq(chatMessages.chatRoomId, chatRoomId),
        eq(chatMessages.isDeleted, false),
        eq(chatMessages.isPinned, true)
      ))
      .orderBy(desc(chatMessages.pinnedAt));

    // Add like information to each message
    const messagesWithLikes = await Promise.all(
      messages.map(async (message) => {
        // Get total like count
        const likes = await db.select().from(messageLikes).where(eq(messageLikes.messageId, message.id));
        const likeCount = likes.length;
        
        // Check if current user liked this message
        const isLikedByCurrentUser = currentUserId 
          ? likes.some(like => like.memberId === currentUserId)
          : false;

        return {
          ...message,
          likeCount,
          isLikedByCurrentUser,
        };
      })
    );

    return messagesWithLikes;
  }

  // Message Likes
  async likeMessage(messageId: string, memberId: string): Promise<boolean> {
    try {
      const insertLike: InsertMessageLike = {
        messageId,
        memberId,
      };
      
      await db.insert(messageLikes).values(insertLike);
      return true;
    } catch (error) {
      // If unique constraint fails, like already exists
      return false;
    }
  }

  async unlikeMessage(messageId: string, memberId: string): Promise<boolean> {
    const result = await db.delete(messageLikes).where(
      and(eq(messageLikes.messageId, messageId), eq(messageLikes.memberId, memberId))
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getMessageLikes(messageId: string): Promise<MessageLike[]> {
    return await db.select().from(messageLikes).where(eq(messageLikes.messageId, messageId));
  }

  // Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getUnreadNotifications(memberId: string): Promise<NotificationWithMessage[]> {
    const notificationResults = await db
      .select({
        notification: notifications,
        message: chatMessages,
        member: members,
        chatRoom: chatRooms,
      })
      .from(notifications)
      .leftJoin(chatMessages, eq(notifications.messageId, chatMessages.id))
      .leftJoin(members, eq(chatMessages.memberId, members.id))
      .leftJoin(chatRooms, eq(chatMessages.chatRoomId, chatRooms.id))
      .where(and(
        eq(notifications.memberId, memberId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));

    return notificationResults.map(result => ({
      ...result.notification,
      message: {
        ...result.message!,
        member: result.member!,
        likeCount: 0,
        isLikedByCurrentUser: false,
      },
      chatRoom: result.chatRoom!,
    }));
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const [result] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return !!result;
  }

  async markAllNotificationsAsRead(memberId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.memberId, memberId),
        eq(notifications.isRead, false)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getUnreadNotificationCount(memberId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.memberId, memberId),
        eq(notifications.isRead, false)
      ));
    return result?.count || 0;
  }

  // Polls
  async createPoll(poll: InsertPoll, options: string[]): Promise<Poll> {
    const [newPoll] = await db.insert(polls).values(poll).returning();
    
    // Insert poll options
    for (let i = 0; i < options.length; i++) {
      await db.insert(pollOptions).values({
        pollId: newPoll.id,
        text: options[i],
        displayOrder: i,
      });
    }
    
    return newPoll;
  }

  async getPollsInChatRoom(chatRoomId: string, currentUserId?: string): Promise<PollWithDetails[]> {
    const pollsWithDetails: PollWithDetails[] = [];
    
    const chatRoomPolls = await db
      .select()
      .from(polls)
      .where(eq(polls.chatRoomId, chatRoomId))
      .orderBy(desc(polls.createdAt));

    for (const poll of chatRoomPolls) {
      // Get poll options
      const options = await db
        .select()
        .from(pollOptions)
        .where(eq(pollOptions.pollId, poll.id))
        .orderBy(pollOptions.displayOrder);

      // Get vote counts and user votes
      const optionsWithVotes: PollOptionWithVotes[] = [];
      let totalVotes = 0;
      let hasUserVoted = false;

      for (const option of options) {
        const votes = await db
          .select()
          .from(pollVotes)
          .where(eq(pollVotes.optionId, option.id));
        
        const hasUserVotedForOption = currentUserId ? 
          votes.some(vote => vote.memberId === currentUserId) : false;
        
        if (hasUserVotedForOption) hasUserVoted = true;
        
        optionsWithVotes.push({
          ...option,
          voteCount: votes.length,
          hasUserVoted: hasUserVotedForOption,
        });
        
        totalVotes += votes.length;
      }

      // Get creator info
      const creator = await this.getMember(poll.createdBy);
      if (!creator) continue;

      pollsWithDetails.push({
        ...poll,
        options: optionsWithVotes,
        totalVotes,
        hasUserVoted,
        creator,
      });
    }

    return pollsWithDetails;
  }

  async getPoll(pollId: string, currentUserId?: string): Promise<PollWithDetails | undefined> {
    // Simple implementation - return undefined for now
    return undefined;
  }

  async votePoll(pollId: string, optionId: string, memberId: string): Promise<boolean> {
    try {
      await db.insert(pollVotes).values({
        pollId,
        optionId,
        memberId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async unvotePoll(pollId: string, optionId: string, memberId: string): Promise<boolean> {
    const result = await db.delete(pollVotes).where(and(
      eq(pollVotes.pollId, pollId),
      eq(pollVotes.optionId, optionId),
      eq(pollVotes.memberId, memberId)
    ));
    return (result.rowCount ?? 0) > 0;
  }

  async closePoll(pollId: string): Promise<boolean> {
    const result = await db.update(polls)
      .set({ isActive: false })
      .where(eq(polls.id, pollId));
    return (result.rowCount ?? 0) > 0;
  }

  async deletePoll(pollId: string): Promise<boolean> {
    try {
      // Delete votes first
      await db.delete(pollVotes).where(eq(pollVotes.pollId, pollId));
      // Delete options
      await db.delete(pollOptions).where(eq(pollOptions.pollId, pollId));
      // Delete poll
      const result = await db.delete(polls).where(eq(polls.id, pollId));
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

export class MemStorage implements IStorage {
  private members: Map<string, Member>;
  private championships: Map<string, Championship>;
  private races: Map<string, Race>;
  private registrations: Map<string, Registration>;
  private chatRooms: Map<string, ChatRoom>;
  private chatMessages: Map<string, ChatMessage>;
  private messageLikes: Map<string, MessageLike>;

  constructor() {
    this.members = new Map();
    this.championships = new Map();
    this.races = new Map();
    this.registrations = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.messageLikes = new Map();
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
      startDate: new Date("2025-08-21T00:00:00.000Z"),
      endDate: new Date("2025-09-25T23:59:59.000Z"),
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
      date: new Date("2025-08-21T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-20T19:00:00.000Z"),
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
      date: new Date("2025-08-28T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-08-27T19:00:00.000Z"),
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
      date: new Date("2025-09-04T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-09-03T19:00:00.000Z"),
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
      date: new Date("2025-09-11T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-09-10T19:00:00.000Z"),
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
      date: new Date("2025-09-18T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-09-17T19:00:00.000Z"),
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
      date: new Date("2025-09-25T19:00:00.000Z"), // 20:00 UK time (BST) - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-09-24T19:00:00.000Z"),
      isActive: true,
      roundNumber: 6,
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
      startDate: new Date("2025-01-30T00:00:00.000Z"),
      endDate: new Date("2025-02-27T23:59:59.000Z"),
      isActive: true,
      maxParticipants: 30,
      rules: null,
    };

    this.championships.set(championship2.id, championship2);

    // Create GT3 races with 19:45 UK time (FIXED REQUIREMENT) - CORRECTED DATES
    const gt3Race1: Race = {
      id: "gt3-round-1",
      championshipId: championship2.id,
      name: "GT3 Mid Evo Masters Round 1",
      track: "Mount Panorama",
      carClass: "GT3",
      date: new Date("2025-01-30T19:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-01-29T19:45:00.000Z"),
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
      date: new Date("2025-02-06T19:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-05T19:45:00.000Z"),
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
      date: new Date("2025-02-13T19:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-12T19:45:00.000Z"),
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
      date: new Date("2025-02-20T19:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-19T19:45:00.000Z"),
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
      date: new Date("2025-02-27T19:45:00.000Z"), // 19:45 UK time - NEVER CHANGE
      maxParticipants: 30,
      registrationDeadline: new Date("2025-02-26T19:45:00.000Z"),
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

  async getAllMembers(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async getPendingMembers(): Promise<Member[]> {
    return Array.from(this.members.values()).filter(member => member.status === "pending");
  }

  async updateMemberProfile(id: string, updates: UpdateMemberProfile): Promise<Member | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...updates, updatedAt: new Date() };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async approveMember(approval: ApproveMember): Promise<Member | undefined> {
    const member = this.members.get(approval.memberId);
    if (!member) return undefined;
    
    const updatedMember = { 
      ...member, 
      status: approval.approved ? "approved" : "rejected",
      rejectionReason: approval.approved ? null : (approval.rejectionReason || null),
      approvedBy: "CJ DirtyEwok",
      approvedAt: new Date()
    };
    this.members.set(approval.memberId, updatedMember);
    return updatedMember;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const member: Member = { 
      ...insertMember, 
      id, 
      isAdmin: false,
      bio: null,
      favoriteTrack: null,
      favoriteCarClass: null,
      carNumber: null,
      streamLink: null,
      streamLink2: null,
      profileImageUrl: null,
      status: "approved",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date()
    };
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

  // Chat Rooms
  async getAllChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values()).filter(room => room.isActive);
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getChatRoomByChampionship(championshipId: string): Promise<ChatRoom | undefined> {
    return Array.from(this.chatRooms.values()).find(room => room.championshipId === championshipId);
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    // Check if a chat room for this championship already exists
    if (insertChatRoom.championshipId) {
      const existingRoom = await this.getChatRoomByChampionship(insertChatRoom.championshipId);
      if (existingRoom) {
        return existingRoom; // Return existing room instead of creating duplicate
      }
    }

    const id = randomUUID();
    const chatRoom: ChatRoom = {
      ...insertChatRoom,
      id,
      isActive: true,
      createdAt: new Date(),
      championshipId: insertChatRoom.championshipId || null,
    };
    this.chatRooms.set(id, chatRoom);
    return chatRoom;
  }

  async getChatRoomsWithStats(): Promise<ChatRoomWithStats[]> {
    const rooms = await this.getAllChatRooms();
    const roomsWithStats: ChatRoomWithStats[] = [];

    for (const room of rooms) {
      const messages = await this.getChatMessages(room.id, 1);
      roomsWithStats.push({
        ...room,
        messageCount: messages.length,
        lastMessage: messages[0] || undefined,
      });
    }

    return roomsWithStats;
  }

  // Chat Messages
  async getChatMessages(chatRoomId: string, limit = 50, currentUserId?: string): Promise<ChatMessageWithMember[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.chatRoomId === chatRoomId && !msg.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse();

    const messagesWithMembers: ChatMessageWithMember[] = [];
    for (const message of messages) {
      const member = this.members.get(message.memberId);
      if (member) {
        messagesWithMembers.push({
          ...message,
          member,
          likeCount: 0,
          isLikedByCurrentUser: false,
        });
      }
    }

    return messagesWithMembers;
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertChatMessage,
      id,
      replyToMessageId: insertChatMessage.replyToMessageId || null,
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
      isPinned: false,
      pinnedBy: null,
      pinnedAt: null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async deleteChatMessage(messageId: string, deletedBy: string): Promise<boolean> {
    const message = this.chatMessages.get(messageId);
    if (!message) return false;

    const updatedMessage: ChatMessage = {
      ...message,
      isDeleted: true,
      deletedBy,
      deletedAt: new Date(),
    };
    
    this.chatMessages.set(messageId, updatedMessage);
    return true;
  }

  async pinMessage(messageId: string, pinnedBy: string): Promise<boolean> {
    const message = this.chatMessages.get(messageId);
    if (!message) return false;

    const updatedMessage: ChatMessage = {
      ...message,
      isPinned: true,
      pinnedBy,
      pinnedAt: new Date(),
    };
    
    this.chatMessages.set(messageId, updatedMessage);
    return true;
  }

  async unpinMessage(messageId: string): Promise<boolean> {
    const message = this.chatMessages.get(messageId);
    if (!message) return false;

    const updatedMessage: ChatMessage = {
      ...message,
      isPinned: false,
      pinnedBy: null,
      pinnedAt: null,
    };
    
    this.chatMessages.set(messageId, updatedMessage);
    return true;
  }

  async getPinnedMessages(chatRoomId: string, currentUserId?: string): Promise<ChatMessageWithMember[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => 
        message.chatRoomId === chatRoomId && 
        !message.isDeleted && 
        message.isPinned
      )
      .sort((a, b) => (b.pinnedAt?.getTime() || 0) - (a.pinnedAt?.getTime() || 0));

    const messagesWithMembers: ChatMessageWithMember[] = [];

    for (const message of messages) {
      const member = this.members.get(message.memberId);
      if (!member) continue;

      const likes = Array.from(this.messageLikes.values())
        .filter(like => like.messageId === message.id);
      
      const isLikedByCurrentUser = currentUserId 
        ? likes.some(like => like.memberId === currentUserId)
        : false;

      messagesWithMembers.push({
        ...message,
        member,
        likeCount: likes.length,
        isLikedByCurrentUser,
      });
    }

    return messagesWithMembers;
  }

  // Message Likes
  async likeMessage(messageId: string, memberId: string): Promise<boolean> {
    // Check if already liked
    const existingLike = Array.from(this.messageLikes.values())
      .find(like => like.messageId === messageId && like.memberId === memberId);
    
    if (existingLike) return false; // Already liked

    const id = randomUUID();
    const like: MessageLike = {
      id,
      messageId,
      memberId,
      createdAt: new Date(),
    };
    
    this.messageLikes.set(id, like);
    return true;
  }

  async unlikeMessage(messageId: string, memberId: string): Promise<boolean> {
    const existingLike = Array.from(this.messageLikes.entries())
      .find(([_, like]) => like.messageId === messageId && like.memberId === memberId);
    
    if (!existingLike) return false; // Not liked yet

    this.messageLikes.delete(existingLike[0]);
    return true;
  }

  async getMessageLikes(messageId: string): Promise<MessageLike[]> {
    return Array.from(this.messageLikes.values())
      .filter(like => like.messageId === messageId);
  }

  // Missing methods to complete the interface
  async deleteMember(id: string): Promise<boolean> {
    return this.members.delete(id);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    // For MemStorage, we don't actually store notifications, just return the created one
    return newNotification;
  }

  async getUnreadNotifications(memberId: string): Promise<NotificationWithMessage[]> {
    // For MemStorage, return empty array since we don't store notifications
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  async markAllNotificationsAsRead(memberId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  async getUnreadNotificationCount(memberId: string): Promise<number> {
    // For MemStorage, always return 0
    return 0;
  }

  // Polls - Simple in-memory implementation
  async createPoll(poll: InsertPoll, options: string[]): Promise<Poll> {
    const id = randomUUID();
    const newPoll: Poll = {
      ...poll,
      id,
      isActive: true,
      createdAt: new Date(),
      expiresAt: poll.expiresAt || null,
    };
    // For MemStorage, we don't store polls yet, just return the created poll
    return newPoll;
  }

  async getPollsInChatRoom(chatRoomId: string, currentUserId?: string): Promise<PollWithDetails[]> {
    // For MemStorage, return empty array
    return [];
  }

  async getPoll(pollId: string, currentUserId?: string): Promise<PollWithDetails | undefined> {
    // For MemStorage, return undefined
    return undefined;
  }

  async votePoll(pollId: string, optionId: string, memberId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  async unvotePoll(pollId: string, optionId: string, memberId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  async closePoll(pollId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  async deletePoll(pollId: string): Promise<boolean> {
    // For MemStorage, always return true
    return true;
  }

  // Push Subscriptions
  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const id = randomUUID();
    const newSubscription: PushSubscription = {
      ...subscription,
      id,
      createdAt: new Date(),
      userAgent: subscription.userAgent ?? null,
    };

    const [inserted] = await db.insert(pushSubscriptions).values(newSubscription).returning();
    return inserted;
  }

  async getPushSubscriptionsByMember(memberId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.memberId, memberId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async deletePushSubscription(id: string): Promise<boolean> {
    const result = await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<boolean> {
    const result = await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();

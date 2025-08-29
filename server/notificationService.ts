import { storage } from "./storage";
import type { PushSubscription, Race, Member } from "@shared/schema";

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export class NotificationService {
  
  async sendPushToAllMembers(notification: PushNotificationPayload): Promise<{successful: number, failed: number}> {
    const subscriptions = await storage.getAllPushSubscriptions();
    return this.sendPushNotifications(subscriptions, notification);
  }

  async sendPushToMember(memberId: string, notification: PushNotificationPayload): Promise<{successful: number, failed: number}> {
    const subscriptions = await storage.getPushSubscriptionsByMember(memberId);
    return this.sendPushNotifications(subscriptions, notification);
  }

  private async sendPushNotifications(
    subscriptions: PushSubscription[],
    notification: PushNotificationPayload
  ): Promise<{successful: number, failed: number}> {
    let successful = 0;
    let failed = 0;

    const promises = subscriptions.map(async (subscription) => {
      try {
        // For now, simulate sending (in production, use web-push library)
        console.log(`Simulating push to ${subscription.endpoint}:`, notification);
        successful++;
      } catch (error) {
        console.error('Failed to send push notification:', error);
        failed++;
      }
    });

    await Promise.allSettled(promises);
    return { successful, failed };
  }

  // Automatic notification events
  async notifyNewRaceAdded(race: Race): Promise<void> {
    const notification: PushNotificationPayload = {
      title: "🏁 New Race Added!",
      body: `${race.name} at ${race.track} - Register now!`,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: "/races",
      tag: `new-race-${race.id}`
    };

    const result = await this.sendPushToAllMembers(notification);
    console.log(`New race notification sent to ${result.successful} members`);
  }

  async notifyRaceStartingSoon(race: Race, minutes: number): Promise<void> {
    const notification: PushNotificationPayload = {
      title: "⚡ Race Starting Soon!",
      body: `${race.name} starts in ${minutes} minutes. Good luck!`,
      icon: "/icon-192.png",
      badge: "/badge-72.png", 
      url: "/races",
      tag: `race-starting-${race.id}`
    };

    // Get all members registered for this race
    const registrations = await storage.getRegistrationsByRace(race.id);
    for (const registration of registrations) {
      await this.sendPushToMember(registration.memberId, notification);
    }
    
    console.log(`Race starting notification sent to ${registrations.length} registered members`);
  }

  async notifyRaceUpdated(race: Race): Promise<void> {
    const notification: PushNotificationPayload = {
      title: "📝 Race Updated",
      body: `${race.name} details have been updated. Check the latest info.`,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: "/races",
      tag: `race-updated-${race.id}`
    };

    const result = await this.sendPushToAllMembers(notification);
    console.log(`Race updated notification sent to ${result.successful} members`);
  }

  async notifyChampionshipResults(): Promise<void> {
    const notification: PushNotificationPayload = {
      title: "🏆 Championship Results Updated!",
      body: "Latest race results are in. Check your standings!",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: "/championships",
      tag: "championship-results"
    };

    const result = await this.sendPushToAllMembers(notification);
    console.log(`Championship results notification sent to ${result.successful} members`);
  }

  async notifyImportantChatMessage(memberName: string, chatRoomName: string): Promise<void> {
    const notification: PushNotificationPayload = {
      title: "💬 Important Club Message",
      body: `${memberName} posted an important message in ${chatRoomName}`,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: "/chat",
      tag: "important-chat"
    };

    const result = await this.sendPushToAllMembers(notification);
    console.log(`Important chat notification sent to ${result.successful} members`);
  }

  // Scheduled notification checker (can be called by a cron job)
  async checkUpcomingRaces(): Promise<void> {
    try {
      const races = await storage.getAllRaces();
      const now = new Date();
      
      for (const race of races) {
        if (!race.isActive) continue;
        
        const raceTime = new Date(race.date);
        const timeDiff = raceTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));
        
        // Notify 30 minutes before race starts
        if (minutesUntil === 30) {
          await this.notifyRaceStartingSoon(race, 30);
        }
        
        // Notify 10 minutes before race starts  
        if (minutesUntil === 10) {
          await this.notifyRaceStartingSoon(race, 10);
        }
      }
    } catch (error) {
      console.error('Error checking upcoming races:', error);
    }
  }
}

export const notificationService = new NotificationService();
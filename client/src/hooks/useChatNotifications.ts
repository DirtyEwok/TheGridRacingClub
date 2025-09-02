import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentMember } from '@/lib/memberSession';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  championshipId?: string;
  lastMessageAt?: string;
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  message: string;
  createdAt: string;
  member: {
    id: string;
    gamertag: string;
  };
}

export function useChatNotifications() {
  const currentMember = getCurrentMember();
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, string>>(() => {
    // Load from localStorage
    const stored = localStorage.getItem('chat-last-seen');
    return stored ? JSON.parse(stored) : {};
  });

  // Get all chat rooms
  const { data: chatRooms = [] } = useQuery({
    queryKey: ['/api/chat-rooms'],
    enabled: !!currentMember,
  });

  // Get latest messages for each room to check for unread
  const { data: allRoomsMessages = [] } = useQuery({
    queryKey: ['/api/chat-rooms/latest-messages'],
    queryFn: async () => {
      if (!chatRooms.length) return [];
      
      const roomMessages = await Promise.all(
        chatRooms.map(async (room: ChatRoom) => {
          try {
            const response = await fetch(`/api/chat-rooms/${room.id}/messages?limit=1`);
            if (!response.ok) return { roomId: room.id, latestMessage: null };
            
            const messages = await response.json();
            return {
              roomId: room.id,
              latestMessage: messages.length > 0 ? messages[messages.length - 1] : null
            };
          } catch (error) {
            return { roomId: room.id, latestMessage: null };
          }
        })
      );
      return roomMessages;
    },
    enabled: !!currentMember && chatRooms.length > 0,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Calculate unread count
  const unreadRoomsCount = allRoomsMessages.reduce((count, roomData) => {
    if (!roomData.latestMessage || !currentMember) return count;
    
    const lastSeen = lastSeenTimestamps[roomData.roomId];
    const latestMessageTime = roomData.latestMessage.createdAt;
    
    // Don't count messages from the current user
    if (roomData.latestMessage.member.id === currentMember.id) return count;
    
    // If no last seen timestamp, or latest message is newer than last seen
    if (!lastSeen || new Date(latestMessageTime) > new Date(lastSeen)) {
      return count + 1;
    }
    
    return count;
  }, 0);

  const markRoomAsRead = (roomId: string) => {
    const now = new Date().toISOString();
    const newTimestamps = {
      ...lastSeenTimestamps,
      [roomId]: now
    };
    setLastSeenTimestamps(newTimestamps);
    localStorage.setItem('chat-last-seen', JSON.stringify(newTimestamps));
  };

  const markAllRoomsAsRead = () => {
    const now = new Date().toISOString();
    const newTimestamps: Record<string, string> = {};
    
    chatRooms.forEach((room: ChatRoom) => {
      newTimestamps[room.id] = now;
    });
    
    setLastSeenTimestamps(newTimestamps);
    localStorage.setItem('chat-last-seen', JSON.stringify(newTimestamps));
  };

  return {
    unreadRoomsCount,
    markRoomAsRead,
    markAllRoomsAsRead,
  };
}
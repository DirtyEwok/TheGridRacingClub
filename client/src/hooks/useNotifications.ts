import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationWithMessage } from '@shared/schema';
import { getCurrentMemberId } from '@/lib/memberSession';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const currentMemberId = getCurrentMemberId();

  // Fetch unread notification count
  const { data: countData, refetch: refetchCount } = useQuery({
    queryKey: ['/api/notifications', currentMemberId, 'count'],
    enabled: !!currentMemberId,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch unread notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery<NotificationWithMessage[]>({
    queryKey: ['/api/notifications', currentMemberId],
    enabled: !!currentMemberId,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Update count when data changes
  useEffect(() => {
    if (countData && typeof countData === 'object' && 'count' in countData) {
      setUnreadCount(countData.count as number);
    }
  }, [countData]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!currentMemberId) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refetch both queries
        refetchCount();
        refetchNotifications();
        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentMemberId) return;

    try {
      const response = await fetch(`/api/notifications/${currentMemberId}/read-all`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setUnreadCount(0);
        // Refetch both queries
        refetchCount();
        refetchNotifications();
        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Refresh notifications manually
  const refresh = () => {
    refetchCount();
    refetchNotifications();
  };

  return {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
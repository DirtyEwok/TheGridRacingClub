import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentMember } from "@/lib/memberSession";

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const getCurrentPermissionStatus = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await registration.update();
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    const currentMember = getCurrentMember();
    if (!currentMember) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to enable notifications",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        throw new Error('Notifications are blocked. Please enable them in your browser settings: Click the 🔒 lock icon in your address bar → Allow notifications');
      }
      if (permission !== 'granted') {
        throw new Error('Notification permission required. Please allow notifications when prompted.');
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Generate VAPID keys (in production, use actual VAPID keys)
      const applicationServerKey = urlBase64ToUint8Array(
        'BMJYk7QvGPJ9eW8oaKK4WBr_5TG2sXFZr1KGR3VZfk4QNkWOBNv2Vwn9Qw8rNvD4-Lx5xQ2Qk9Sk8rR4WqNgN2Q'
      );

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentMember.id,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive race updates and announcements",
      });
    } catch (error: any) {
      console.error('Push subscription failed:', error);
      toast({
        title: "Notification Setup Failed",
        description: error.message || "Please try again or check your browser settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore",
      });
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  const permissionStatus = getCurrentPermissionStatus();

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribeFromPush}
          disabled={isLoading}
          data-testid="button-disable-notifications"
          className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-black"
        >
          <BellOff className="h-4 w-4 mr-2" />
          {isLoading ? "Disabling..." : "Disable Alerts"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribeToPush}
          disabled={isLoading}
          data-testid="button-enable-notifications"
          className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-black"
          title={permissionStatus === 'denied' ? 
            'Notifications blocked. Click the lock icon in your address bar to enable them.' : 
            'Enable push notifications for race updates'
          }
        >
          <Bell className="h-4 w-4 mr-2" />
          {isLoading ? "Enabling..." : 
           permissionStatus === 'denied' ? "Unblock Alerts" :
           "Enable Alerts"}
        </Button>
      )}
    </div>
  );
}
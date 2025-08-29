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
    
    // Check if we're in an iframe (Replit environment)
    const inIframe = window !== window.top;
    if (inIframe && Notification.permission === 'default') {
      // In iframe, permission might show as 'default' even when allowed
      return 'default-iframe';
    }
    
    return Notification.permission;
  };

  const registerServiceWorker = async () => {
    try {
      // For mobile compatibility, ensure we wait for ready state
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw new Error('Failed to register service worker. Please try refreshing the page.');
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
      // Check if we're in Replit iframe environment
      const inIframe = window !== window.top;
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'denied') {
        if (inIframe) {
          throw new Error('Replit iframe notification issue. Try opening your app in a new tab: Click the "Open in new tab" button at the top of the preview, then enable notifications there.');
        } else {
          throw new Error('Notifications are blocked. To enable: Browser settings → Privacy/Permissions → Notifications → Allow for this site');
        }
      }
      
      if (permission !== 'granted') {
        if (inIframe) {
          throw new Error('Replit iframe detected. For full notification support, open your app in a new tab using the "Open in new tab" button in the preview area.');
        } else {
          throw new Error('Notification permission required. Please allow notifications when prompted.');
        }
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Generate VAPID keys - using a more compatible format for mobile
      const applicationServerKey = urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLdiTKBFMDddDQJBFAwL4-mcg6wAgKSHXTH_zJLZd4QPCzBIl6_5TXc'
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
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Subscription save failed:', response.status, errorText);
        throw new Error(`Failed to save subscription: ${response.status} - Please try again`);
      }

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive race updates and announcements",
      });
    } catch (error: any) {
      console.error('Push subscription failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // More specific error messages for debugging
      let errorMessage = error.message || "Unknown error occurred";
      
      if (error.message?.includes('Failed to save subscription')) {
        errorMessage = `Server error: ${error.message}. Check console for details.`;
      } else if (error.message?.includes('service worker')) {
        errorMessage = `Service worker issue: ${error.message}. Try refreshing the page.`;
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Push notifications not supported on this browser/device.";
      } else if (error.name === 'InvalidStateError') {
        errorMessage = "Subscription state error. Try refreshing and enabling again.";
      } else {
        errorMessage = `Error: ${error.message}. Check browser console for more details.`;
      }
      
      toast({
        title: "Notification Setup Failed",
        description: errorMessage,
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
          className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white h-6 px-2 text-xs"
        >
          <BellOff className="w-3 h-3 mr-1" />
          {isLoading ? "Disabling..." : "Disable Alerts"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribeToPush}
          disabled={isLoading}
          data-testid="button-enable-notifications"
          className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white h-6 px-2 text-xs"
          title={permissionStatus === 'denied' ? 
            'Notifications blocked. Check browser settings → Privacy/Permissions → Notifications to enable them.' : 
            'Enable push notifications for race updates'
          }
        >
          <Bell className="w-3 h-3 mr-1" />
          {isLoading ? "Enabling..." : 
           permissionStatus === 'denied' ? "Unblock Alerts" :
           "Enable Alerts"}
        </Button>
      )}
    </div>
  );
}
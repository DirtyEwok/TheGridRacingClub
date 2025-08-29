// Service Worker for Push Notifications
const CACHE_NAME = 'grid-racing-club-v1';

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'The Grid Racing Club',
      body: event.data ? event.data.text() : 'New notification',
      icon: '/icon-192.png',
      badge: '/badge-72.png'
    };
  }
  
  const {
    title = 'The Grid Racing Club',
    body = 'You have a new notification',
    icon = '/icon-192.png',
    badge = '/badge-72.png',
    url = '/',
    tag = 'grid-notification'
  } = notificationData;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    data: { url },
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const { action } = event;
  const { url = '/' } = event.notification.data || {};
  
  if (action === 'dismiss') {
    return;
  }
  
  // Open the app or focus existing tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            if (url !== '/') {
              client.navigate(url);
            }
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'race-registration') {
    event.waitUntil(syncRaceRegistrations());
  }
});

async function syncRaceRegistrations() {
  try {
    // Handle any pending race registrations when back online
    console.log('Syncing pending race registrations...');
  } catch (error) {
    console.error('Error syncing race registrations:', error);
  }
}
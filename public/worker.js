// public/worker.js
// این فایل فقط برای مدیریت Push Notification است

self.addEventListener('install', function(event) {
    console.log('[Push Worker] Installing...');
    event.waitUntil(self.skipWaiting());
  });
  
  self.addEventListener('activate', function(event) {
    console.log('[Push Worker] Activating...');
    event.waitUntil(self.clients.claim());
  });
  
  // ===== دریافت اعلان =====
  self.addEventListener('push', function(event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return;
    }
  
    let data = {};
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        data = {
          title: 'پیام جدید',
          body: event.data.text(),
          icon: '/icons/icon-192x192.png'
        };
      }
    }
  
    const options = {
      body: data.body || 'پیام جدیدی برای شما ارسال شده است.',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        messageId: data.messageId || null,
        sender: data.sender || null
      },
      actions: [
        { action: 'open', title: 'مشاهده پیام' },
        { action: 'close', title: 'بستن' }
      ]
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title || 'پیام جدید', options)
    );
  });
  
  // ===== کلیک روی اعلان =====
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'close') return;
    
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  });
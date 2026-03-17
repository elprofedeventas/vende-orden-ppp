// ─── VENDE ORDEN PPP — Service Worker ────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Recibir mensaje desde la app para mostrar notificación
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, data, tag } = e.data
    self.registration.showNotification(title, {
      body,
      tag,
      data,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: true,
      actions: [
        { action: 'ver',      title: '👁 Ver' },
        { action: 'posponer', title: '⏰ Posponer' },
      ]
    })
  }
})

// Clic en notificación o botones
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const data = e.notification.data || {}

  if (e.action === 'posponer') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'POSPONER', data }))
      })
    )
    return
  }

  // 'ver' o clic directo
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const appClient = clients.find(c => c.url.includes(self.location.origin))
      if (appClient) {
        appClient.focus()
        appClient.postMessage({ type: 'NAVEGAR', data })
      } else {
        self.clients.openWindow(self.location.origin)
      }
    })
  )
})

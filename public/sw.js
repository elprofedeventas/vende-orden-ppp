// ─── VENDE ORDEN PPP — Service Worker de Alertas ─────────────────────────────

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
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,   // no se cierra sola en Android
      actions: [
        { action: 'ver',      title: '👁 Ver' },
        { action: 'posponer', title: '⏰ Posponer' },
        { action: 'llamar',   title: '📞 Llamar' },
      ]
    })
  }
})

// Manejar clic en la notificación o en sus botones
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const data = e.notification.data || {}

  if (e.action === 'llamar') {
    // Abrir marcador telefónico
    if (data.telefono) {
      e.waitUntil(self.clients.openWindow(`tel:${data.telefono}`))
    }
    return
  }

  if (e.action === 'posponer') {
    // Mandar mensaje de vuelta a la app para reprogramar
    e.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'POSPONER', data }))
      })
    )
    return
  }

  // 'ver' o clic directo — enfocar la app y navegar a la orden/pista
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

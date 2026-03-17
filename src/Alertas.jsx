import { useEffect, useRef, useCallback } from 'react'
import { API_BASE } from './shared.jsx'

function parseFechaHora(str) {
  if (!str) return null
  const s = str.toString().trim()
  const partes = s.split(' ')
  const fechaParte = partes[0]
  const horaParte  = partes[1] || null
  if (!horaParte) return null
  const [d, m, y] = fechaParte.split('/').map(Number)
  const [hh, mm]  = horaParte.split(':').map(Number)
  if (!d || !m || !y || isNaN(hh) || isNaN(mm)) return null
  return new Date(y, m - 1, d, hh, mm, 0)
}

export default function Alertas({ onNavegar }) {
  const timersRef          = useRef({})
  const minutosAntesRef    = useRef(30)
  const minutosPosponerRef = useRef(10)
  const swRef              = useRef(null)

  // ─── Registrar Service Worker ─────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then(reg => {
      swRef.current = reg
    }).catch(() => {})

    // Escuchar mensajes del SW (posponer, navegar)
    const handler = (e) => {
      if (e.data?.type === 'POSPONER') posponerDesdeSW(e.data.data)
      if (e.data?.type === 'NAVEGAR' && onNavegar) onNavegar(e.data.data)
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  const posponerDesdeSW = (data) => {
    const ms = minutosPosponerRef.current * 60 * 1000
    setTimeout(() => {
      window.__mostrarAlerta?.({
        tag: 'posponer-' + Date.now(),
        hora: (data.siguienteAccionFecha || '').toString().split(' ')[1] || '',
        minutosPosponer: minutosPosponerRef.current,
        data,
      })
    }, ms)
  }

  // ─── Pedir permiso de notificaciones ─────────────────────────────────────
  const pedirPermiso = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const p = await Notification.requestPermission()
    return p === 'granted'
  }, [])

  // ─── Disparar alerta: banner si app visible, notificación si minimizada ───
  const disparar = useCallback((actividad, hora) => {
    const tag = actividad.numOrden
      ? `orden-${actividad.numOrden}`
      : `pista-${actividad.rowIndex}`

    const title = `⏰ ${actividad.clienteNombre || actividad.nombre || ''}`
    const body  = [
      actividad.accion || actividad.accionSeguimiento || 'Seguimiento',
      hora ? `🕐 ${hora}` : '',
    ].filter(Boolean).join(' · ')

    // Siempre mostrar banner (si la app está abierta lo verá)
    window.__mostrarAlerta?.({
      tag,
      hora,
      minutosPosponer: minutosPosponerRef.current,
      data: actividad,
    })

    // También enviar notificación via SW (llega aunque esté minimizada)
    if (swRef.current && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          tag,
          data: actividad,
        })
      })
    }
  }, [])

  // ─── Programar una alerta ─────────────────────────────────────────────────
  const programar = useCallback((actividad) => {
    const fechaHora = parseFechaHora(actividad.siguienteAccionFecha)
    if (!fechaHora) return

    const ahora = new Date()
    const msAntes = minutosAntesRef.current * 60 * 1000
    const msParaAlerta = fechaHora.getTime() - msAntes - ahora.getTime()
    if (msParaAlerta < 0) return

    const tag = actividad.numOrden
      ? `orden-${actividad.numOrden}`
      : `pista-${actividad.rowIndex}`

    if (timersRef.current[tag]) return

    const hora = actividad.siguienteAccionFecha.toString().split(' ')[1] || ''

    const id = setTimeout(() => {
      delete timersRef.current[tag]
      disparar(actividad, hora)
    }, msParaAlerta)

    timersRef.current[tag] = id
  }, [disparar])

  // ─── Limpiar timers obsoletos ─────────────────────────────────────────────
  const limpiarObsoletos = useCallback((tagsActivos) => {
    Object.keys(timersRef.current).forEach(tag => {
      if (!tagsActivos.has(tag)) {
        clearTimeout(timersRef.current[tag])
        delete timersRef.current[tag]
      }
    })
  }, [])

  // ─── Cargar actividades y programar ──────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}?action=getMiDia`)
      const json = await res.json()
      if (!json.success) return

      const { actividadesHoy = [], minutosAntes, minutosPosponer } = json.data
      minutosAntesRef.current    = parseInt(minutosAntes)    || 30
      minutosPosponerRef.current = parseInt(minutosPosponer) || 10

      const tagsActivos = new Set(
        actividadesHoy
          .filter(a => parseFechaHora(a.siguienteAccionFecha))
          .map(a => a.numOrden ? `orden-${a.numOrden}` : `pista-${a.rowIndex}`)
      )

      limpiarObsoletos(tagsActivos)
      actividadesHoy.forEach(a => programar(a))
    } catch {}
  }, [programar, limpiarObsoletos])

  // ─── Arrancar, pedir permiso y recargar cada 2 minutos ───────────────────
  useEffect(() => {
    pedirPermiso().then(() => cargar())
    const intervalo = setInterval(cargar, 2 * 60 * 1000)
    return () => {
      clearInterval(intervalo)
      Object.values(timersRef.current).forEach(clearTimeout)
      timersRef.current = {}
    }
  }, [cargar, pedirPermiso])

  return null
}

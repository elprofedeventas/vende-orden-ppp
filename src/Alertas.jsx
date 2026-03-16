import { useEffect, useRef, useCallback } from 'react'
import { API_BASE } from './shared.jsx'

// ─── Parsear "dd/MM/yyyy HH:mm" o "dd/MM/yyyy" a Date ───────────────────────
function parseFechaHora(str) {
  if (!str) return null
  const s = str.toString().trim()
  // Formato: "dd/MM/yyyy HH:mm" o "dd/MM/yyyy"
  const partes = s.split(' ')
  const fechaParte = partes[0]
  const horaParte  = partes[1] || '00:00'
  const [d, m, y]  = fechaParte.split('/').map(Number)
  const [hh, mm]   = horaParte.split(':').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0)
}

// ─── Obtener minutosAntes desde MiDía (lo trae el backend) ───────────────────
// El backend ya expone `data.minutosAntes` y `data.minutosPosponer`
// Si no existe, usamos defaults

export default function Alertas({ onNavegar }) {
  const timeoutsRef    = useRef([])   // lista de { id, tag } activos
  const posponerRef    = useRef([])   // ids de timers de posponer
  const swRef          = useRef(null) // ServiceWorkerRegistration
  const minutosAntesRef   = useRef(30)
  const minutosPosponerRef = useRef(10)

  // ─── Registrar Service Worker ───────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').then(reg => {
      swRef.current = reg
    }).catch(err => console.warn('SW no registrado:', err))

    // Escuchar mensajes del SW (posponer, navegar)
    const handler = (e) => {
      if (e.data?.type === 'POSPONER') {
        posponerAlerta(e.data.data)
      }
      if (e.data?.type === 'NAVEGAR') {
        if (onNavegar) onNavegar(e.data.data)
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  // ─── Pedir permiso de notificaciones ───────────────────────────────────────
  const pedirPermiso = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  }, [])

  // ─── Enviar notificación via SW + banner interno + badge ───────────────────
  const enviarNotificacion = useCallback(({ title, body, data, tag, minutosPosponer }) => {
    // 1. Notificación del navegador (cuando está minimizada)
    if (swRef.current) {
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, data, tag })
      })
    }

    // 2. Banner flotante (cuando la app está en pantalla)
    window.__agregarAlertaBanner?.({ title, body, data, tag, minutosPosponer })

    // 3. Badge en el ícono PWA
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(() => {})
    }
  }, [])

  // ─── Programar una alerta para una actividad ───────────────────────────────
  const programarAlerta = useCallback((actividad, minutosAntes) => {
    const fechaStr = actividad.siguienteAccionFecha
    if (!fechaStr) return

    // Solo alertar si tiene hora definida
    const tieneHora = fechaStr.toString().includes(' ') && fechaStr.toString().split(' ')[1] !== '00:00'
    if (!tieneHora) return

    const fechaActividad = parseFechaHora(fechaStr)
    if (!fechaActividad) return

    const ahora = new Date()
    const msAntes = minutosAntes * 60 * 1000
    const msParaAlerta = fechaActividad.getTime() - msAntes - ahora.getTime()

    // Solo programar si falta más de 0ms (no pasó ya)
    if (msParaAlerta < 0) return

    const tag = actividad.numOrden
      ? `orden-${actividad.numOrden}`
      : `pista-${actividad.clienteNombre}-${fechaStr}`

    const title = `⏰ ${actividad.clienteNombre}`
    const horaStr = fechaStr.toString().split(' ')[1] || ''
    const body = [
      actividad.accion || 'Seguimiento pendiente',
      actividad.clienteNegocio ? `📍 ${actividad.clienteNegocio}` : '',
      horaStr ? `🕐 ${horaStr}` : '',
    ].filter(Boolean).join(' · ')

    const data = {
      numOrden:      actividad.numOrden || '',
      clienteNombre: actividad.clienteNombre || '',
      clienteNegocio:actividad.clienteNegocio || '',
      telefono:      actividad.clienteTelefono || '',
      accion:        actividad.accion || '',
      esPista:       actividad.esPista || false,
      rowIndex:      actividad.rowIndex || '',
      fechaStr,
    }

    const id = setTimeout(() => {
      enviarNotificacion({ title, body, data, tag, minutosPosponer: minutosPosponerRef.current })
      // Limpiar este timer de la lista al disparar
      timeoutsRef.current = timeoutsRef.current.filter(t => t.tag !== tag)
    }, msParaAlerta)

    timeoutsRef.current.push({ id, tag })
  }, [enviarNotificacion])

  // ─── Posponer una alerta X minutos ────────────────────────────────────────
  const posponerAlerta = useCallback((data) => {
    const minutos = minutosPosponerRef.current
    const title = `⏰ ${data.clienteNombre} (pospuesto)`
    const body  = data.accion || 'Seguimiento pendiente'

    const id = setTimeout(() => {
      enviarNotificacion({ title, body, data, tag: `posponer-${Date.now()}`, minutosPosponer: minutos })
    }, minutos * 60 * 1000)

    posponerRef.current.push(id)
  }, [enviarNotificacion])

  // ─── Cargar actividades y programar alertas ────────────────────────────────
  const cargarYProgramar = useCallback(async () => {
    const permiso = await pedirPermiso()
    if (!permiso) return

    try {
      const res  = await fetch(`${API_BASE}?action=getMiDia`)
      const json = await res.json()
      if (!json.success) return

      const { actividadesHoy, minutosAntes, minutosPosponer } = json.data

      // Leer configuración
      minutosAntesRef.current    = parseInt(minutosAntes)    || 30
      minutosPosponerRef.current = parseInt(minutosPosponer) || 10

      // Calcular qué tags nuevos necesitan programarse
      const tagsActivos = new Set(timeoutsRef.current.map(t => t.tag))

      // Cancelar solo los timers cuya actividad ya no existe en la lista nueva
      const tagsNuevos = new Set((actividadesHoy || []).map(act => {
        const fechaStr = act.siguienteAccionFecha
        if (!fechaStr) return null
        return act.numOrden
          ? `orden-${act.numOrden}`
          : `pista-${act.clienteNombre}-${fechaStr}`
      }).filter(Boolean))

      timeoutsRef.current = timeoutsRef.current.filter(t => {
        if (!tagsNuevos.has(t.tag)) { clearTimeout(t.id); return false }
        return true
      })

      // Programar solo las actividades que aún no tienen timer activo
      ;(actividadesHoy || []).forEach(act => {
        const fechaStr = act.siguienteAccionFecha
        if (!fechaStr) return
        const tag = act.numOrden
          ? `orden-${act.numOrden}`
          : `pista-${act.clienteNombre}-${fechaStr}`
        if (!tagsActivos.has(tag)) {
          programarAlerta(act, minutosAntesRef.current)
        }
      })
    } catch (err) {
      console.warn('[Alertas] Error al cargar actividades:', err)
    }
  }, [pedirPermiso, programarAlerta])

  // ─── Arrancar al montar y recargar cada hora ───────────────────────────────
  useEffect(() => {
    cargarYProgramar()

    // Recargar cada 2 min por si cambian las actividades
    const intervalo = setInterval(cargarYProgramar, 2 * 60 * 1000)

    return () => {
      clearInterval(intervalo)
      timeoutsRef.current.forEach(t => clearTimeout(t.id))
      posponerRef.current.forEach(id => clearTimeout(id))
    }
  }, [cargarYProgramar])

  // Componente invisible — no renderiza nada
  return null
}

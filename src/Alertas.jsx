import { useEffect, useRef, useCallback } from 'react'
import { API_BASE } from './shared.jsx'

// ─── Parsear "dd/MM/yyyy HH:mm" a Date ───────────────────────────────────────
function parseFechaHora(str) {
  if (!str) return null
  const s = str.toString().trim()
  const partes = s.split(' ')
  const fechaParte = partes[0]
  const horaParte  = partes[1] || null
  if (!horaParte) return null // sin hora = no programar alerta
  const [d, m, y] = fechaParte.split('/').map(Number)
  const [hh, mm]  = horaParte.split(':').map(Number)
  if (!d || !m || !y || isNaN(hh) || isNaN(mm)) return null
  return new Date(y, m - 1, d, hh, mm, 0)
}

// ─── Alertas ──────────────────────────────────────────────────────────────────
export default function Alertas({ onNavegar }) {
  const timersRef          = useRef({})  // { tag: timeoutId }
  const minutosAntesRef    = useRef(30)
  const minutosPosponerRef = useRef(10)

  // ─── Programar una alerta ──────────────────────────────────────────────────
  const programar = useCallback((actividad) => {
    const fechaHora = parseFechaHora(actividad.siguienteAccionFecha)
    if (!fechaHora) return

    const ahora = new Date()
    const msAntes = minutosAntesRef.current * 60 * 1000
    const msParaAlerta = fechaHora.getTime() - msAntes - ahora.getTime()

    if (msParaAlerta < 0) return // ya pasó

    const tag = actividad.numOrden
      ? `orden-${actividad.numOrden}`
      : `pista-${actividad.rowIndex}`

    // Si ya está programada con este tag, no reprogramar
    if (timersRef.current[tag]) return

    const hora = actividad.siguienteAccionFecha.toString().split(' ')[1] || ''

    const id = setTimeout(() => {
      delete timersRef.current[tag]
      window.__mostrarAlerta?.({
        tag,
        hora,
        minutosPosponer: minutosPosponerRef.current,
        data: actividad,
      })
    }, msParaAlerta)

    timersRef.current[tag] = id
  }, [])

  // ─── Cancelar timers que ya no existen en la lista ────────────────────────
  const limpiarObsoletos = useCallback((tagsActivos) => {
    Object.keys(timersRef.current).forEach(tag => {
      if (!tagsActivos.has(tag)) {
        clearTimeout(timersRef.current[tag])
        delete timersRef.current[tag]
      }
    })
  }, [])

  // ─── Cargar actividades y programar ───────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}?action=getMiDia`)
      const json = await res.json()
      if (!json.success) return

      const { actividadesHoy = [], minutosAntes, minutosPosponer } = json.data

      minutosAntesRef.current    = parseInt(minutosAntes)    || 30
      minutosPosponerRef.current = parseInt(minutosPosponer) || 10

      // Calcular tags activos
      const tagsActivos = new Set(
        actividadesHoy
          .filter(a => parseFechaHora(a.siguienteAccionFecha))
          .map(a => a.numOrden ? `orden-${a.numOrden}` : `pista-${a.rowIndex}`)
      )

      // Cancelar los que ya no están
      limpiarObsoletos(tagsActivos)

      // Programar los nuevos
      actividadesHoy.forEach(a => programar(a))

    } catch {}
  }, [programar, limpiarObsoletos])

  // ─── Arrancar y recargar cada 2 minutos ───────────────────────────────────
  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 2 * 60 * 1000)
    return () => {
      clearInterval(intervalo)
      Object.values(timersRef.current).forEach(clearTimeout)
      timersRef.current = {}
    }
  }, [cargar])

  return null
}

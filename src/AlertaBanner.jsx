import { useState, useEffect } from 'react'
import { API_BASE } from './shared.jsx'

// ─── AlertaBanner ─────────────────────────────────────────────────────────────
// Recibe alertas desde Alertas.jsx via prop onRegistrar
// Se muestra como banner flotante en la parte superior de la app

export default function AlertaBanner({ onVer, onLlamar }) {
  const [alertas, setAlertas] = useState([]) // lista de alertas activas

  // Exponer función global para que Alertas.jsx pueda agregar alertas
  useEffect(() => {
    window.__agregarAlertaBanner = (alerta) => {
      setAlertas(prev => {
        // No duplicar por tag
        if (prev.find(a => a.tag === alerta.tag)) return prev
        return [...prev, { ...alerta, id: Date.now() }]
      })

      // Vibrar si el navegador lo soporta
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300])
      }

      // Sonido de alerta
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const playBeep = (freq, start, duration) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
          osc.start(ctx.currentTime + start)
          osc.stop(ctx.currentTime + start + duration)
        }
        playBeep(880, 0,    0.15)
        playBeep(660, 0.2,  0.15)
        playBeep(880, 0.4,  0.25)
      } catch {}
    }

    return () => { delete window.__agregarAlertaBanner }
  }, [])

  const cerrar = (id) => setAlertas(prev => prev.filter(a => a.id !== id))

  const posponer = (alerta) => {
    cerrar(alerta.id)
    // Reprogramar en minutosPosponer
    const ms = (alerta.minutosPosponer || 10) * 60 * 1000
    setTimeout(() => {
      window.__agregarAlertaBanner?.({ ...alerta, tag: alerta.tag + '-pos-' + Date.now() })
    }, ms)
  }

  if (alertas.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '4px',
      pointerEvents: 'none',
    }}>
      {alertas.map(alerta => (
        <div key={alerta.id} style={{
          background: 'var(--brand)',
          color: 'white',
          padding: '14px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          animation: 'slideDown 0.3s ease',
          pointerEvents: 'all',
          borderBottom: '3px solid #fbbf24',
        }}>
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-100%); opacity: 0; }
              to   { transform: translateY(0);     opacity: 1; }
            }
          `}</style>

          {/* Encabezado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                ⏰ Recordatorio
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                {alerta.data?.clienteNombre}
              </div>
              {alerta.data?.clienteNegocio && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>
                  {alerta.data.clienteNegocio}
                </div>
              )}
            </div>
            <button onClick={() => cerrar(alerta.id)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '8px' }}>
              ✕
            </button>
          </div>

          {/* Info */}
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {alerta.data?.accion && (
              <span>📋 {alerta.data.accion}</span>
            )}
            {alerta.body && (
              <span>🕐 {alerta.body.split('·').pop()?.trim()}</span>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { onVer?.(alerta.data); cerrar(alerta.id) }}
              style={{ flex: 1, padding: '9px', background: 'white', color: 'var(--brand)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              👁 Ver
            </button>
            <button onClick={() => posponer(alerta)}
              style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              ⏰ Posponer {alerta.minutosPosponer || 10}min
            </button>
            {alerta.data?.telefono && (
              <a href={`tel:${alerta.data.telefono}`}
                style={{ flex: 1, padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📞 Llamar
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Icon, icons } from './shared.jsx'

// ─── AlertaBanner ─────────────────────────────────────────────────────────────
// Se monta una vez en App.jsx y permanece invisible hasta que hay una alerta.
// Alertas.jsx le pasa alertas via window.__mostrarAlerta(alerta)

export default function AlertaBanner({ onVer }) {
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    // Registrar función global para recibir alertas desde Alertas.jsx
    window.__mostrarAlerta = (alerta) => {
      setAlertas(prev => {
        // No duplicar la misma alerta (mismo tag)
        if (prev.find(a => a.tag === alerta.tag)) return prev
        return [...prev, { ...alerta, id: Date.now() + Math.random() }]
      })

      // Vibrar si el dispositivo lo soporta
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])

      // Sonido
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const beep = (freq, start, dur) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.frequency.value = freq; o.type = 'sine'
          g.gain.setValueAtTime(0.3, ctx.currentTime + start)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
          o.start(ctx.currentTime + start)
          o.stop(ctx.currentTime + start + dur)
        }
        beep(880, 0, 0.15)
        beep(660, 0.2, 0.15)
        beep(880, 0.4, 0.25)
      } catch {}
    }

    return () => { delete window.__mostrarAlerta }
  }, [])

  const cerrar = (id) => setAlertas(prev => prev.filter(a => a.id !== id))

  const posponer = (alerta) => {
    cerrar(alerta.id)
    const ms = (alerta.minutosPosponer || 10) * 60 * 1000
    setTimeout(() => {
      window.__mostrarAlerta?.({
        ...alerta,
        tag: alerta.tag + '-pos-' + Date.now(),
      })
    }, ms)
  }

  if (alertas.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '2px',
      pointerEvents: 'none',
    }}>
      {alertas.map(alerta => {
        const d = alerta.data || {}
        const minPos = alerta.minutosPosponer || 10
        return (
          <div key={alerta.id} style={{
            background: 'var(--brand)',
            color: 'white',
            padding: '12px 16px',
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

            {/* Fila superior: tipo + cerrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ⏰ {d.esPista ? 'Seguimiento de pista' : 'Seguimiento de orden'}
              </span>
              <button onClick={() => cerrar(alerta.id)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            {/* Nombre y negocio */}
            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px' }}>
              {d.clienteNombre || d.nombre || ''}
            </div>
            {(d.clienteNegocio || d.negocio) && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                {d.clienteNegocio || d.negocio}
              </div>
            )}

            {/* Acción y hora */}
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '10px' }}>
              {d.accion && <span>{d.accion}</span>}
              {alerta.hora && <span style={{ marginLeft: '8px', color: '#fbbf24', fontWeight: '700' }}>🕐 {alerta.hora}</span>}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { onVer?.(d); cerrar(alerta.id) }}
                style={{ flex: 1, padding: '8px', background: 'white', color: 'var(--brand)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                👁 Ver
              </button>
              <button onClick={() => posponer(alerta)}
                style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                ⏰ Posponer {minPos}min
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

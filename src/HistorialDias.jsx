import { useState, useEffect } from 'react'
import { API_BASE, Icon, icons, getNowGuayaquil } from './shared.jsx'

const fmtM = (n) => '$' + Math.abs(parseFloat(n)||0).toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function HistorialDias() {
  const [dias, setDias]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}?action=getHistorialDias`)
      .then(r => r.json())
      .then(d => { if (d.success) setDias(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Totales
  const verdes  = dias.filter(d => d.estado === 'Verde').length
  const rojos   = dias.filter(d => d.estado === 'Rojo').length
  const totalFavor   = dias.filter(d => d.diferencia > 0).reduce((s,d) => s + d.diferencia, 0)
  const totalContra  = dias.filter(d => d.diferencia < 0).reduce((s,d) => s + d.diferencia, 0)

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', letterSpacing: '-0.02em' }}>Historial de días</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{dias.length} días registrados</p>
      </div>

      {/* Resumen */}
      {dias.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>🟢 Días verdes</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '24px', color: '#16a34a' }}>{verdes}</div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>+{fmtM(totalFavor)}</div>
          </div>
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>🔴 Días rojos</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '24px', color: '#dc2626' }}>{rojos}</div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>{fmtM(totalContra)}</div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>
          Cargando historial...
        </div>
      ) : dias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '6px' }}>Sin días registrados</div>
          <div style={{ fontSize: '14px' }}>Los días se registran automáticamente a la hora de cierre configurada en MiDía</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dias.map((d, i) => {
            const verde = d.estado === 'Verde'
            const bg    = verde ? '#f0fdf4' : '#fef2f2'
            const color = verde ? '#16a34a' : '#dc2626'
            const borde = verde ? '#bbf7d0' : '#fecaca'
            const signo = d.diferencia >= 0 ? '+' : ''
            return (
              <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: `1.5px solid ${borde}` }}>
                {/* Fila 1: fecha + estado */}
                <div style={{ background: bg, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)' }}>
                    {(() => {
                      const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
                      const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
                      const s = d.fecha.toString().trim()
                      let fecha = null
                      if (s.includes('/')) {
                        const [dd, mm, yy] = s.split('/').map(Number)
                        fecha = new Date(yy, mm - 1, dd)
                      } else if (s.includes('-')) {
                        const [yy, mm, dd] = s.split('-').map(Number)
                        fecha = new Date(yy, mm - 1, dd)
                      } else {
                        fecha = new Date(s)
                      }
                      if (!fecha || isNaN(fecha)) return s
                      return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
                    })()}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color }}>
                    {verde ? '🟢 Verde' : '🔴 Rojo'}
                  </span>
                </div>
                {/* Fila 2: en juego vs necesitaba */}
                <div style={{ background: bg, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${borde}` }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>En juego</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color }}>{fmtM(d.enJuego)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Necesitaba</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color }}>{fmtM(d.necesitaba)}</div>
                  </div>
                </div>
                {/* Fila 3: diferencia */}
                <div style={{ background: bg, padding: '8px 16px', borderTop: `1px solid ${borde}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d.diferencia >= 0 ? 'A favor' : 'En contra'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '18px', color }}>
                    {signo}{fmtM(d.diferencia)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

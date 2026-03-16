import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, fmtMoney } from './shared.jsx'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [expandedOrden, setExpandedOrden] = useState(new Set())
  const [sortDash, setSortDash] = useState({})

  const getSortDash = (estado) => sortDash[estado] || { field: 'fecha', dir: 'asc' }
  const toggleSortDash = (e, estado, field) => {
    e.stopPropagation()
    setSortDash(prev => {
      const cur = prev[estado] || { field: 'fecha', dir: 'asc' }
      const dir = cur.field === field ? (cur.dir === 'asc' ? 'desc' : 'asc') : (field === 'total' ? 'desc' : 'asc')
      return { ...prev, [estado]: { field, dir } }
    })
  }

  useEffect(() => {
    setLoading(true); setError(false)
    fetch(`${API_BASE}?action=dashboard`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const now = getNowGuayaquil()
  const mesLabel = MESES_LARGO[now.getMonth()].charAt(0).toUpperCase() + MESES_LARGO[now.getMonth()].slice(1)
  const anio = now.getFullYear()

  const vendido    = data?.vendido    || 0
  const negociando = data?.negociando || 0
  const detenido   = data?.detenido   || 0
  const perdido    = data?.perdido    || 0
  const meta       = data?.meta       || 0
  const pct        = meta > 0 ? Math.round((vendido / meta) * 100) : 0
  const pistas     = data?.pistas     ?? 0
  const c          = data?.conteos || {}

  const verde = '#16a34a'
  const rojo  = '#dc2626'

  const toggle = (key) => setExpanded(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  const statCards = [
    { label: 'Vendido',    value: fmt(vendido),    color: verde, bg: '#f0fdf4', icon: 'check',    estado: 'Vendido' },
    { label: 'Negociando', value: fmt(negociando), color: verde, bg: '#f0fdf4', icon: 'trending', estado: 'Negociando' },
    { label: 'Detenido',   value: fmt(detenido),   color: rojo,  bg: '#fef2f2', icon: 'alert',    estado: 'Detenido' },
    { label: 'Perdido',    value: fmt(perdido),    color: rojo,  bg: '#fef2f2', icon: 'x',        estado: 'Perdido' },
  ]

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Título */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Panel {mesLabel} {anio}
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '500', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon d={icons.calendar} size={13} />{getTodayLabel()}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>Cargando datos...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
          No se pudo cargar el dashboard. Verifica que el Apps Script esté desplegado.
        </div>
      ) : (
        <>
          {/* Meta */}
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '10px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={icons.target} size={17} stroke="#6366f1" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta {mesLabel} {anio}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', color: '#6366f1' }}>{fmt(meta)}</div>
          </div>

          {/* Avance del mes */}
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '10px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avance del mes</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '18px', color: pct >= 100 ? verde : 'var(--ink)' }}>{pct}%</span>
            </div>
            <div style={{ background: 'var(--cream)', borderRadius: '100px', height: '10px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pct >= 100 ? verde : pct >= 60 ? '#2563eb' : 'var(--brand)', borderRadius: '100px', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--muted)' }}>
              <span style={{ fontWeight: '600', color: verde }}>{fmt(vendido)} vendido</span>
              <span>·</span>
              <span>{(c.Vendido?.clientes || 0)} {(c.Vendido?.clientes || 0) === 1 ? 'cliente' : 'clientes'}</span>
              <span>·</span>
              <span>{(c.Vendido?.ordenes || 0)} {(c.Vendido?.ordenes || 0) === 1 ? 'orden' : 'órdenes'}</span>
            </div>
          </div>

          {/* Tarjetas de estado expandibles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
            {statCards.map(({ label, value, color, bg, icon, estado }) => {
              const isOpen = expanded.has(estado)
              const ordenes = data?.ordenesMes?.[estado] || []
              const cnt = c[estado] || { clientes: 0, ordenes: 0 }
              return (
                <div key={label} style={{ background: 'var(--white)', border: `1.5px solid ${isOpen ? color : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  {/* Header */}
                  <div onClick={() => toggle(estado)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon d={icons[icon]} size={17} stroke={color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', color }}>{value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500' }}>{cnt.clientes} {cnt.clientes === 1 ? 'cliente' : 'clientes'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500' }}>{cnt.ordenes} {cnt.ordenes === 1 ? 'orden' : 'órdenes'}</div>
                      </div>
                      <div style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <Icon d="M6 9l6 6 6-9" size={16} />
                      </div>
                    </div>
                  </div>
                  {/* Lista expandida */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid var(--border)`, background: 'var(--paper)' }}>
                      {ordenes.length === 0 ? (
                        <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>Sin órdenes en {label.toLowerCase()} este mes</div>
                      ) : (() => {
                          const { field, dir } = getSortDash(estado)
                          const parseFecha = (s) => {
                            if (!s) return new Date(0)
                            if (s instanceof Date) return s
                            if (typeof s === 'string' && s.includes('/')) {
                              const p = s.split(' ')[0].split('/')
                              if (p.length === 3) return new Date(p[2], p[1]-1, p[0])
                            }
                            if (typeof s === 'string' && s.includes('T')) return new Date(s)
                            return new Date(0)
                          }
                          const sorted = [...ordenes].sort((a, b) => {
                            if (field === 'fecha') {
                              const fa = parseFecha(a.fecha), fb = parseFecha(b.fecha)
                              return dir === 'asc' ? fa - fb : fb - fa
                            }
                            return dir === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
                          })
                          return (
                            <>
                              {/* Botones sort */}
                              <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 6px', borderBottom: '1px solid var(--cream)' }}>
                                {[['fecha','Fecha'],['total','$']].map(([f, lbl]) => {
                                  const active = field === f
                                  const arrow = dir === 'asc' ? '↑' : '↓'
                                  return (
                                    <button key={f} onClick={(e) => toggleSortDash(e, estado, f)}
                                      style={{ padding: '3px 10px', borderRadius: '20px', border: `1.5px solid ${active ? color : 'var(--border)'}`, background: active ? bg : 'var(--white)', color: active ? color : 'var(--muted)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                                      {lbl} {active ? arrow : '↕'}
                                    </button>
                                  )
                                })}
                              </div>
                              {sorted.map((o, i) => {

                          // Días en estado actual (Negociando/Detenido/Perdido)
                          let diasEnEstado = null
                          if (estado !== 'Vendido' && o.fechaCambioEstado) {
                            const fcs = parseFecha(o.fechaCambioEstado)
                            if (fcs) {
                              const hoy = getNowGuayaquil(); hoy.setHours(0,0,0,0)
                              fcs.setHours(0,0,0,0)
                              diasEnEstado = Math.max(0, Math.floor((hoy - fcs) / (1000*60*60*24)))
                            }
                          }

                          // Días para cerrar venta (Vendido)
                          let diasParaVender = null
                          if (estado === 'Vendido') {
                            const fCreacion = parseFecha(o.fecha)
                            const fVendido  = parseFecha(o.fechaCambioEstado)
                            if (fCreacion && fVendido) {
                              fCreacion.setHours(0,0,0,0); fVendido.setHours(0,0,0,0)
                              diasParaVender = Math.max(0, Math.floor((fVendido - fCreacion) / (1000*60*60*24)))
                            }
                          }

                          const ordenKey = `${estado}-${o.numOrden}`
                          const detalleOpen = expandedOrden.has(ordenKey)
                          return (
                            <div key={i} style={{ borderBottom: i < ordenes.length-1 ? `1px solid var(--border)` : 'none', background: 'var(--white)' }}>
                              <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.cliente}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>{o.negocio}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                    {o.numOrden && (
                                      <span onClick={(e) => { e.stopPropagation(); setExpandedOrden(prev => { const s = new Set(prev); s.has(ordenKey) ? s.delete(ordenKey) : s.add(ordenKey); return s }) }}
                                        style={{ color: 'var(--brand)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                        {o.numOrden} {detalleOpen ? '▲' : '▼'}
                                      </span>
                                    )}
                                  </div>
                                  {diasParaVender !== null && (
                                    <div style={{ fontSize: '11px', color: verde, fontWeight: '600', marginTop: '2px' }}>
                                      Lo vendí en {diasParaVender === 0 ? 'el mismo día' : `${diasParaVender} ${diasParaVender === 1 ? 'día' : 'días'}`}
                                    </div>
                                  )}
                                  {diasEnEstado !== null && (
                                    <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '2px', color: diasEnEstado >= 7 ? '#dc2626' : '#d97706' }}>
                                      {diasEnEstado === 0 ? `Hoy en ${estado.toLowerCase()}` : `${diasEnEstado} ${diasEnEstado === 1 ? 'día' : 'días'} ${estado.toLowerCase()}.`}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '14px', color }}>{fmtMoney(o.total)}</div>
                                  {o.telefono && (
                                    <a href={`https://wa.me/593${o.telefono.toString().replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#25d366', fontWeight: '700', textDecoration: 'none' }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                      {o.telefono}
                                    </a>
                                  )}
                                  {o.email && (
                                    <a href={`mailto:${o.email}`}
                                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--brand)', fontWeight: '600', textDecoration: 'none' }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                      {o.email}
                                    </a>
                                  )}
                                </div>
                              </div>
                              {/* Detalle inline de la orden */}
                              {detalleOpen && (
                                <div style={{ background: 'var(--cream)', borderTop: '1px solid var(--border)', padding: '10px 20px' }}>
                                  {(!o.items || o.items.length === 0) ? (
                                    <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '8px' }}>Sin detalle disponible</div>
                                  ) : (
                                    <>
                                      {o.items.map((item, ii) => (
                                        <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: ii < o.items.length-1 ? '1px solid var(--border)' : 'none' }}>
                                          <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>{item.nombre}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                              {item.cantidad} × {fmtMoney(item.precioUnitario)}
                                              {item.descuento > 0 && ` · ${item.descuento > 1 ? item.descuento : item.descuento * 100}% desc`}
                                              {` · IVA ${item.iva > 1 ? item.iva : item.iva * 100}%`}
                                            </div>
                                          </div>
                                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand)', fontFamily: 'var(--font-display)', flexShrink: 0, marginLeft: '10px' }}>{fmtMoney(item.total)}</div>
                                        </div>
                                      ))}
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color, fontFamily: 'var(--font-display)' }}>Total: {fmtMoney(o.total)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                            </>
                          )
                        })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Días sin prospectar */}
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '10px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={icons.clock} size={17} stroke={rojo} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: rojo, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Días sin prospectar</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', color: rojo }}>{data?.diasSinProspectar ?? 0}</div>
          </div>

          {/* Pistas — expandible */}
          {(() => {
            const isOpen = expanded.has('Pistas')
            const pistasList = data?.pistasList || []
            return (
              <div style={{ background: 'var(--white)', border: `1.5px solid ${isOpen ? '#0ea5e9' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div onClick={() => toggle('Pistas')} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon d={icons.eye} size={17} stroke="#0ea5e9" />
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pistas</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', color: '#0ea5e9' }}>{pistas} {pistas === 1 ? 'cliente' : 'clientes'}</div>
                    <div style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <Icon d="M6 9l6 6 6-9" size={16} />
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid #e0f2fe' }}>
                    {pistasList.length === 0 ? (
                      <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>Todos los clientes tienen órdenes este mes 🎉</div>
                    ) : (
                      pistasList.map((p, i) => {
                        let diasEnPista = null
                        if (p.fechaRegistro) {
                          const parseFR = (s) => {
                            if (!s) return null
                            if (s instanceof Date) return s
                            if (s.includes('T')) return new Date(s)
                            if (s.includes('/')) { const pts = s.split(' ')[0].split('/'); if (pts.length === 3) return new Date(pts[2], pts[1]-1, pts[0]) }
                            return null
                          }
                          const fr = parseFR(p.fechaRegistro)
                          if (fr) { const hoy = getNowGuayaquil(); hoy.setHours(0,0,0,0); fr.setHours(0,0,0,0); diasEnPista = Math.max(0, Math.floor((hoy - fr) / (1000*60*60*24))) }
                        }
                        return (
                        <div key={i} style={{ padding: '10px 20px', borderBottom: i < pistasList.length-1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>{p.nombre}</div>
                            {p.negocio && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.negocio}</div>}
                            {diasEnPista !== null && (
                              <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '2px', color: diasEnPista >= 14 ? '#dc2626' : '#d97706' }}>
                                {diasEnPista === 0 ? 'Registrado hoy' : `${diasEnPista} ${diasEnPista === 1 ? 'día' : 'días'} en pista.`}
                              </div>
                            )}
                          </div>
                          {(p.telefono || p.email) && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                              {p.telefono && (
                                <a
                                  href={`https://wa.me/593${p.telefono.toString().replace(/\D/g,'').replace(/^0/,'')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#25d366', fontWeight: '700', textDecoration: 'none' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  {p.telefono}
                                </a>
                              )}
                              {p.email && (
                                <a
                                  href={`mailto:${p.email}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--brand)', fontWeight: '600', textDecoration: 'none' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                  </svg>
                                  {p.email}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ─── ClientRow ────────────────────────────────────────────────────────────────

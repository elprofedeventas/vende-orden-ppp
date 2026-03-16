import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, fmtMoney, ESTADO_COLORS } from './shared.jsx'
import { OrderRow } from './Orders.jsx'

export function OrdersView({ onViewOrder, filtroInicial, onFiltroChange }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstadoLocal] = useState(filtroInicial || 'Negociando')

  const setFiltroEstado = (v) => { setFiltroEstadoLocal(v); onFiltroChange(v) }
  const [meta, setMeta] = useState(0)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [modoHistorial, setModoHistorial] = useState(false)
  const [searchOrden, setSearchOrden] = useState('')
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  // Mes actual en Guayaquil
  const now = getNowGuayaquil()
  const mesNombre = MESES_LARGO[now.getMonth()]
  const anioActual = now.getFullYear()
  const mesActualLabel = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)

  useEffect(() => {
    fetch(`${API_BASE}?action=getOrdenes`).then(r => r.json()).then(d => { if (d.success) setOrders(d.data) }).catch(() => {}).finally(() => setLoading(false))
    fetch(`${API_BASE}?action=dashboard`).then(r => r.json()).then(d => { if (d.success) setMeta(d.data.meta || 0) }).catch(() => {})
  }, [])

  // Parsear fecha de orden a Date
  const parseFechaOrden = (raw) => {
    if (!raw) return null
    if (raw instanceof Date) return raw
    if (typeof raw === 'string' && raw.includes('/')) {
      const parts = raw.split(' ')[0].split('/')
      if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0])
    }
    if (typeof raw === 'string' && raw.includes('T')) return new Date(raw)
    return null
  }

  // Filtrar por mes actual o rango historial
  const ordenesMes = useMemo(() => {
    return orders.filter(o => {
      const f = parseFechaOrden(o.fecha)
      if (!f) return false
      if (modoHistorial && fechaInicio && fechaFin) {
        const [iy, im, id] = fechaInicio.split('-').map(Number)
        const [fy, fm, fd] = fechaFin.split('-').map(Number)
        const ini = new Date(iy, im-1, id, 0, 0, 0, 0)
        const fin = new Date(fy, fm-1, fd, 23, 59, 59, 999)
        return f >= ini && f <= fin
      }
      return f.getMonth() === now.getMonth() && f.getFullYear() === anioActual
    })
  }, [orders, modoHistorial, fechaInicio, fechaFin])

  const filtradas = useMemo(() => {
    let list = filtroEstado === 'Todos' ? ordenesMes : ordenesMes.filter(o => o.estado === filtroEstado)
    if (searchOrden.trim()) {
      const q = norm(searchOrden)
      list = list.filter(o => norm(o.clienteNombre).includes(q) || norm(o.clienteNegocio).includes(q) || norm(o.numOrden).includes(q))
    }
    list = [...list].sort((a, b) => {
      if (sortField === 'total') {
        const diff = (parseFloat(a.total)||0) - (parseFloat(b.total)||0)
        return sortDir === 'desc' ? -diff : diff
      } else {
        const fa = parseFechaOrden(a.fecha), fb = parseFechaOrden(b.fecha)
        const diff = (fa||0) - (fb||0)
        return sortDir === 'desc' ? -diff : diff
      }
    })
    return list
  }, [ordenesMes, filtroEstado, searchOrden, sortField, sortDir])

  // Totales del filtro activo
  const totalMonto = filtradas.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
  const totalCantidad = filtradas.length
  const totalClientes = new Set(filtradas.map(o => o.clienteNombre)).size

  const aplicarHistorial = () => {
    if (fechaInicio && fechaFin) { setModoHistorial(true); setHistorialOpen(false) }
  }
  const limpiarHistorial = () => { setModoHistorial(false); setFechaInicio(''); setFechaFin(''); setHistorialOpen(false) }

  const periodoLabel = modoHistorial && fechaInicio && fechaFin
    ? `${formatFecha(fechaInicio)} — ${formatFecha(fechaFin)}`
    : `${mesActualLabel} ${anioActual}`

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Título */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', letterSpacing: '-0.02em' }}>
          Órdenes de {mesActualLabel}
        </h1>
        {modoHistorial && (
          <div style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon d={icons.calendar} size={13} /> Historial: {periodoLabel}
            <button onClick={limpiarHistorial} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 2px', fontSize: '12px', fontWeight: '700' }}>✕ Volver al mes</button>
          </div>
        )}
      </div>

      {/* Meta card */}
      {meta > 0 && (
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '16px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={icons.target} size={15} stroke="#6366f1" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta {mesActualLabel}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '18px', color: '#6366f1' }}>{fmtMoney(meta)}</span>
        </div>
      )}

      {/* Botones de estado + Historial */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['Vendido','Negociando','Detenido','Perdido','Todos'].map(e => {
            const activo = filtroEstado === e
            const c = e === 'Todos' ? { bg: 'var(--brand)', color: 'white', border: 'var(--brand)' } : ESTADO_COLORS[e]
            return <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: '700',
              border: `1.5px solid ${activo ? c.border : 'var(--border)'}`,
              background: activo ? c.bg : 'var(--white)',
              color: activo ? c.color : 'var(--muted)',
            }}>{e}</button>
          })}
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setHistorialOpen(!historialOpen)} style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${modoHistorial ? 'var(--brand)' : 'var(--border)'}`, background: modoHistorial ? 'var(--brand-light)' : 'var(--white)', color: modoHistorial ? 'var(--brand)' : 'var(--muted)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <Icon d={icons.calendar} size={13} /> Historial
          </button>
          {historialOpen && (
            <div style={{ position: 'absolute', right: 0, top: '36px', zIndex: 100, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-lg)', minWidth: '240px', animation: 'fadeUp 0.15s ease' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Rango de fechas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Desde</label>
                  <DatePicker value={fechaInicio} onChange={setFechaInicio} placeholder="Desde..." />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Hasta</label>
                  <DatePicker value={fechaFin} onChange={setFechaFin} placeholder="Hasta..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={limpiarHistorial} style={{ flex: 1, padding: '8px', background: 'var(--cream)', color: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Limpiar</button>
                <button onClick={aplicarHistorial} disabled={!fechaInicio || !fechaFin} style={{ flex: 2, padding: '8px', background: !fechaInicio || !fechaFin ? 'var(--muted)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: '700', cursor: !fechaInicio || !fechaFin ? 'not-allowed' : 'pointer' }}>Aplicar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total del filtro activo */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '12px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>
          {filtroEstado === 'Todos' ? 'Todas las órdenes' : filtroEstado} · {totalClientes} {totalClientes === 1 ? 'cliente' : 'clientes'} · {totalCantidad} {totalCantidad === 1 ? 'orden' : 'órdenes'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', color: filtroEstado !== 'Todos' && ESTADO_COLORS[filtroEstado] ? ESTADO_COLORS[filtroEstado].color : 'var(--brand)' }}>
          {fmtMoney(totalMonto)}
        </div>
      </div>

      {/* Búsqueda + ordenamiento */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><Icon d={icons.search} size={15} /></span>
          <input type="text" placeholder="Buscar por cliente, negocio o # orden..." value={searchOrden} onChange={e => setSearchOrden(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '38px', paddingRight: searchOrden ? '36px' : '12px', fontSize: '13px' }} />
          {searchOrden && <button onClick={() => setSearchOrden('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '2px' }}><Icon d={icons.x} size={14} /></button>}
        </div>
        {[{ field: 'total', labelAsc: '$ ↑', labelDesc: '$ ↓' }, { field: 'fecha', labelAsc: 'Fecha ↑', labelDesc: 'Fecha ↓' }].map(({ field, labelAsc, labelDesc }) => {
          const activo = sortField === field
          return (
            <button key={field} onClick={() => toggleSort(field)} style={{ padding: '7px 12px', borderRadius: '20px', border: `1.5px solid ${activo ? 'var(--brand)' : 'var(--border)'}`, background: activo ? 'var(--brand-light)' : 'var(--white)', color: activo ? 'var(--brand)' : 'var(--muted)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {activo ? (sortDir === 'desc' ? labelDesc : labelAsc) : labelDesc}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}><div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>Cargando órdenes...</div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '6px' }}>Sin órdenes{filtroEstado !== 'Todos' ? ` en "${filtroEstado}"` : ''}</div>
          <div style={{ fontSize: '14px' }}>Crea una nueva orden desde el menú</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtradas.map((o, i) => <OrderRow key={o.numOrden} order={o} index={i} onView={onViewOrder} />)}
        </div>
      )}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// PRÓXIMA SEMANA
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// CARD ORDEN GLOBAL
// ─────────────────────────────────────────────────────────────────────────────
export function CardOrdenGlobal({ order, mostrarDia, onClick, fmtM: fmtMProp }) {
  const fmtM2 = fmtMProp || ((n) => `$${(parseFloat(n)||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`)
  const parseFechaLocal = (s) => {
    if (!s) return null
    const p = s.toString().trim().split(' ')[0].split('/')
    if (p.length===3) { const f=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])); f.setHours(0,0,0,0); return f }
    return null
  }
  const f = parseFechaLocal(order.siguienteAccionFecha)
  const DIAS_ES2 = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const MESES_ES3 = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaLabel = f ? `${DIAS_ES2[f.getDay()]} ${f.getDate()} de ${MESES_ES3[f.getMonth()]} ${f.getFullYear()}` : ''
  const hora = order.siguienteAccionFecha?.toString().includes(' ') ? order.siguienteAccionFecha.toString().split(' ')[1] : ''
  const accion = (order.accion || '').trim()
  const hoyD = getNowGuayaquil(); hoyD.setHours(0,0,0,0)
  const fD = f ? new Date(f) : null; if (fD) fD.setHours(0,0,0,0)
  const diffDias = fD ? Math.round((fD - hoyD) / 86400000) : 0
  const esVencida = diffDias < 0
  const sec1Bg = esVencida ? '#fef2f2' : '#f0fdf4'
  const sec1Color = esVencida ? '#dc2626' : '#16a34a'
  const sec1Label = esVencida
    ? `${Math.abs(diffDias)} ${Math.abs(diffDias)===1?'día':'días'} vencida`
    : diffDias===0?'Hoy':diffDias===1?'Mañana':`En ${diffDias} días`
  const na = norm(accion)
  const contactos = []
  if (na===norm('Visitar')) {
    if (order.clienteTelefono)  contactos.push({ type:'tel',   value:order.clienteTelefono })
    if (order.clienteEmail)     contactos.push({ type:'email', value:order.clienteEmail })
    if (order.clienteDireccion) contactos.push({ type:'dir',   value:order.clienteDireccion })
  } else {
    if (order.clienteTelefono) contactos.push({ type:'tel',   value:order.clienteTelefono })
    if (order.clienteEmail)    contactos.push({ type:'email', value:order.clienteEmail })
  }
  return (
    <div onClick={onClick}
      style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', boxShadow:'var(--shadow)', border:'1.5px solid var(--border)', transition:'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-lg)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>
      <div style={{ background:sec1Bg, padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'12px', fontWeight:'800', color:sec1Color }}>{sec1Label}</span>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:sec1Color, background:'var(--white)', padding:'1px 8px', borderRadius:'20px', display:'block', marginBottom:'3px', opacity:0.9 }}>{order.estado}</span>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'15px', color:sec1Color }}>{fmtM2(order.total)}</div>
          <div style={{ fontSize:'10px', color:sec1Color, opacity:0.7 }}>{order.numOrden}</div>
        </div>
      </div>
      <div style={{ background:esVencida?'#fef2f2':'#f0fdf4', padding:'10px 14px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>{order.clienteNombre}</div>
        {order.clienteNegocio && <div style={{ fontSize:'13px', color:'var(--muted)', marginTop:'1px' }}>{order.clienteNegocio}</div>}
        {contactos.length > 0 && (
          <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
            {contactos.map((ct,ci) => {
              if (ct.type==='tel') return (
                <a key={ci} href={`https://wa.me/593${ct.value.toString().replace(/\D/g,'').replace(/^0/,'')}`}
                  target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600', color:'#16a34a', textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  <Icon d={icons.phone} size={12} />{ct.value}
                </a>
              )
              if (ct.type==='email') return (
                <a key={ci} href={`mailto:${ct.value}`} onClick={e => e.stopPropagation()}
                  style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600', color:'var(--brand)', textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  <Icon d={icons.mail} size={12} />{ct.value}
                </a>
              )
              if (ct.type==='dir') return (
                <a key={ci} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ct.value)}`}
                  target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600', color:'var(--muted)', textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  <Icon d={icons.map} size={12} />{ct.value}
                </a>
              )
              return null
            })}
          </div>
        )}
      </div>
      <div style={{ background:'#0f172a', padding:'10px 14px', borderTop:'1px solid #1e293b' }}>
        {accion && <div style={{ fontSize:'12px', color:'#f8fafc', fontWeight:'700', marginBottom:'3px' }}>Actividad: {accion}</div>}
        {fechaLabel && (
          <div style={{ fontSize:'12px', fontWeight:'600', color:'#94a3b8', display:'flex', alignItems:'center', gap:'5px' }}>
            <Icon d={icons.calendar} size={12} fill="#94a3b8" />
            {fechaLabel}{hora ? ` · ${hora}` : ''}
          </div>
        )}
        {order.notasSeguimiento && (
          <div style={{ fontSize:'12px', color:'#cbd5e1', marginTop:'5px', fontStyle:'italic', lineHeight:'1.4', borderTop:'1px solid #1e293b', paddingTop:'5px' }}>
            "{order.notasSeguimiento}"
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ESTA SEMANA
// ═════════════════════════════════════════════════════════════════════════════

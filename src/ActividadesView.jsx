import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, fmtMoney, ESTADO_COLORS } from './shared.jsx'

export default function ActividadesView({ onViewOrder, onViewPista, modoInicial }) {
  const [orders, setOrders] = useState([])
  const [pistasData, setPistasData] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('asc')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [accionesDisp, setAccionesDisp] = useState([])
  const [accionDropOpen, setAccionDropOpen] = useState(false)
  // 'pendientes' | 'vencidas' | 'sinFecha' | 'historial'
  const [modo, setModo] = useState(modoInicial || 'pendientes')
  const [historialOpen, setHistorialOpen] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [modoHistorial, setModoHistorial] = useState(false)
  const [dashData, setDashData] = useState(null)
  const [tipoDato, setTipoDato] = useState('ordenes') // 'ordenes' | 'pistas'

  useEffect(() => {
    fetch(`${API_BASE}?action=getOrdenes`)
      .then(r => r.json()).then(d => { if (d.success) setOrders(d.data) }).catch(() => {}).finally(() => setLoading(false))
    fetch(`${API_BASE}?action=getAcciones`)
      .then(r => r.json()).then(d => { if (d.success) setAccionesDisp(d.data) }).catch(() => {})
    fetch(`${API_BASE}?action=dashboard`)
      .then(r => r.json()).then(d => { if (d.success) setDashData(d.data) }).catch(() => {})
    fetch(`${API_BASE}?action=getPistasActividades`)
      .then(r => r.json()).then(d => { if (d.success) setPistasData(d.data) }).catch(() => {})
  }, [])

  const parseFechaSeg = (v) => {
    if (!v) return null
    const str = v.toString().trim()
    if (str.includes('/')) {
      const [dp, tp] = str.split(' ')
      const [d, m, y] = dp.split('/')
      if (tp) { const [hh, mm] = tp.split(':'); return new Date(y, m-1, d, hh, mm) }
      return new Date(y, m-1, d)
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str)
    return null
  }

  const hoy = getNowGuayaquil(); hoy.setHours(0,0,0,0)
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1); ayer.setHours(23,59,59,999)
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)
  const ESTADOS   = ['Negociando', 'Detenido', 'Perdido']

  // Switch data source based on tipoDato
  const pistasComoOrdenes = useMemo(() => pistasData.map(p => ({
    ...p,
    clienteNombre: p.nombre,
    clienteNegocio: p.negocio,
    clienteTelefono: p.telefono,
    clienteEmail: p.email,
    clienteDireccion: p.direccion,
    estado: 'Pista',
    total: 0,
    numOrden: '',
  })), [pistasData])
  const activeOrders = useMemo(() => tipoDato === 'pistas' ? pistasComoOrdenes : orders, [tipoDato, pistasComoOrdenes, orders])
  const mesNombre = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][hoy.getMonth()]

  const conFecha = useMemo(() => {
    const src = tipoDato === 'pistas'
      ? pistasComoOrdenes.filter(o => o.siguienteAccionFecha)
      : activeOrders.filter(o => ESTADOS.includes(o.estado) && o.siguienteAccionFecha)
    return src.map(o => ({ ...o, _fecha: parseFechaSeg(o.siguienteAccionFecha) })).filter(o => o._fecha !== null)
  }, [orders, pistasComoOrdenes, tipoDato])

  const sinFechaList = useMemo(() => {
    return tipoDato === 'pistas'
      ? pistasComoOrdenes.filter(o => !o.siguienteAccionFecha)
      : activeOrders.filter(o => ESTADOS.includes(o.estado) && !o.siguienteAccionFecha)
  }, [orders, pistasComoOrdenes, tipoDato])

  // Conteos para badges
  const cntPendientes = useMemo(() => tipoDato === 'pistas'
    ? conFecha.filter(o => o._fecha >= hoy).length
    : conFecha.filter(o => o._fecha >= hoy && o._fecha <= finMes).length, [conFecha, tipoDato])
  const cntVencidas = useMemo(() => tipoDato === 'pistas'
    ? conFecha.filter(o => o._fecha < hoy).length
    : conFecha.filter(o => o._fecha >= inicioMes && o._fecha <= ayer).length, [conFecha, tipoDato])
  const cntSinFecha   = sinFechaList.length

  const getDiffLabel = (fecha) => {
    const d = new Date(fecha); d.setHours(0,0,0,0)
    const diff = Math.round((d - hoy) / 86400000)
    if (diff < 0)  return { label:`Hace ${Math.abs(diff)} día${Math.abs(diff)!==1?'s':''}`, color:'#dc2626', bg:'#fef2f2' }
    if (diff === 0) return { label:'Hoy',    color:'#d97706', bg:'#fffbeb' }
    if (diff === 1) return { label:'Mañana', color:'#2563eb', bg:'#eff6ff' }
    return { label:`En ${diff} días`, color:'var(--muted)', bg:'var(--cream)' }
  }

  const actividades = useMemo(() => {
    let list = []
    if (modo === 'sinFecha') {
      list = sinFechaList
    } else if (modo === 'pendientes') {
      // Pistas: todas las futuras. Órdenes: solo las del mes en curso
      list = tipoDato === 'pistas'
        ? conFecha.filter(o => o._fecha >= hoy)
        : conFecha.filter(o => o._fecha >= hoy && o._fecha <= finMes)
    } else if (modo === 'vencidas') {
      // Pistas: todas las vencidas. Órdenes: solo las del mes en curso
      list = tipoDato === 'pistas'
        ? conFecha.filter(o => o._fecha < hoy)
        : conFecha.filter(o => o._fecha >= inicioMes && o._fecha <= ayer)
    } else if (modo === 'historial' && modoHistorial && fechaInicio && fechaFin) {
      const [iy,im,id] = fechaInicio.split('-').map(Number)
      const [fy,fm,fd] = fechaFin.split('-').map(Number)
      const desde = new Date(iy, im-1, id, 0, 0, 0)
      const hasta = new Date(fy, fm-1, fd, 23, 59, 59)
      list = conFecha.filter(o => o._fecha >= desde && o._fecha <= hasta)
    }

    if (filtroAccion) list = list.filter(o => norm(o.accion) === norm(filtroAccion))

    if (busqueda.trim()) {
      const q = norm(busqueda)
      list = list.filter(o => norm(o.clienteNombre||o.nombre||'').includes(q) || norm(o.clienteNegocio||o.negocio||'').includes(q) || norm(o.numOrden||'').includes(q) || norm(o.accion||'').includes(q))
    }

    list = [...list].sort((a, b) => {
      if (sortField === 'fecha') {
        const fa = a._fecha || new Date(0), fb = b._fecha || new Date(0)
        return sortDir === 'asc' ? fa - fb : fb - fa
      }
      return sortDir === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
    })
    return list
  }, [conFecha, sinFechaList, modo, modoHistorial, fechaInicio, fechaFin, filtroAccion, busqueda, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }

  const aplicarHistorial = () => {
    if (fechaInicio && fechaFin) { setModoHistorial(true); setModo('historial'); setHistorialOpen(false) }
  }
  const limpiarHistorial = () => { setModoHistorial(false); setFechaInicio(''); setFechaFin(''); setHistorialOpen(false); setModo('pendientes') }

  const SortBtn = ({ field, label }) => {
    const active = sortField === field
    const arrow = sortDir === 'asc' ? '↑' : '↓'
    return (
      <button onClick={() => toggleSort(field)}
        style={{ padding:'5px 11px', borderRadius:'20px', border:`1.5px solid ${active?'var(--brand)':'var(--border)'}`, background:active?'var(--brand-light)':'var(--white)', color:active?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
        {label} {active ? arrow : '↕'}
      </button>
    )
  }

  const ModoBtn = ({ key_, label, count, color }) => {
    const active = modo === key_
    return (
      <button onClick={() => { setModo(key_); if (key_ !== 'historial') setModoHistorial(false) }}
        style={{ padding:'5px 12px', borderRadius:'20px', border:`1.5px solid ${active?(color||'var(--brand)'):'var(--border)'}`, background:active?(color?color+'18':'var(--brand-light)'):'var(--white)', color:active?(color||'var(--brand)'):'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
        {count !== undefined ? `${count} ${label}` : label}
      </button>
    )
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--muted)' }}>
      <div style={{ fontSize:'28px', marginBottom:'12px', animation:'pulse 1s infinite' }}>⏳</div>Cargando actividades...
    </div>
  )

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }} onClick={() => { if (accionDropOpen) setAccionDropOpen(false); if (historialOpen) setHistorialOpen(false) }}>

      {/* Encabezado */}
      <div style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'28px', letterSpacing:'-0.02em', margin:0 }}>Seguimiento</h1>
            <div style={{ fontSize:'13px', color:'var(--muted)', fontWeight:'500', marginTop:'4px', display:'flex', alignItems:'center', gap:'6px' }}>
              <Icon d={icons.calendar} size={13} />{getTodayLabel()}
            </div>
            {/* Botones Órdenes / Pistas */}
            <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
              {[['ordenes','Órdenes'],['pistas','Pistas']].map(([tipo, lbl]) => (
                <button key={tipo} onClick={() => { setTipoDato(tipo); setModo('pendientes'); setModoHistorial(false); setBusqueda(''); setFiltroAccion('') }}
                  style={{ padding:'5px 14px', borderRadius:'20px', border:`1.5px solid ${tipoDato===tipo?'var(--brand)':'var(--border)'}`, background:tipoDato===tipo?'var(--brand)':'var(--white)', color:tipoDato===tipo?'white':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          {/* Dropdown filtro acción */}
          <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setAccionDropOpen(v => !v); setHistorialOpen(false) }}
              style={{ padding:'7px 13px', borderRadius:'var(--radius)', border:`1.5px solid ${filtroAccion?'var(--brand)':'var(--border)'}`, background:filtroAccion?'var(--brand-light)':'var(--white)', color:filtroAccion?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}>
              {filtroAccion || 'Acciones'} <Icon d={icons.chevron} size={12} />
            </button>
            {accionDropOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:200, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', minWidth:'190px', overflow:'hidden', animation:'fadeUp 0.15s ease' }}>
                {filtroAccion && (
                  <button onClick={() => { setFiltroAccion(''); setAccionDropOpen(false) }}
                    style={{ width:'100%', padding:'10px 14px', background:'var(--cream)', border:'none', borderBottom:'1px solid var(--border)', color:'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', textAlign:'left' }}>
                    ✕ Limpiar filtro
                  </button>
                )}
                {accionesDisp.map(a => (
                  <button key={a} onClick={() => { setFiltroAccion(a); setAccionDropOpen(false) }}
                    style={{ width:'100%', padding:'10px 14px', background:filtroAccion===a?'var(--brand-light)':'transparent', border:'none', borderBottom:'1px solid var(--cream)', color:filtroAccion===a?'var(--brand)':'var(--ink)', fontSize:'13px', fontWeight:filtroAccion===a?'700':'500', cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}
                    onMouseEnter={e => { if (filtroAccion!==a) e.currentTarget.style.background='var(--cream)' }}
                    onMouseLeave={e => { if (filtroAccion!==a) e.currentTarget.style.background='transparent' }}>
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Botones de modo */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center' }}>
        <ModoBtn key_="pendientes" label="actividades" count={cntPendientes} />
        <ModoBtn key_="vencidas" label={tipoDato === 'pistas' ? 'vencidas' : `vencidas en ${mesNombre}`} count={cntVencidas} color="#dc2626" />
        <ModoBtn key_="sinFecha" label="sin fecha" count={cntSinFecha} color="#d97706" />
        {/* Historial */}
        <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setHistorialOpen(v => !v); setAccionDropOpen(false) }}
            style={{ padding:'5px 12px', borderRadius:'20px', border:`1.5px solid ${modo==='historial'?'var(--brand)':'var(--border)'}`, background:modo==='historial'?'var(--brand-light)':'var(--white)', color:modo==='historial'?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s', whiteSpace:'nowrap' }}>
            <Icon d={icons.clock} size={12} /> {modo==='historial' && modoHistorial ? `${formatFecha(fechaInicio,'').slice(0,6)}–${formatFecha(fechaFin,'').slice(0,6)}` : 'Historial'}
          </button>
          {historialOpen && (
            <div style={{ position:'absolute', left:0, top:'calc(100% + 6px)', zIndex:200, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px', boxShadow:'var(--shadow-lg)', minWidth:'240px', animation:'fadeUp 0.15s ease' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>Rango de fechas</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'10px' }}>
                <div>
                  <label style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Desde</label>
                  <DatePicker value={fechaInicio} onChange={setFechaInicio} placeholder="Desde..." />
                </div>
                <div>
                  <label style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Hasta</label>
                  <DatePicker value={fechaFin} onChange={setFechaFin} placeholder="Hasta..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={limpiarHistorial} style={{ flex:1, padding:'8px', background:'var(--cream)', color:'var(--muted)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>Limpiar</button>
                <button onClick={aplicarHistorial} disabled={!fechaInicio||!fechaFin} style={{ flex:2, padding:'8px', background:!fechaInicio||!fechaFin?'var(--muted)':'var(--brand)', color:'white', border:'none', borderRadius:'var(--radius)', fontSize:'12px', fontWeight:'700', cursor:!fechaInicio||!fechaFin?'not-allowed':'pointer' }}>Aplicar</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {filtroAccion && (
        <div style={{ fontSize:'12px', color:'var(--brand)', fontWeight:'600', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
          Filtro: {filtroAccion}
          <button onClick={() => setFiltroAccion('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:'0 2px', fontSize:'11px', fontWeight:'700' }}>✕</button>
        </div>
      )}


      {/* Tarjeta de totales */}
      {actividades.length > 0 && (() => {
        const totalMonto = actividades.reduce((s, o) => s + (parseFloat(o.total)||0), 0)
        const modoLabel  = modo === 'pendientes' ? 'Pendientes este mes'
          : modo === 'vencidas' ? `Vencidas en ${mesNombre}`
          : modo === 'sinFecha' ? 'Sin fecha de seguimiento'
          : modoHistorial && fechaInicio && fechaFin ? `${formatFecha(fechaInicio)} — ${formatFecha(fechaFin)}`
          : 'Historial'
        const cardTheme = modo === 'vencidas'
          ? { bg:'#fef2f2', border:'#fecaca',  color:'#dc2626' }
          : modo === 'sinFecha'
          ? { bg:'#fffbeb', border:'#fde68a',  color:'#d97706' }
          : modo === 'historial'
          ? { bg:'var(--brand-light)', border:'var(--brand)', color:'var(--brand)' }
          : { bg:'#f0fdf4', border:'#bbf7d0',  color:'#16a34a' }
        return (
          <div style={{ background:cardTheme.bg, border:`1.5px solid ${cardTheme.border}`, borderRadius:'var(--radius-lg)', padding:'14px 18px', marginBottom:'14px', boxShadow:'var(--shadow)', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:'10px', fontWeight:'700', color:cardTheme.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>{modoLabel}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'20px', color:'var(--ink)' }}>{actividades.length} <span style={{ fontSize:'13px', fontWeight:'600', color:cardTheme.color }}>{actividades.length === 1 ? 'actividad' : 'actividades'}</span></div>
              </div>
              <div style={{ borderLeft:`1.5px solid ${cardTheme.border}`, paddingLeft:'20px' }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:cardTheme.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Total en órdenes</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'20px', color:'var(--ink)' }}>{fmtMoney(totalMonto)}</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Controles de orden */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        <SortBtn field="fecha" label="Fecha" />
        <SortBtn field="total" label="$" />
      </div>

      {/* Lista */}
      {actividades.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', color:'var(--muted)' }}>
          <div style={{ fontSize:'36px', marginBottom:'12px' }}>
            {modo==='sinFecha' ? '📋' : modo==='historial' ? '📚' : modo==='vencidas' ? '✅' : '📭'}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:'700', marginBottom:'6px' }}>
            {modo==='sinFecha' ? 'Sin órdenes sin fecha' : modo==='historial' ? 'Sin actividades en ese rango' : modo==='vencidas' ? `Sin actividades vencidas en ${mesNombre}` : 'Sin actividades pendientes este mes'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {actividades.map((order, i) => {
            const diff = order._fecha ? getDiffLabel(order._fecha) : null
            const c = ESTADO_COLORS[order.estado]
            const accion = (order.accion || '').trim()
            const na = norm(accion)

            const contactos = []
            if (na === norm('Visitar')) {
              if (order.clienteTelefono)  contactos.push({ type:'tel',   value:order.clienteTelefono })
              if (order.clienteEmail)     contactos.push({ type:'email', value:order.clienteEmail })
              if (order.clienteDireccion) contactos.push({ type:'dir',   value:order.clienteDireccion })
            } else if (na === norm('Llamar')) {
              if (order.clienteTelefono) contactos.push({ type:'tel',   value:order.clienteTelefono })
              if (order.clienteEmail)    contactos.push({ type:'email', value:order.clienteEmail })
            } else if ([norm('Enviar Propuesta'),norm('Cerrar Venta'),norm('Mensaje'),norm('Solicitar Referidos'),norm('Seguimiento'),norm('Resolver Objeción'),norm('Post Venta'),norm('Venta Cruzada'),norm('Venta Ascendente')].includes(na)) {
              if (order.clienteTelefono) contactos.push({ type:'tel',   value:order.clienteTelefono })
              if (order.clienteEmail)    contactos.push({ type:'email', value:order.clienteEmail })
            }

            {
              // Calcular colores sección 1 igual que CardActividad
              const esPistaCard2 = order.esPista === true || order.estado === 'Pista'
              const hoyD2 = getNowGuayaquil(); hoyD2.setHours(0,0,0,0)
              const fD2 = order._fecha ? new Date(order._fecha) : null; if (fD2) fD2.setHours(0,0,0,0)
              const diffDias2 = fD2 ? Math.round((fD2 - hoyD2) / 86400000) : 0
              const esSinFecha2 = modo === 'sinFecha'
              // Pistas vencidas = rojo, pistas sin fecha = naranja, pistas pendientes = azul
              // Órdenes sin fecha = naranja, órdenes vencidas = rojo, órdenes pendientes = verde
              const esVencida2 = esPistaCard2
                ? (fD2 && diffDias2 < 0)          // pista con fecha pasada
                : (!esSinFecha2 && diffDias2 < 0)  // orden vencida
              const s1Bg = esSinFecha2 ? '#fffbeb'
                : esPistaCard2 && esVencida2 ? '#fef2f2'
                : esPistaCard2 ? '#eff6ff'
                : esVencida2 ? '#fef2f2'
                : '#f0fdf4'
              const s1Color = esSinFecha2 ? '#d97706'
                : esPistaCard2 && esVencida2 ? '#dc2626'
                : esPistaCard2 ? '#2563eb'
                : esVencida2 ? '#dc2626'
                : '#16a34a'
              const s1Label = diff ? diff.label : (modo === 'sinFecha' ? 'Sin fecha' : '')
              const DIAS_ES3 = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
              const MESES_ES4 = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
              const fechaLabel2 = fD2 ? `${DIAS_ES3[fD2.getDay()]} ${fD2.getDate()} de ${MESES_ES4[fD2.getMonth()]} ${fD2.getFullYear()}` : ''
              const hora2 = order.siguienteAccionFecha?.toString().includes(' ') ? order.siguienteAccionFecha.toString().split(' ')[1] : ''
              return (
                <div key={order.estado === 'Pista' ? `pista-${order.rowIndex}` : order.numOrden}
                  onClick={() => order.estado === 'Pista' ? onViewPista && onViewPista(order) : onViewOrder(order)}
                  style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', boxShadow:'var(--shadow)', border:'1.5px solid var(--border)', transition:'box-shadow 0.15s', animation:`fadeUp 0.2s ${Math.min(i,5)*0.04}s ease both` }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-lg)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>

                  {/* Sección 1 */}
                  <div style={{ background:s1Bg, padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'12px', fontWeight:'800', color:s1Color }}>{s1Label}</span>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:s1Color, background:'var(--white)', padding:'1px 8px', borderRadius:'20px', display:'block', marginBottom:'3px', opacity:0.9 }}>{esPistaCard2 ? 'Pista' : order.estado}</span>
                      {!esPistaCard2 && order.total > 0 && <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'15px', color:s1Color }}>{fmtMoney(order.total)}</div>}
                      {order.numOrden && <div style={{ fontSize:'10px', color:s1Color, opacity:0.7 }}>{order.numOrden}</div>}
                      {esPistaCard2 && order.potencial && <span style={{ fontSize:'11px', fontWeight:'700', color:s1Color }}>{order.potencial}</span>}
                    </div>
                  </div>

                  {/* Sección 2 — verde o rojo */}
                  <div style={{ background: s1Bg, padding:'10px 14px' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>{order.clienteNombre || order.nombre}</div>
                    {(order.clienteNegocio || order.negocio) && <div style={{ fontSize:'13px', color:'var(--muted)', marginTop:'1px' }}>{order.clienteNegocio || order.negocio}</div>}
                    {contactos.length > 0 && (
                      <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
                        {contactos.map((ct, ci) => {
                          if (ct.type==='tel') return (
                            <a key={ci} href={`https://wa.me/593${ct.value.replace(/\D/g,'').replace(/^0/,'')}`}
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

                  {/* Sección 3 — negro */}
                  <div style={{ background:'#0f172a', padding:'10px 14px', borderTop:'1px solid #1e293b' }}>
                    {accion && <div style={{ fontSize:'12px', color:'#f8fafc', fontWeight:'700', marginBottom:'3px' }}>Actividad: {accion}</div>}
                    {modo === 'sinFecha' && !accion && <div style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>Sin fecha de seguimiento</div>}
                    {fechaLabel2 && (
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#94a3b8', display:'flex', alignItems:'center', gap:'5px' }}>
                        <Icon d={icons.calendar} size={12} fill="#94a3b8" />
                        {fechaLabel2}{hora2 ? ` · ${hora2}` : ''}
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
          })}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// PISTAS VIEW
// ─────────────────────────────────────────────────────────────────────────────

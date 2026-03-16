import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'
const _hasSpoken = { current: false }


export default function MiDia({ onViewOrder, onViewPista, onViewProximaSemana, initialVista }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diasExtra, setDiasExtra] = useState(0)
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('asc')

  const [dashData, setDashData] = useState(null)
  const [speaking, setSpeaking] = useState(false)
  const [vistaActiva, setVistaActiva] = useState(initialVista || 'hoy')

  const hablar = (actividadesHoy, actividadesVencidas, diasVencidos, diasExtra, faltante, totalVencido) => {
    if (!window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const totalHoy = actividadesHoy.reduce((s,o) => s + (o.total||0), 0)
    const listaVenc = actividadesVencidas.filter(o => {
      const s = o.siguienteAccionFecha?.toString().trim().split(' ')[0]
      if (!s || !s.includes('/')) return false
      const p = s.split('/')
      if (p.length !== 3) return false
      const f = new Date(p[2], p[1]-1, p[0])
      f.setHours(0,0,0,0)
      const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
      return Math.floor((hoy2 - f) / (1000*60*60*24)) <= diasVencidos + diasExtra
    })
    const numHoy = actividadesHoy.length
    const numVenc = listaVenc.length
    const totalVenc = listaVenc.reduce((s,o) => s + (o.total||0), 0)
    const numAPalabras = (n) => {
      let num = parseFloat(n) || 0
      // Redondear al millar más cercano si >= 1000, a la centena si < 1000
      num = Math.round(num / 100) * 100
      num = Math.round(num)
      if (num === 0) return 'cero dólares'
      const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
        'diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
      const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
      const centenas = ['','cien','doscientos','trescientos','cuatrocientos','quinientos',
        'seiscientos','setecientos','ochocientos','novecientos']
      const parteEntera = (n) => {
        if (n === 0) return ''
        if (n < 20) return unidades[n]
        if (n < 100) {
          const d = Math.floor(n/10), u = n%10
          return u === 0 ? decenas[d] : `${d===2?'veinti':''}${d===2?unidades[u]:decenas[d]+' y '+unidades[u]}`
        }
        if (n < 1000) {
          const c = Math.floor(n/100), r = n%100
          const sc = c===1&&r===0?'cien':c===1?'ciento':centenas[c]
          return r===0?sc:`${sc} ${parteEntera(r)}`
        }
        if (n < 1000000) {
          const miles = Math.floor(n/1000), r = n%1000
          const smiles = miles===1?'mil':`${parteEntera(miles)} mil`
          return r===0?smiles:`${smiles} ${parteEntera(r)}`
        }
        return n.toString()
      }
      const textoEntero = parteEntera(num) || 'cero'
      return `${textoEntero} dólares`
    }
    const hora = getNowGuayaquil().getHours()
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
    const nombre = (actividadesHoy[0] && data?.nombreUsuario) ? `, ${data.nombreUsuario}` : ''
    const parteHoy = numHoy === 0
      ? 'No tienes actividades programadas para hoy.'
      : `Hoy tienes ${numHoy} ${numHoy === 1 ? 'actividad programada' : 'actividades programadas'} por ${numAPalabras(totalHoy)}.`
    const parteVenc = numVenc === 0
      ? 'No tienes órdenes vencidas pendientes.'
      : `Tienes ${numVenc} ${numVenc === 1 ? 'orden vencida' : 'órdenes vencidas'} y estás regalando ${numAPalabras(totalVenc)} a la competencia.`
    const texto = `${saludo}${nombre}. ${parteHoy} ${parteVenc}`
    const utter = new SpeechSynthesisUtterance(texto)
    utter.lang = 'es-EC'
    utter.rate = 0.95
    utter.pitch = 1
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  const dataRef = useRef(null)
  const hasSpoken = _hasSpoken

  useEffect(() => {
    fetch(`${API_BASE}?action=getMiDia`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setData(d.data)
          dataRef.current = d.data
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch(`${API_BASE}?action=dashboard`)
      .then(r => r.json())
      .then(d => { if (d.success) setDashData(d.data) })
      .catch(() => {})
  }, [])

  // Auto-hablar solo la primera vez que cargan los datos
  useEffect(() => {
    if (!data || !window.speechSynthesis || hasSpoken.current) return
    const timer = setTimeout(() => {
      const d = data
      const totalHoy = d.actividadesHoy.reduce((s,o) => s + (o.total||0), 0)
      const listaVenc = d.actividadesVencidas.filter(o => {
        const s = o.siguienteAccionFecha?.toString().trim().split(' ')[0]
        if (!s || !s.includes('/')) return false
        const p = s.split('/')
        if (p.length !== 3) return false
        const f = new Date(p[2], p[1]-1, p[0]); f.setHours(0,0,0,0)
        const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
        return Math.floor((hoy2 - f) / (1000*60*60*24)) <= d.diasVencidos
      })
      const numHoy = d.actividadesHoy.length
      const numVenc = listaVenc.length
      const totalVenc = listaVenc.reduce((s,o) => s + (o.total||0), 0)
      const redondear = (n) => {
        const num = parseFloat(n) || 0
        return Math.round(num / 100) * 100
      }
      const numAPalabras = (n) => {
        const num = redondear(n)
        if (num === 0) return 'cero dólares'
        const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
        const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
        const centenas = ['','cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos']
        const p = (n) => {
          if (n === 0) return ''
          if (n < 20) return unidades[n]
          if (n < 100) { const d = Math.floor(n/10), u = n%10; return u===0?decenas[d]:`${d===2?'veinti'+unidades[u]:decenas[d]+' y '+unidades[u]}` }
          if (n < 1000) { const cv = Math.floor(n/100), r = n%100; const sc = cv===1&&r===0?'cien':cv===1?'ciento':centenas[cv]; return r===0?sc:`${sc} ${p(r)}` }
          if (n < 1000000) { const miles = Math.floor(n/1000), r = n%1000; const sm = miles===1?'mil':`${p(miles)} mil`; return r===0?sm:`${sm} ${p(r)}` }
          return n.toString()
        }
        return `${p(num)} dólares`
      }
      const hora = getNowGuayaquil().getHours()
      const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
      const nombre = d.nombreUsuario ? `, ${d.nombreUsuario}` : ''
      const parteHoy = numHoy === 0 ? 'No tienes actividades programadas para hoy.' : `Hoy tienes ${numHoy} ${numHoy===1?'actividad programada':'actividades programadas'} por ${numAPalabras(totalHoy)}.`
      const parteVenc = numVenc === 0 ? 'No tienes órdenes vencidas pendientes.' : `Tienes ${numVenc} ${numVenc===1?'orden vencida':'órdenes vencidas'} y estás regalando ${numAPalabras(totalVenc)} a la competencia.`
      const texto = `${saludo}${nombre}. ${parteHoy} ${parteVenc}`
      const utter = new SpeechSynthesisUtterance(texto)
      utter.lang = 'es-EC'
      utter.rate = 0.95
      utter.pitch = 1
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.cancel()
      setSpeaking(true)
      hasSpoken.current = true
      window.speechSynthesis.speak(utter)
    }, 800)
    return () => { clearTimeout(timer); window.speechSynthesis.cancel() }
  }, [data])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }

  const fmtM = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const parseFechaActividad = (s) => {
    if (!s) return null
    const parte = s.toString().trim().split(' ')[0]
    if (parte.includes('/')) {
      const p = parte.split('/')
      if (p.length === 3) return new Date(p[2], p[1]-1, p[0])
    }
    return null
  }

  const diasDesdeVencimiento = (s) => {
    const f = parseFechaActividad(s)
    if (!f) return 0
    f.setHours(0,0,0,0)
    const hoy = getNowGuayaquil(); hoy.setHours(0,0,0,0)
    return Math.max(0, Math.floor((hoy - f) / (1000*60*60*24)))
  }

  const contactosPorAccion = (order) => {
    const na = norm(order.accion || '')
    const contactos = []
    if (na === norm('Visitar')) {
      if (order.clienteTelefono) contactos.push({ type: 'tel', value: order.clienteTelefono })
      if (order.clienteEmail)    contactos.push({ type: 'email', value: order.clienteEmail })
    } else {
      if (order.clienteTelefono) contactos.push({ type: 'tel', value: order.clienteTelefono })
      if (order.clienteEmail)    contactos.push({ type: 'email', value: order.clienteEmail })
    }
    return contactos
  }

  const CardActividad = ({ order, urgencia }) => {
    const dias = diasDesdeVencimiento(order.siguienteAccionFecha)
    const accion = (order.accion || '').trim()
    const na = norm(accion)

    // Contactos
    const contactos = []
    if (na === norm('Visitar')) {
      if (order.clienteTelefono)  contactos.push({ type:'tel',   value:order.clienteTelefono })
      if (order.clienteEmail)     contactos.push({ type:'email', value:order.clienteEmail })
      if (order.clienteDireccion) contactos.push({ type:'dir',   value:order.clienteDireccion })
    } else {
      if (order.clienteTelefono) contactos.push({ type:'tel', value:order.clienteTelefono })
      if (order.clienteEmail)    contactos.push({ type:'email', value:order.clienteEmail })
    }

    // Fecha formateada con día de la semana
    const fechaAct = parseFechaActividad(order.siguienteAccionFecha)
    const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    const MESES_ES2 = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const fechaLabel = fechaAct
      ? `${DIAS_ES[fechaAct.getDay()]} ${fechaAct.getDate()} de ${MESES_ES2[fechaAct.getMonth()]} ${fechaAct.getFullYear()}`
      : ''
    const hora = order.siguienteAccionFecha?.toString().includes(' ') ? order.siguienteAccionFecha.toString().split(' ')[1] : ''

    // Color sección 1: rojo si vencida, amarillo si hoy, azul si futura
    const hoyD = getNowGuayaquil(); hoyD.setHours(0,0,0,0)
    const fD = fechaAct ? new Date(fechaAct) : null; if (fD) fD.setHours(0,0,0,0)
    const diffDias = fD ? Math.round((fD - hoyD) / 86400000) : 0
    const esPistaCard = order.esPista === true || order.estado === 'Pista'
    const esVencidaAct = !esPistaCard && (urgencia || diffDias < 0)
    const sec1Bg = esPistaCard ? '#eff6ff' : esVencidaAct ? '#fef2f2' : '#f0fdf4'
    const sec1Color = esPistaCard ? '#2563eb' : esVencidaAct ? '#dc2626' : '#16a34a'
    const sec1Label = diffDias < 0
      ? `${Math.abs(diffDias)} ${Math.abs(diffDias)===1?'día':'días'} vencida`
      : diffDias === 0 ? 'Hoy' : diffDias === 1 ? 'Mañana' : `En ${diffDias} días`
    const potencialColor = (p) => p === 'Alto' ? '#16a34a' : p === 'Medio' ? '#d97706' : '#dc2626'

    return (
      <div onClick={() => esPistaCard ? onViewPista && onViewPista(order) : onViewOrder(order)}
        style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', boxShadow:'var(--shadow)', border:'1.5px solid var(--border)', transition:'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-lg)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>

        {/* Sección 1 — rojo/amarillo/azul: estado + días vencida + monto + orden */}
        <div style={{ background:sec1Bg, padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'12px', fontWeight:'800', color:sec1Color }}>{sec1Label}</span>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:sec1Color, background:'var(--white)', padding:'1px 8px', borderRadius:'20px', display:'block', marginBottom:'3px', opacity:0.9 }}>{esPistaCard ? 'Pista' : order.estado}</span>
            {esPistaCard ? (
              order.potencial
                ? <div style={{ fontSize:'11px', fontWeight:'700', color:potencialColor(order.potencial) }}>Potencial {order.potencial.toLowerCase()}</div>
                : null
            ) : (
              <>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'15px', color:sec1Color }}>{fmtM(order.total)}</div>
                <div style={{ fontSize:'10px', color:sec1Color, opacity:0.7 }}>{order.numOrden}</div>
              </>
            )}
          </div>
        </div>

        {/* Sección 2 — color según tipo */}
        <div style={{ background: esPistaCard ? '#eff6ff' : esVencidaAct ? '#fef2f2' : '#f0fdf4', padding:'10px 14px' }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>{order.clienteNombre}</div>
          {order.clienteNegocio && <div style={{ fontSize:'13px', color:'var(--muted)', marginTop:'1px' }}>{order.clienteNegocio}</div>}
          {contactos.length > 0 && (
            <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
              {contactos.map((ct, ci) => {
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

        {/* Sección 3 — negro: actividad → fecha → nota */}
        <div style={{ background:'#0f172a', padding:'10px 14px', borderTop:'1px solid #1e293b' }}>
          {accion && (
            <div style={{ fontSize:'12px', color:'#f8fafc', fontWeight:'700', marginBottom:'3px' }}>Actividad: {accion}</div>
          )}
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>
      Cargando tu día...
    </div>
  )

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>😕</div>
      No se pudo cargar la información
    </div>
  )

  const { metaMes, valorX, diasLaborables, multiplicador, diasVencidos, diasVencidos2,
          actividadesHoy, actividadesVencidas, totalVencido, enCamino, faltante, nombreUsuario } = data

  const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const mesActual = MESES_ES[new Date().getMonth()]

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '26px', letterSpacing: '-0.02em' }}>Mi día de hoy</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon d={icons.calendar} size={13} />{getTodayLabel()}
          </div>
          {data && (
            <button onClick={() => hablar(data.actividadesHoy, data.actividadesVencidas, data.diasVencidos, diasExtra, data.faltante, data.totalVencido)}
              title={speaking ? 'Detener' : 'Escuchar resumen del día'}
              style={{ background: speaking ? 'var(--brand)' : 'var(--white)', border: `1.5px solid ${speaking ? 'var(--brand)' : 'var(--border)'}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, animation: !speaking ? 'pulse 1.5s infinite' : 'none', boxShadow: !speaking ? '0 0 0 3px var(--brand-light)' : 'none' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{speaking ? '⏹' : '🔊'}</span>
            </button>
          )}
        </div>
        {/* Botones Hoy / Esta semana / Próxima semana */}
        <div style={{ display:'flex', gap:'6px', marginTop:'10px' }}>
          {[['hoy','Hoy'],['semana','Esta semana'],['proxima','Próxima semana']].map(([key, lbl]) => (
            <button key={key} onClick={() => {
              if (key === 'proxima' && onViewProximaSemana) { onViewProximaSemana('proxima'); return }
              if (key === 'semana' && onViewProximaSemana) { onViewProximaSemana('semana'); return }
              setVistaActiva(key)
            }}
              style={{ padding:'6px 14px', borderRadius:'20px', border:`1.5px solid ${vistaActiva===key?'var(--brand)':'var(--border)'}`, background:vistaActiva===key?'var(--brand)':'var(--white)', color:vistaActiva===key?'white':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>



      {vistaActiva === 'hoy' && <div>

      {/* ── BANNER + MEDIDOR HOY ─────────────────────────────────────────────── */}
      {(() => {
        const totalHoy = actividadesHoy.reduce((s,o) => s + (o.total||0), 0)
        const enCaminoHoy = totalHoy >= valorX
        const faltaHoy = Math.max(0, valorX - totalHoy)
        return (
          <>
            <div style={{ background: enCaminoHoy ? '#16a34a' : '#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', marginBottom:'8px', textAlign:'center' }}>
              <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                {enCaminoHoy ? '🟢 Estás en verde' : '🔴 Estás en rojo'}
              </span>
            </div>
            <div style={{ background: enCaminoHoy ? '#f0fdf4' : '#fef2f2', border:`1.5px solid ${enCaminoHoy ? '#bbf7d0' : '#fecaca'}`, borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color: enCaminoHoy?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>En juego hoy</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color: enCaminoHoy?'#16a34a':'#dc2626' }}>{fmtM(totalHoy)}</div>
                </div>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color: enCaminoHoy?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Necesitas</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color: enCaminoHoy?'#16a34a':'#dc2626' }}>{fmtM(valorX)}</div>
                </div>
              </div>
              {enCaminoHoy ? (
                <div style={{ fontSize:'13px', fontWeight:'700', color:'#16a34a' }}>✓ Tienes suficiente en juego para hoy — ¡estás en camino!</div>
              ) : (
                <div style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>⚠ Te faltan {fmtM(faltaHoy)} — necesitas prospectar o recuperar órdenes hoy</div>
              )}
            </div>
          </>
        )
      })()}

      {/* ── SECCIÓN 1: Actividades de hoy ─────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon d={icons.calendar} size={13} />
          Actividades de hoy · {actividadesHoy.length}
        </div>

        {actividadesHoy.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            Sin actividades programadas para hoy
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {actividadesHoy.map(o => <CardActividad key={o.numOrden} order={o} urgencia={false} />)}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: Dinero que estás dejando en la mesa ─────────────────── */}
      <div>
        <div style={{ background:'#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', marginBottom:'12px', textAlign:'center' }}>
          <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>💸 Dinero que estás perdiendo</span>
        </div>
        {/* Medidor verde/rojo */}
        {(() => {
          const listaVenc = actividadesVencidas.filter(o => {
            const f = parseFechaActividad(o.siguienteAccionFecha)
            if (!f) return false
            f.setHours(0,0,0,0)
            const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
            return Math.floor((hoy2 - f) / (1000*60*60*24)) <= diasVencidos + diasExtra
          })
          const totalV = listaVenc.reduce((s,o) => s + (o.total||0), 0)
          const totalHoyRecup = actividadesHoy.reduce((s,o) => s + (o.total||0), 0)
          const recuperar = Math.max(0, valorX - totalHoyRecup) // lo que falta de la tarjeta de arriba
          const ok = totalV >= recuperar
          const falt = Math.max(0, recuperar - totalV)

          const listaSort = [...listaVenc].sort((a, b) => {
            if (sortField === 'fecha') {
              const fa = parseFechaActividad(a.siguienteAccionFecha) || new Date(0)
              const fb = parseFechaActividad(b.siguienteAccionFecha) || new Date(0)
              fa.setHours(0,0,0,0); fb.setHours(0,0,0,0)
              return sortDir === 'asc' ? fa - fb : fb - fa
            }
            return sortDir === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
          })

          return (
            <>
              <div style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok ? '#bbf7d0' : '#fecaca'}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: ok ? '#16a34a' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Dinero que estás dejando en la mesa</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '22px', color: ok ? '#16a34a' : '#dc2626' }}>{fmtM(totalV)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: ok ? '#16a34a' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Recuperar</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '22px', color: ok ? '#16a34a' : '#dc2626' }}>{fmtM(recuperar)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: ok ? '#16a34a' : '#dc2626' }}>
                  {ok ? '✓ Estás en camino — tienes suficiente en juego' : `⚠ Te faltan ${fmtM(falt)} — necesitas prospectar más hoy`}
                </div>
              </div>

              {/* Botones de rango */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {[{ extra: 0, label: `Vencidas (últimos ${diasVencidos} días)` }, { extra: diasVencidos2 - diasVencidos, label: `Vencidas (últimos ${diasVencidos2} días)` }].map(({ extra, label }) => {
                  const cnt = actividadesVencidas.filter(o => {
                    const f = parseFechaActividad(o.siguienteAccionFecha)
                    if (!f) return false
                    f.setHours(0,0,0,0)
                    const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
                    return Math.floor((hoy2 - f) / (1000*60*60*24)) <= diasVencidos + extra
                  }).length
                  const activo = diasExtra === extra
                  return (
                    <button key={extra} onClick={() => setDiasExtra(extra)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', border:`1.5px solid ${activo?'var(--brand)':'var(--border)'}`, background:activo?'var(--brand-light)':'var(--white)', color:activo?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                      {activo && <Icon d={icons.alert} size={12} />}
                      {label} · {cnt}
                    </button>
                  )
                })}
              </div>

              {/* Botones sort */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
                  <button key={f} onClick={() => toggleSort(f)}
                    style={{ padding: '4px 12px', borderRadius: '20px', border: `1.5px solid ${sortField === f ? 'var(--brand)' : 'var(--border)'}`, background: sortField === f ? 'var(--brand-light)' : 'var(--white)', color: sortField === f ? 'var(--brand)' : 'var(--muted)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {lbl} {sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </button>
                ))}
              </div>

              {/* Lista */}
              {listaSort.length === 0 ? (
                <div style={{ background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  Sin actividades vencidas en los últimos {diasVencidos + diasExtra} días
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {listaSort.map(o => <CardActividad key={o.numOrden} order={o} urgencia={true} />)}
                </div>
              )}
            </>
          )
        })()}

      </div>
      </div>}
    </div>
  )
}


import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'
import { CardOrdenGlobal } from './OrdersView.jsx'
import { EstaSemanaVencidas } from './EstaSemana.jsx'

export default function ProximaSemana({ onViewOrder, onViewMiDia, onViewEstaSemana, initialVista }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState(initialVista || 'proxima')
  const [diasExtraVenc, setDiasExtraVenc] = useState(0)
  const [sortFieldV, setSortFieldV] = useState('fecha')
  const [sortDirV, setSortDirV] = useState('asc')
  const toggleSortV = (field) => {
    if (sortFieldV === field) setSortDirV(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortFieldV(field); setSortDirV(field === 'total' ? 'desc' : 'asc') }
  }
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('asc')
  const [speaking, setSpeaking] = useState(false)

  const hablarSemana = (data) => {
    if (!window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const redondear = (n) => Math.round((parseFloat(n)||0) / 100) * 100
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
    const numActs = (data.ordenesProximaSemana || []).length
    const total = data.totalProximaSemana || 0
    const nombre = data.nombreUsuario ? `, ${data.nombreUsuario}` : ''
    const parteActs = numActs === 0
      ? 'No tienes actividades programadas para la próxima semana.'
      : `La próxima semana tienes ${numActs} ${numActs===1?'actividad programada':'actividades programadas'} por ${numAPalabras(total)}.`
    const parteEstado = data.enCamino
      ? `Tienes suficiente para cumplir la semana. ¡Estás en camino!`
      : `Te faltan ${numAPalabras(data.faltante)} para completar la semana. Necesitas prospectar o recuperar órdenes.`
    const texto = `Próxima semana${nombre}. Semana ${data.numSemana} del mes. ${parteActs} ${parteEstado}`
    const utter = new SpeechSynthesisUtterance(texto)
    utter.lang = 'es-EC'; utter.rate = 0.95; utter.pitch = 1
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  useEffect(() => {
    fetch(`${API_BASE}?action=getProximaSemana`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }

  const parseFecha = (s) => {
    if (!s) return null
    const p = s.toString().trim().split(' ')[0].split('/')
    if (p.length === 3) return new Date(p[2], p[1]-1, p[0])
    return null
  }

  const fmtM = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const DIAS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

  if (loading) return (
    <div style={{ textAlign:'center', padding:'80px', color:'var(--muted)' }}>
      <div style={{ fontSize:'28px', marginBottom:'12px', animation:'pulse 1s infinite' }}>⏳</div>
      Cargando próxima semana...
    </div>
  )
  if (!data) return (
    <div style={{ textAlign:'center', padding:'80px', color:'var(--muted)' }}>
      <div style={{ fontSize:'36px', marginBottom:'12px' }}>😕</div>
      No se pudo cargar la información
    </div>
  )

  const { lunesProximo, finSemana, semanaLaboral, numSemana, pesoSemana,
          metaMes, valorXSemana,
          ordenesProximaSemana, ordenesVencidas, totalProximaSemana,
          enCamino, faltante, diasVencidos1, diasVencidos2 } = data

  // Filtrar vencidas por rango activo
  const limiteVenc = diasVencidos1 + diasExtraVenc
  const vencidasFiltradas = ordenesVencidas.filter(o => {
    const f = parseFecha(o.siguienteAccionFecha)
    if (!f) return false
    f.setHours(0,0,0,0)
    const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
    return Math.floor((hoy2 - f) / (1000*60*60*24)) <= limiteVenc
  })

  // Sort lista próxima semana
  const listaSorted = [...ordenesProximaSemana].sort((a,b) => {
    if (sortField === 'fecha') {
      const fa = parseFecha(a.siguienteAccionFecha) || new Date(0)
      const fb = parseFecha(b.siguienteAccionFecha) || new Date(0)
      return sortDir === 'asc' ? fa - fb : fb - fa
    }
    return sortDir === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
  })

  const CardOrden = ({ order, mostrarDia, onClick }) => <CardOrdenGlobal order={order} mostrarDia={mostrarDia} onClick={onClick || (() => onViewOrder(order))} fmtM={fmtM} />

  const _CardOrdenUnused = ({ order, mostrarDia }) => {
    return (
      <div onClick={() => onViewOrder(order)}
        style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', boxShadow:'var(--shadow)', border:'1.5px solid var(--border)', transition:'box-shadow 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-lg)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>

        {/* Sección 1 */}
        <div style={{ background:sec1Bg, padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'12px', fontWeight:'800', color:sec1Color }}>{sec1Label}</span>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:sec1Color, background:'var(--white)', padding:'1px 8px', borderRadius:'20px', display:'block', marginBottom:'3px', opacity:0.9 }}>{order.estado}</span>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'15px', color:sec1Color }}>{fmtM(order.total)}</div>
            <div style={{ fontSize:'10px', color:sec1Color, opacity:0.7 }}>{order.numOrden}</div>
          </div>
        </div>

        {/* Sección 2 — rojo si vencida, verde si no */}
        <div style={{ background: esVencida ? '#fef2f2' : '#f0fdf4', padding:'10px 14px' }}>
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

  return (
    <div style={{ animation:'fadeUp 0.4s ease', paddingBottom:'40px' }}>

      {/* Header */}
      <div style={{ marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'26px', letterSpacing:'-0.02em', margin:0 }}>Próxima semana</h1>
            <div style={{ fontSize:'13px', color:'var(--muted)', fontWeight:'500', marginTop:'4px' }}>
              {lunesProximo} — {finSemana} · {semanaLaboral} días laborables
            </div>
          </div>
          <button onClick={() => hablarSemana(data)}
            title={speaking ? 'Detener' : 'Escuchar resumen de la semana'}
            style={{ background: speaking ? 'var(--brand)' : 'var(--white)', border:`1.5px solid ${speaking?'var(--brand)':'var(--border)'}`, borderRadius:'50%', width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', flexShrink:0, animation: !speaking?'pulse 1.5s infinite':'none', boxShadow: !speaking?'0 0 0 3px var(--brand-light)':'none' }}>
            <span style={{ fontSize:'18px', lineHeight:1 }}>{speaking ? '⏹' : '🔊'}</span>
          </button>
        </div>
        {/* Botones navegación */}
        <div style={{ display:'flex', gap:'6px', marginTop:'10px' }}>
          {[['hoy','Hoy'],['semana','Esta semana'],['proxima','Próxima semana']].map(([key, lbl]) => (
            <button key={key} onClick={() => {
              if (key === 'hoy' && onViewMiDia) { onViewMiDia('hoy'); return }
              if (key === 'semana' && onViewEstaSemana) { onViewEstaSemana(); return }
              setVistaActiva(key)
            }}
              style={{ padding:'6px 14px', borderRadius:'20px', border:`1.5px solid ${vistaActiva===key?'var(--brand)':'var(--border)'}`, background:vistaActiva===key?'var(--brand)':'var(--white)', color:vistaActiva===key?'white':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      {/* ── VISTA: ESTA SEMANA ─────────────────────────────────────────────────── */}
      {vistaActiva === 'semana' && (() => {
        const {
          lunesEstaSemana: lunesEsta, finEstaSemana: finEsta,
          tipoSemana, diasSemana,
          ordenesEstaSemana = [], totalEstaSemana = 0,
          enCaminoEsta, faltanteEsta, numSemanaEsta, pesoSemanaEsta, valorXSemanaEsta = 0,
          ordenesVencidas = [], diasVencidos1, diasVencidos2,
          nombreUsuario,
        } = data

        const tipoLabel = tipoSemana === 'LV' ? 'Lunes a viernes' : tipoSemana === 'LS' ? 'Lunes a sábado' : 'Lunes a domingo'

        return (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Banner */}
            <div style={{ background: enCaminoEsta ? '#16a34a' : '#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', textAlign:'center' }}>
              <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                {enCaminoEsta ? '🟢 Estás en verde' : '🔴 Estás en rojo'}
              </span>
            </div>

            {/* Medidor */}
            <div style={{ background: enCaminoEsta ? '#f0fdf4' : '#fef2f2', border:`1.5px solid ${enCaminoEsta ? '#bbf7d0' : '#fecaca'}`, borderRadius:'var(--radius-lg)', padding:'16px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:enCaminoEsta?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>En juego esta semana</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:enCaminoEsta?'#16a34a':'#dc2626' }}>{fmtM(totalEstaSemana)}</div>
                </div>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:enCaminoEsta?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Necesitas</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:enCaminoEsta?'#16a34a':'#dc2626' }}>{fmtM(valorXSemanaEsta)}</div>
                </div>
              </div>
              {enCaminoEsta ? (
                <div style={{ fontSize:'13px', fontWeight:'700', color:'#16a34a' }}>✓ Tienes suficiente para esta semana — ¡estás en camino!</div>
              ) : (
                <div style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>⚠ Te faltan {fmtM(faltanteEsta)} — necesitas prospectar o recuperar órdenes</div>
              )}
            </div>

            {/* Info semana */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
              <div style={{ fontSize:'12px', color:'var(--muted)' }}>
                <span style={{ fontWeight:'700', color:'var(--ink)' }}>{lunesEsta}</span> — <span style={{ fontWeight:'700', color:'var(--ink)' }}>{finEsta}</span>
                <span style={{ marginLeft:'8px' }}>· {tipoLabel}</span>
              </div>
            </div>

            {/* Órdenes de esta semana */}
            <div>
              <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
                <Icon d={icons.calendar} size={13} />
                Órdenes esta semana · {ordenesEstaSemana.length}
              </div>
              {ordenesEstaSemana.length === 0 ? (
                <div style={{ background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'center', color:'var(--muted)', fontSize:'13px' }}>
                  Sin órdenes programadas para esta semana
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {ordenesEstaSemana.map(order => <CardOrden key={order.numOrden} order={order} mostrarDia={true} onClick={() => onViewOrder(order)} />)}
                </div>
              )}
            </div>

            {/* Dinero que estás perdiendo */}
            <div>
              <div style={{ background:'#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', marginBottom:'12px', textAlign:'center' }}>
                <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>💸 Dinero que estás perdiendo</span>
              </div>
              <EstaSemanaVencidas
                ordenesVencidas={ordenesVencidas}
                diasVencidos1={diasVencidos1}
                diasVencidos2={diasVencidos2}
                faltanteEsta={faltanteEsta}
                fmtM={fmtM}
                onViewOrder={onViewOrder}
              />
            </div>
          </div>
        )
      })()}

      {/* ── VISTA: PRÓXIMA SEMANA ───────────────────────────────────────────────── */}
      {vistaActiva === 'proxima' && <>

      {/* ── SECCIÓN 1: Medidor semana ──────────────────────────────────────────── */}
      <div style={{ background: enCamino ? '#16a34a' : '#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', marginBottom:'8px', textAlign:'center' }}>
        <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          {enCamino ? '🟢 Estás en verde' : '🔴 Estás en rojo'}
        </span>
      </div>
      <div style={{ background: enCamino ? '#f0fdf4' : '#fef2f2', border:`1.5px solid ${enCamino ? '#bbf7d0' : '#fecaca'}`, borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:'700', color: enCamino?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>En juego próxima semana</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color: enCamino?'#16a34a':'#dc2626' }}>{fmtM(totalProximaSemana)}</div>
          </div>
          <div>
            <div style={{ fontSize:'10px', fontWeight:'700', color: enCamino?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Necesitas</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color: enCamino?'#16a34a':'#dc2626' }}>{fmtM(valorXSemana)}</div>
          </div>
        </div>
        {enCamino ? (
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#16a34a' }}>✓ Tienes suficiente para la próxima semana — ¡estás en camino!</div>
        ) : (
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>⚠ Te faltan {fmtM(faltante)} — necesitas prospectar o recuperar órdenes esta semana</div>
        )}
      </div>

      {/* ── SECCIÓN 2: Órdenes próxima semana ─────────────────────────────────── */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
          <Icon d={icons.calendar} size={13} />
          Actividades programadas · {ordenesProximaSemana.length}
        </div>


        {/* Sort */}
        {ordenesProximaSemana.length > 0 && (
          <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
            {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
              <button key={f} onClick={() => toggleSort(f)}
                style={{ padding:'4px 12px', borderRadius:'20px', border:`1.5px solid ${sortField===f?'var(--brand)':'var(--border)'}`, background:sortField===f?'var(--brand-light)':'var(--white)', color:sortField===f?'var(--brand)':'var(--muted)', fontSize:'11px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                {lbl} {sortField===f?(sortDir==='asc'?'↑':'↓'):'↕'}
              </button>
            ))}
          </div>
        )}

        {listaSorted.length === 0 ? (
          <div style={{ background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'center', color:'var(--muted)', fontSize:'13px' }}>
            Sin actividades programadas para la próxima semana
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {listaSorted.map(o => <CardOrden key={o.numOrden} order={o} mostrarDia={true} />)}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 3: Vencidas ─────────────────────────────────────────────────── */}
      {!enCamino && (
        <div>
          <div style={{ background:'#dc2626', borderRadius:'var(--radius-lg)', padding:'8px 16px', marginBottom:'12px', textAlign:'center' }}>
            <span style={{ fontSize:'13px', fontWeight:'900', color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>💸 Dinero que estás perdiendo</span>
          </div>

          {/* Medidor vencidas */}
          {(() => {
            const totalV = vencidasFiltradas.reduce((s,o) => s + (o.total||0), 0)
            const recuperar = data.faltante || 0  // lo que falta de la sección 1
            const ok = totalV >= recuperar
            const falt = Math.max(0, recuperar - totalV)
            const vSort = [...vencidasFiltradas].sort((a,b) => {
              if (sortFieldV === 'fecha') {
                const fa = parseFecha(a.siguienteAccionFecha) || new Date(0)
                const fb = parseFecha(b.siguienteAccionFecha) || new Date(0)
                fa.setHours(0,0,0,0); fb.setHours(0,0,0,0)
                return sortDirV === 'asc' ? fa - fb : fb - fa
              }
              return sortDirV === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
            })
            return (
              <>
                <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'12px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Dinero que estás dejando en la mesa</div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:'#dc2626' }}>{fmtM(totalV)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Recuperar</div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:'#dc2626' }}>{fmtM(recuperar)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>
                    {ok ? '✓ Estás en camino' : `⚠ Te faltan ${fmtM(falt)} — necesitas prospectar más`}
                  </div>
                </div>

                {/* Botones rango */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  {[{ extra:0, label:`Vencidas (últimos ${diasVencidos1} días)` }, { extra: diasVencidos2 - diasVencidos1, label:`Vencidas (últimos ${diasVencidos2} días)` }].map(({ extra, label }) => {
                    const cnt = ordenesVencidas.filter(o => {
                      const f = parseFecha(o.siguienteAccionFecha)
                      if (!f) return false
                      f.setHours(0,0,0,0)
                      const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
                      return Math.floor((hoy2 - f) / (1000*60*60*24)) <= diasVencidos1 + extra
                    }).length
                    const activo = diasExtraVenc === extra
                    return (
                      <button key={extra} onClick={() => setDiasExtraVenc(extra)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', border:`1.5px solid ${activo?'var(--brand)':'var(--border)'}`, background:activo?'var(--brand-light)':'var(--white)', color:activo?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                        {activo && <Icon d={icons.alert} size={12} />}
                        {label} · {cnt}
                      </button>
                    )
                  })}
                </div>

                {/* Botones sort */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                  {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
                    <button key={f} onClick={() => toggleSortV(f)}
                      style={{ padding:'4px 12px', borderRadius:'20px', border:`1.5px solid ${sortFieldV===f?'var(--brand)':'var(--border)'}`, background:sortFieldV===f?'var(--brand-light)':'var(--white)', color:sortFieldV===f?'var(--brand)':'var(--muted)', fontSize:'11px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                      {lbl} {sortFieldV===f?(sortDirV==='asc'?'↑':'↓'):'↕'}
                    </button>
                  ))}
                </div>

                {/* Lista */}
                {vSort.length === 0 ? (
                  <div style={{ background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'center', color:'var(--muted)', fontSize:'13px' }}>
                    Sin actividades vencidas en los últimos {limiteVenc} días
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {vSort.map(o => <CardOrden key={o.numOrden} order={o} mostrarDia={false} />)}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
      </>}
    </div>
  )
}



// ═════════════════════════════════════════════════════════════════════════════
// LABORATORIO
// ═════════════════════════════════════════════════════════════════════════════

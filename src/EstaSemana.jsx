import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'
import { CardOrdenGlobal } from './OrdersView.jsx'

const potencialColorFn = (p) => p === 'Alto' ? '#16a34a' : p === 'Medio' ? '#d97706' : '#dc2626'

function parseFechaActGlobal(val) {
  if (!val) return null
  const s = val.toString().trim().split(' ')[0]
  if (s.includes('/')) { const [d,m,y] = s.split('/'); return new Date(parseInt(y),parseInt(m)-1,parseInt(d)) }
  if (s.includes('-')) { const [y,m,d] = s.split('-'); return new Date(parseInt(y),parseInt(m)-1,parseInt(d)) }
  return null
}

function CardPistaSimple({ pista, onViewPista, fmtM }) {
  const accion = (pista.accion || '').trim()
  const fechaAct = parseFechaActGlobal(pista.siguienteAccionFecha)
  const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const MESES_ES2 = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaLabel = fechaAct
    ? `${DIAS_ES[fechaAct.getDay()]} ${fechaAct.getDate()} de ${MESES_ES2[fechaAct.getMonth()]} ${fechaAct.getFullYear()}`
    : ''
  const hora = pista.siguienteAccionFecha?.toString().includes(' ') ? pista.siguienteAccionFecha.toString().split(' ')[1] : ''
  const hoyD = getNowGuayaquil(); hoyD.setHours(0,0,0,0)
  const fD = fechaAct ? new Date(fechaAct) : null; if (fD) fD.setHours(0,0,0,0)
  const diffDias = fD ? Math.round((fD - hoyD) / 86400000) : 0
  const sec1Label = diffDias < 0
    ? `${Math.abs(diffDias)} ${Math.abs(diffDias)===1?'día':'días'} vencida`
    : diffDias === 0 ? 'Hoy' : diffDias === 1 ? 'Mañana' : `En ${diffDias} días`
  const telefono = pista.clienteTelefono || pista.telefono || ''
  const email    = pista.clienteEmail    || pista.email    || ''
  const nombre   = pista.clienteNombre   || pista.nombre   || ''
  const negocio  = pista.clienteNegocio  || pista.negocio  || ''
  const nota     = pista.notasSeguimiento || pista.notaSeguimiento || ''
  const dias     = pista.diasEnPista

  return (
    <div onClick={() => onViewPista && onViewPista(pista)}
      style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', cursor:'pointer', boxShadow:'var(--shadow)', border:'1.5px solid var(--border)', transition:'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-lg)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>
      <div style={{ background:'#eff6ff', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'12px', fontWeight:'800', color:'#2563eb' }}>{sec1Label}</span>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#2563eb', background:'var(--white)', padding:'1px 8px', borderRadius:'20px', display:'block', marginBottom:'3px', opacity:0.9 }}>Pista</span>
          {pista.potencial && <div style={{ fontSize:'11px', fontWeight:'700', color:potencialColorFn(pista.potencial) }}>Potencial {pista.potencial.toLowerCase()}</div>}
          {(dias !== undefined && dias !== null) && <div style={{ fontSize:'10px', color:'#2563eb', opacity:0.8 }}>{Math.max(1,dias)} {Math.max(1,dias)===1?'día':'días'} en pista</div>}
        </div>
      </div>
      <div style={{ background:'#eff6ff', padding:'10px 14px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'15px', color:'var(--ink)' }}>{nombre}</div>
        {negocio && <div style={{ fontSize:'13px', color:'var(--muted)', marginTop:'1px' }}>{negocio}</div>}
        {telefono && (
          <div style={{ marginTop:'6px' }}>
            <a href={`https://wa.me/593${telefono.toString().replace(/^'+/,'').replace(/\D/g,'').replace(/^0/,'')}`}
              target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600', color:'#16a34a', textDecoration:'none' }}>
              <Icon d={icons.phone} size={12} />{telefono}
            </a>
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
        {nota && <div style={{ fontSize:'11px', color:'#64748b', marginTop:'4px', fontStyle:'italic' }}>{nota}</div>}
      </div>
    </div>
  )
}

export function EstaSemana({ onViewOrder, onViewMiDia, onViewProximaSemana, onViewPista }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [diasExtra, setDiasExtra] = useState(0)
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir]     = useState('asc')
  const [sortFieldV, setSortFieldV] = useState('fecha')
  const [sortDirV, setSortDirV]     = useState('asc')

  useEffect(() => {
    fetch(`${API_BASE}?action=getProximaSemana`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const [speaking, setSpeaking] = useState(false)

  const toggleSort  = (f) => { if (sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(f); setSortDir(f==='total'?'desc':'asc') } }
  const toggleSortV = (f) => { if (sortFieldV===f) setSortDirV(d=>d==='asc'?'desc':'asc'); else { setSortFieldV(f); setSortDirV(f==='total'?'desc':'asc') } }

  const hablarEstaSemana = (d) => {
    if (!window.speechSynthesis) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const redondear = (n) => Math.round((parseFloat(n)||0) / 100) * 100
    const numAPalabras = (n) => {
      const num = redondear(n)
      if (num === 0) return 'cero dólares'
      const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
      const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
      const centenas = ['','cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos']
      const p = (n) => {
        if (n===0) return ''
        if (n<20) return unidades[n]
        if (n<100) { const d=Math.floor(n/10),u=n%10; return u===0?decenas[d]:`${d===2?'veinti'+unidades[u]:decenas[d]+' y '+unidades[u]}` }
        if (n<1000) { const cv=Math.floor(n/100),r=n%100; const sc=cv===1&&r===0?'cien':cv===1?'ciento':centenas[cv]; return r===0?sc:`${sc} ${p(r)}` }
        if (n<1000000) { const miles=Math.floor(n/1000),r=n%1000; const sm=miles===1?'mil':`${p(miles)} mil`; return r===0?sm:`${sm} ${p(r)}` }
        return n.toString()
      }
      return `${p(num)} dólares`
    }
    const nombre = d.nombreUsuario ? `, ${d.nombreUsuario}` : ''
    const numActs = (d.ordenesEstaSemana||[]).length
    const total = d.totalEstaSemana || 0
    const parteActs = numActs === 0
      ? 'No tienes actividades programadas para esta semana.'
      : `Tienes ${numActs} ${numActs===1?'actividad programada':'actividades programadas'} por ${numAPalabras(total)}.`
    const parteEstado = d.enCaminoEsta
      ? '¡Estás en camino! Tienes suficiente para completar la semana.'
      : `Te faltan ${numAPalabras(d.faltanteEsta)} para completar la semana. Necesitas prospectar o recuperar órdenes.`
    const texto = `Esta semana${nombre}. ${parteActs} ${parteEstado}`
    const utter = new SpeechSynthesisUtterance(texto)
    utter.lang = 'es-EC'
    utter.rate = 0.95
    utter.onend = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utter)
  }

  const parseFecha = (s) => {
    if (!s) return null
    const p = s.toString().trim().split(' ')[0].split('/')
    if (p.length === 3) { const f = new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])); f.setHours(0,0,0,0); return f }
    return null
  }
  const fmtM = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`

  if (loading) return (
    <div style={{textAlign:'center',padding:'80px',color:'var(--muted)'}}>
      <div style={{fontSize:'28px',marginBottom:'12px',animation:'pulse 1s infinite'}}>⏳</div>
      Cargando esta semana...
    </div>
  )
  if (!data) return (
    <div style={{textAlign:'center',padding:'80px',color:'var(--muted)'}}>
      <div style={{fontSize:'36px',marginBottom:'12px'}}>😕</div>
      No se pudo cargar la información
    </div>
  )

  const {
    lunesEstaSemana: lunesEsta, finEstaSemana: finEsta,
    tipoSemana, diasSemana,
    ordenesEstaSemana = [], totalEstaSemana = 0,
    enCaminoEsta, faltanteEsta, numSemanaEsta, pesoSemanaEsta, valorXSemanaEsta = 0,
    ordenesVencidas = [], diasVencidos1 = 15, diasVencidos2 = 30,
    pistasEstaSemana = [], pistasVencidas = [],
  } = data

  const tipoLabel = tipoSemana === 'LV' ? 'Lunes a viernes' : tipoSemana === 'LS' ? 'Lunes a sábado' : 'Lunes a domingo'

  // Mezclar órdenes y pistas en una sola lista ordenada
  const todasActividades = [
    ...ordenesEstaSemana,
    ...pistasEstaSemana,
  ]
  const todasVencidas = [
    ...ordenesVencidas,
    ...pistasVencidas,
  ]

  // Sort actividades programadas
  const ordenesSort = [...todasActividades].sort((a,b) => {
    if (sortField==='fecha') {
      const fa = parseFecha(a.siguienteAccionFecha)||new Date(0)
      const fb = parseFecha(b.siguienteAccionFecha)||new Date(0)
      return sortDir==='asc' ? fa-fb : fb-fa
    }
    return sortDir==='asc' ? (a.total||0)-(b.total||0) : (b.total||0)-(a.total||0)
  })

  // Vencidas filtradas
  const limiteVenc = diasVencidos1 + diasExtra
  const listaVenc = todasVencidas.filter(o => {
    const f = parseFecha(o.siguienteAccionFecha)
    if (!f) return false
    const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
    return Math.floor((hoy2-f)/(1000*60*60*24)) <= limiteVenc
  })
  const totalV    = listaVenc.reduce((s,o) => s+(o.total||0), 0)
  const recuperar = faltanteEsta || 0
  const okV       = totalV >= recuperar
  const faltV     = Math.max(0, recuperar - totalV)
  const vSort = [...listaVenc].sort((a,b) => {
    if (sortFieldV==='fecha') {
      const fa=parseFecha(a.siguienteAccionFecha)||new Date(0)
      const fb=parseFecha(b.siguienteAccionFecha)||new Date(0)
      return sortDirV==='asc' ? fa-fb : fb-fa
    }
    return sortDirV==='asc' ? (a.total||0)-(b.total||0) : (b.total||0)-(a.total||0)
  })

  return (
    <div style={{animation:'fadeUp 0.4s ease',paddingBottom:'40px'}}>

      {/* Header */}
      <div style={{marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'26px',letterSpacing:'-0.02em',margin:0}}>Esta semana</h1>
            <div style={{fontSize:'13px',color:'var(--muted)',fontWeight:'500',marginTop:'4px'}}>
              {lunesEsta} — {finEsta} · {diasSemana} días laborables
            </div>
          </div>
          <button onClick={() => hablarEstaSemana(data)}
            title={speaking ? 'Detener' : 'Escuchar resumen de la semana'}
            style={{ background:speaking?'var(--brand)':'var(--white)', border:`1.5px solid ${speaking?'var(--brand)':'var(--border)'}`, borderRadius:'50%', width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', flexShrink:0, animation:!speaking?'pulse 1.5s infinite':'none', boxShadow:!speaking?'0 0 0 3px var(--brand-light)':'none' }}>
            <span style={{ fontSize:'18px', lineHeight:1 }}>{speaking ? '⏹' : '🔊'}</span>
          </button>
        </div>
        {/* Botones navegación */}
        <div style={{display:'flex',gap:'6px',marginTop:'10px'}}>
          {[['hoy','Hoy'],['semana','Esta semana'],['proxima','Próxima semana']].map(([key,lbl]) => (
            <button key={key} onClick={() => {
              if (key==='hoy' && onViewMiDia) { onViewMiDia('hoy'); return }
              if (key==='proxima' && onViewProximaSemana) { onViewProximaSemana(); return }
            }}
              style={{padding:'6px 14px',borderRadius:'20px',border:`1.5px solid ${key==='semana'?'var(--brand)':'var(--border)'}`,background:key==='semana'?'var(--brand)':'var(--white)',color:key==='semana'?'white':'var(--muted)',fontSize:'12px',fontWeight:'700',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div style={{background:enCaminoEsta?'#16a34a':'#dc2626',borderRadius:'var(--radius-lg)',padding:'8px 16px',marginBottom:'8px',textAlign:'center'}}>
        <span style={{fontSize:'13px',fontWeight:'900',color:'white',letterSpacing:'0.12em',textTransform:'uppercase'}}>
          {enCaminoEsta ? '🟢 Estás en verde' : '🔴 Estás en rojo'}
        </span>
      </div>

      {/* Medidor */}
      <div style={{background:enCaminoEsta?'#f0fdf4':'#fef2f2',border:`1.5px solid ${enCaminoEsta?'#bbf7d0':'#fecaca'}`,borderRadius:'var(--radius-lg)',padding:'16px 20px',marginBottom:'16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'10px'}}>
          <div>
            <div style={{fontSize:'10px',fontWeight:'700',color:enCaminoEsta?'#16a34a':'#dc2626',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px'}}>En juego esta semana</div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'22px',color:enCaminoEsta?'#16a34a':'#dc2626'}}>{fmtM(totalEstaSemana)}</div>
          </div>
          <div>
            <div style={{fontSize:'10px',fontWeight:'700',color:enCaminoEsta?'#16a34a':'#dc2626',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px'}}>Necesitas</div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'22px',color:enCaminoEsta?'#16a34a':'#dc2626'}}>{fmtM(valorXSemanaEsta)}</div>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'6px'}}>
          {enCaminoEsta ? (
            <div style={{fontSize:'13px',fontWeight:'700',color:'#16a34a'}}>✓ Tienes suficiente para esta semana — ¡estás en camino!</div>
          ) : (
            <div style={{fontSize:'13px',fontWeight:'700',color:'#dc2626'}}>⚠ Te faltan {fmtM(faltanteEsta)} — necesitas prospectar o recuperar órdenes esta semana</div>
          )}

        </div>
      </div>

      {/* Actividades programadas */}
      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
          <Icon d={icons.calendar} size={13} />
          Actividades programadas · {todasActividades.length}
        </div>
        {/* Sort */}
        <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
          {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
            <button key={f} onClick={() => toggleSort(f)}
              style={{padding:'4px 12px',borderRadius:'20px',border:`1.5px solid ${sortField===f?'var(--brand)':'var(--border)'}`,background:sortField===f?'var(--brand-light)':'var(--white)',color:sortField===f?'var(--brand)':'var(--muted)',fontSize:'11px',fontWeight:'700',cursor:'pointer',transition:'all 0.15s'}}>
              {lbl} {sortField===f?(sortDir==='asc'?'↑':'↓'):'↕'}
            </button>
          ))}
        </div>
        {ordenesSort.length === 0 ? (
          <div style={{background:'var(--white)',border:'1.5px dashed var(--border)',borderRadius:'var(--radius-lg)',padding:'20px',textAlign:'center',color:'var(--muted)',fontSize:'13px'}}>
            Sin actividades programadas para esta semana
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {ordenesSort.map(o => o.esPista
              ? <CardPistaSimple key={`pista-${o.rowIndex}`} pista={o} onViewPista={onViewPista} fmtM={fmtM} mostrarDia={true} />
              : <CardOrdenGlobal key={o.numOrden} order={o} mostrarDia={true} onClick={() => onViewOrder(o)} fmtM={fmtM} />
            )}
          </div>
        )}
      </div>

      {/* Dinero que estás perdiendo */}
      <div>
        <div style={{background:'#dc2626',borderRadius:'var(--radius-lg)',padding:'8px 16px',marginBottom:'12px',textAlign:'center'}}>
          <span style={{fontSize:'13px',fontWeight:'900',color:'white',letterSpacing:'0.12em',textTransform:'uppercase'}}>💸 Dinero que estás perdiendo</span>
        </div>

        {/* Medidor vencidas */}
        <div style={{background:okV?'#f0fdf4':'#fef2f2',border:`1.5px solid ${okV?'#bbf7d0':'#fecaca'}`,borderRadius:'var(--radius-lg)',padding:'16px 20px',marginBottom:'12px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'10px'}}>
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:okV?'#16a34a':'#dc2626',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px'}}>Dinero que estás dejando en la mesa</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'22px',color:okV?'#16a34a':'#dc2626'}}>{fmtM(totalV)}</div>
            </div>
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:okV?'#16a34a':'#dc2626',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px'}}>Recuperar</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'22px',color:okV?'#16a34a':'#dc2626'}}>{fmtM(recuperar)}</div>
            </div>
          </div>
          <div style={{fontSize:'13px',fontWeight:'700',color:okV?'#16a34a':'#dc2626'}}>
            {okV ? '✓ Estás en camino — tienes suficiente en juego' : `⚠ Te faltan ${fmtM(faltV)} — necesitas prospectar más`}
          </div>
        </div>

        {/* Botones rango */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}>
          {[{extra:0,label:`Vencidas (últimos ${diasVencidos1} días)`},{extra:diasVencidos2-diasVencidos1,label:`Vencidas (últimos ${diasVencidos2} días)`}].map(({extra,label}) => {
            const cnt = ordenesVencidas.filter(o => {
              const f=parseFecha(o.siguienteAccionFecha); if(!f) return false
              const h=getNowGuayaquil(); h.setHours(0,0,0,0)
              return Math.floor((h-f)/(1000*60*60*24)) <= diasVencidos1+extra
            }).length
            const activo = diasExtra===extra
            return (
              <button key={extra} onClick={() => setDiasExtra(extra)}
                style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 12px',borderRadius:'20px',border:`1.5px solid ${activo?'var(--brand)':'var(--border)'}`,background:activo?'var(--brand-light)':'var(--white)',color:activo?'var(--brand)':'var(--muted)',fontSize:'12px',fontWeight:'700',cursor:'pointer',transition:'all 0.15s'}}>
                {activo && <Icon d={icons.alert} size={12} />}
                {label} · {cnt}
              </button>
            )
          })}
        </div>

        {/* Sort vencidas */}
        <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
          {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
            <button key={f} onClick={() => toggleSortV(f)}
              style={{padding:'4px 12px',borderRadius:'20px',border:`1.5px solid ${sortFieldV===f?'var(--brand)':'var(--border)'}`,background:sortFieldV===f?'var(--brand-light)':'var(--white)',color:sortFieldV===f?'var(--brand)':'var(--muted)',fontSize:'11px',fontWeight:'700',cursor:'pointer',transition:'all 0.15s'}}>
              {lbl} {sortFieldV===f?(sortDirV==='asc'?'↑':'↓'):'↕'}
            </button>
          ))}
        </div>

        {/* Lista vencidas */}
        {vSort.length === 0 ? (
          <div style={{background:'var(--white)',border:'1.5px dashed var(--border)',borderRadius:'var(--radius-lg)',padding:'20px',textAlign:'center',color:'var(--muted)',fontSize:'13px'}}>
            Sin actividades vencidas en los últimos {limiteVenc} días
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {vSort.map(o => <CardOrdenGlobal key={o.numOrden} order={o} mostrarDia={false} onClick={() => onViewOrder(o)} fmtM={fmtM} />)}
          </div>
        )}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTA SEMANA — SECCIÓN VENCIDAS
// ─────────────────────────────────────────────────────────────────────────────
export function EstaSemanaVencidas({ ordenesVencidas, diasVencidos1, diasVencidos2, faltanteEsta, fmtM, onViewOrder }) {
  const [diasExtra, setDiasExtra] = useState(0)
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('asc')
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }
  const parseFechaV = (s) => {
    if (!s) return null
    const p = s.toString().trim().split(' ')[0].split('/')
    if (p.length === 3) { const f = new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])); f.setHours(0,0,0,0); return f; }
    return null
  }
  const limiteVenc = (diasVencidos1||15) + diasExtra
  const listaVenc = (ordenesVencidas||[]).filter(o => {
    const f = parseFechaV(o.siguienteAccionFecha)
    if (!f) return false
    const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
    return Math.floor((hoy2 - f) / (1000*60*60*24)) <= limiteVenc
  })
  const totalV = listaVenc.reduce((s,o) => s + (o.total||0), 0)
  const recuperar = faltanteEsta || 0
  const ok = totalV >= recuperar
  const falt = Math.max(0, recuperar - totalV)
  const listaSort = [...listaVenc].sort((a,b) => {
    if (sortField === 'fecha') {
      const fa = parseFechaV(a.siguienteAccionFecha) || new Date(0)
      const fb = parseFechaV(b.siguienteAccionFecha) || new Date(0)
      fa.setHours(0,0,0,0); fb.setHours(0,0,0,0)
      return sortDir === 'asc' ? fa - fb : fb - fa
    }
    return sortDir === 'asc' ? (a.total||0) - (b.total||0) : (b.total||0) - (a.total||0)
  })

  return (
    <>
      <div style={{ background: ok ? '#f0fdf4' : '#fef2f2', border:`1.5px solid ${ok?'#bbf7d0':'#fecaca'}`, borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'10px' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:'700', color:ok?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Dinero en la mesa</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:ok?'#16a34a':'#dc2626' }}>{fmtM(totalV)}</div>
          </div>
          <div>
            <div style={{ fontSize:'10px', fontWeight:'700', color:ok?'#16a34a':'#dc2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Recuperar</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'22px', color:ok?'#16a34a':'#dc2626' }}>{fmtM(recuperar)}</div>
          </div>
        </div>
        <div style={{ fontSize:'13px', fontWeight:'700', color:ok?'#16a34a':'#dc2626' }}>
          {ok ? '✓ Estás en camino — tienes suficiente en juego' : `⚠ Te faltan ${fmtM(falt)} — necesitas prospectar más esta semana`}
        </div>
      </div>

      {/* Botones rango */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
        {[{ extra:0, label:`Vencidas (últimos ${diasVencidos1||15} días)` }, { extra:(diasVencidos2||30)-(diasVencidos1||15), label:`Vencidas (últimos ${diasVencidos2||30} días)` }].map(({ extra, label }) => {
          const cnt = (ordenesVencidas||[]).filter(o => {
            const f = parseFechaV(o.siguienteAccionFecha)
            if (!f) return false
            const hoy2 = getNowGuayaquil(); hoy2.setHours(0,0,0,0)
            return Math.floor((hoy2 - f) / (1000*60*60*24)) <= (diasVencidos1||15) + extra
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

      {/* Sort */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
        {[['fecha','Fecha'],['total','$']].map(([f,lbl]) => (
          <button key={f} onClick={() => toggleSort(f)}
            style={{ padding:'4px 12px', borderRadius:'20px', border:`1.5px solid ${sortField===f?'var(--brand)':'var(--border)'}`, background:sortField===f?'var(--brand-light)':'var(--white)', color:sortField===f?'var(--brand)':'var(--muted)', fontSize:'11px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
            {lbl} {sortField===f?(sortDir==='asc'?'↑':'↓'):'↕'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {listaSort.length === 0 ? (
        <div style={{ background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', textAlign:'center', color:'var(--muted)', fontSize:'13px' }}>
          Sin actividades vencidas en los últimos {limiteVenc} días
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {listaSort.map(o => <CardOrden key={o.numOrden} order={o} mostrarDia={false} onClick={() => onViewOrder(o)} />)}
        </div>
      )}
    </>
  )
}


import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, ESTADO_COLORS } from './shared.jsx'

export default function Laboratorio() {
  const [tab, setTab] = useState('panel')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [labConfig, setLabConfig] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}?action=getLaboratorio`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch(`${API_BASE}?action=getLabConfig`)
      .then(r => r.json())
      .then(d => { if (d.success) setLabConfig(d.data) })
      .catch(() => {})
  }, [])

  const TABS = [
    { key: 'panel',      icon: '📊', label: 'Panel' },
    { key: 'proyeccion', icon: '📈', label: 'Proyecciones' },
    { key: 'cotizador',  icon: '✍️', label: 'Cotizador IA' },
    { key: 'copiloto',   icon: '🤖', label: 'Copiloto' },
  ]

  const fmtM = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`
  const pct  = (a,b) => b > 0 ? Math.min(100, Math.round((a/b)*100)) : 0

  if (loading) return (
    <div style={{textAlign:'center',padding:'80px',color:'var(--muted)'}}>
      <div style={{fontSize:'32px',marginBottom:'12px',animation:'pulse 1s infinite'}}>⚗️</div>
      Cargando laboratorio...
    </div>
  )

  return (
    <div style={{animation:'fadeUp 0.4s ease',paddingBottom:'60px'}}>
      <div style={{marginBottom:'20px'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'28px',letterSpacing:'-0.02em',display:'flex',alignItems:'center',gap:'10px'}}>
          ⚗️ Laboratorio
        </h1>
        <p style={{color:'var(--muted)',fontSize:'14px',marginTop:'4px'}}>Análisis, proyecciones e inteligencia artificial</p>
      </div>
      <div style={{display:'flex',gap:'6px',marginBottom:'24px',overflowX:'auto',paddingBottom:'4px'}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{padding:'8px 16px',borderRadius:'var(--radius)',border:`1.5px solid ${tab===t.key?'var(--brand)':'var(--border)'}`,background:tab===t.key?'var(--brand)':'var(--white)',color:tab===t.key?'white':'var(--muted)',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',display:'flex',alignItems:'center',gap:'6px'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'panel'      && data && <LabPanel data={data} fmtM={fmtM} pct={pct} />}
      {tab === 'proyeccion' && data && <LabProyeccion data={data} fmtM={fmtM} pct={pct} />}
      {tab === 'cotizador'  && data && <LabCotizador data={data} fmtM={fmtM} labConfig={labConfig} />}
      {tab === 'copiloto'   && data && <LabCopiloto data={data} labConfig={labConfig} />}
    </div>
  )
}

// ── PANEL ────────────────────────────────────────────────────────────────────
function LabPanel({ data, fmtM, pct }) {
  const { ventasMesActual, metaMes, mejorMes, mejorMesLabel, graficaVentas, ranking, resumenMes } = data
  const maxBar = Math.max(...graficaVentas.map(g => g.valor), 1)
  const maxRank = Math.max(...(ranking||[]).map(r => r.total), 1)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {[
          {label:'Ventas del mes', valor: fmtM(ventasMesActual), sub: metaMes>0?`${pct(ventasMesActual,metaMes)}% de la meta`:'Sin meta definida', color:'#16a34a'},
          {label:'Mejor mes', valor: fmtM(mejorMes), sub: mejorMesLabel||'—', color:'#2563eb'},
          {label:'Pipeline activo', valor: fmtM(resumenMes.totalActivas), sub:`${resumenMes.activas} órdenes activas`, color:'#d97706'},
          {label:'Pistas activas', valor: resumenMes.pistas, sub:'sin primera orden', color:'#7c3aed'},
        ].map(k => (
          <div key={k.label} style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'14px 16px',boxShadow:'var(--shadow)'}}>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'4px'}}>{k.label}</div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'20px',color:k.color}}>{k.valor}</div>
            <div style={{fontSize:'12px',color:'var(--muted)',marginTop:'2px'}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfica ventas por mes */}
      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'14px'}}>Ventas por mes</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'120px'}}>
          {graficaVentas.map((g,i) => {
            const h = maxBar > 0 ? Math.max(4, Math.round((g.valor/maxBar)*110)) : 4
            const isActual = i === graficaVentas.length - 1
            return (
              <div key={g.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',cursor:'default'}} title={fmtM(g.valor)}>
                <div style={{width:'100%',height:`${h}px`,background:isActual?'var(--brand)':'#bfdbfe',borderRadius:'3px 3px 0 0',transition:'height 0.3s'}} />
                <div style={{fontSize:'9px',color:'var(--muted)',writingMode:'vertical-rl',transform:'rotate(180deg)',height:'32px',overflow:'hidden',textOverflow:'ellipsis'}}>{g.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ranking clientes */}
      {ranking && ranking.length > 0 && (
        <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
          <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'12px'}}>Top clientes por ventas</div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {ranking.map((r,i) => (
              <div key={r.nombre} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{fontSize:'12px',fontWeight:'800',color:'var(--muted)',width:'18px',textAlign:'right',flexShrink:0}}>#{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'3px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.nombre}</div>
                  <div style={{height:'6px',borderRadius:'3px',background:'var(--cream)',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct(r.total,maxRank)}%`,background:'var(--brand)',borderRadius:'3px',transition:'width 0.4s'}} />
                  </div>
                </div>
                <div style={{fontSize:'12px',fontWeight:'700',color:'var(--brand)',flexShrink:0}}>{fmtM(r.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PROYECCIONES ─────────────────────────────────────────────────────────────
function LabProyeccion({ data, fmtM, pct }) {
  const { ventasMesActual, metaMes, ordenesActivas } = data
  const [meta, setMeta] = useState(metaMes || 50000)

  const hoy = getNowGuayaquil()
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate()
  const diaActual = hoy.getDate()
  const diasRestantes = diasMes - diaActual + 1
  const gap = Math.max(0, meta - ventasMesActual)
  const ritmoDiario = diasRestantes > 0 ? gap / diasRestantes : 0
  const proyeccion = diasMes > 0 ? (ventasMesActual / diaActual) * diasMes : 0
  const porcentaje = pct(ventasMesActual, meta)
  const enCamino = proyeccion >= meta

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      {/* Slider meta */}
      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'12px'}}>Simula tu meta mensual</div>
        <input type="range" min="10000" max="500000" step="5000" value={meta}
          onChange={e => setMeta(parseInt(e.target.value))}
          style={{width:'100%',marginBottom:'8px'}} />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'13px',color:'var(--muted)'}}>$10.000</span>
          <span style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'20px',color:'var(--brand)'}}>{fmtM(meta)}</span>
          <span style={{fontSize:'13px',color:'var(--muted)'}}>$500.000</span>
        </div>
      </div>

      {/* Métricas proyección */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {[
          {label:'Vendido hasta hoy', valor:fmtM(ventasMesActual), color:'#16a34a'},
          {label:'Proyección del mes', valor:fmtM(proyeccion), color: enCamino?'#16a34a':'#dc2626'},
          {label:'Gap restante', valor:fmtM(gap), color: gap>0?'#dc2626':'#16a34a'},
          {label:'Ritmo diario necesario', valor:fmtM(ritmoDiario), color:'#d97706'},
        ].map(k => (
          <div key={k.label} style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'14px 16px',boxShadow:'var(--shadow)'}}>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'4px'}}>{k.label}</div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:'800',fontSize:'18px',color:k.color}}>{k.valor}</div>
          </div>
        ))}
      </div>

      {/* Barra progreso */}
      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
          <span style={{fontSize:'13px',fontWeight:'700'}}>Avance hacia la meta</span>
          <span style={{fontSize:'13px',fontWeight:'800',color: enCamino?'#16a34a':'#dc2626'}}>{porcentaje}%</span>
        </div>
        <div style={{height:'12px',borderRadius:'6px',background:'var(--cream)',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${porcentaje}%`,background: enCamino?'#16a34a':'#dc2626',borderRadius:'6px',transition:'width 0.5s'}} />
        </div>
        <div style={{fontSize:'12px',color:'var(--muted)',marginTop:'6px',textAlign:'center'}}>
          {enCamino ? '✓ Al ritmo actual alcanzarás la meta' : `⚠ Necesitas ${fmtM(ritmoDiario)} por día durante ${diasRestantes} días`}
        </div>
      </div>

      {/* Lista órdenes activas */}
      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'12px'}}>
          Pipeline — {ordenesActivas.length} órdenes · {fmtM(data.totalActivasPipeline)}
        </div>
        {ordenesActivas.length === 0 ? (
          <div style={{textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:'13px'}}>Sin órdenes activas</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {ordenesActivas.slice(0,10).map(o => {
              const col = ESTADO_COLORS[o.estado]||{}
              return (
                <div key={o.numOrden} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',borderRadius:'var(--radius)',background:'var(--cream)',gap:'8px'}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:'700',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{o.cliente}</div>
                    <div style={{fontSize:'11px',color:'var(--muted)'}}>{o.accion||o.siguienteAccionFecha||'Sin acción'}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'var(--brand)'}}>{fmtM(o.total)}</div>
                    <span style={{fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'20px',background:col.bg,color:col.color,border:`1px solid ${col.border}`}}>{o.estado}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── COTIZADOR IA ─────────────────────────────────────────────────────────────
function LabCotizador({ data, fmtM, labConfig }) {
  const [clienteSel, setClienteSel] = useState('')
  const [items, setItems] = useState([])
  const [propuesta, setPropuesta] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  const cfg = labConfig?.config || {}
  const IVA_RATE = parseFloat(cfg.iva?.texto || '0.15')
  const diasEntrega = cfg.dias_entrega?.texto || '3 a 5 días hábiles'
  const firma = cfg.firma?.texto || 'ORDEN PPP'

  const addItem = () => setItems(p => [...p, { prodCod:'', nombre:'', precio:0, iva:IVA_RATE*100, qty:1 }])
  const removeItem = (i) => setItems(p => p.filter((_,idx) => idx!==i))
  const updateItem = (i, field, val) => setItems(p => p.map((it,idx) => idx===i ? {...it,[field]:val} : it))
  const selectProd = (i, cod) => {
    const p = (data.productos||[]).find(p => p.codigo === cod)
    if (p) setItems(prev => prev.map((it,idx) => idx===i ? {...it, prodCod:cod, nombre:p.nombre, precio:p.precio, iva:p.iva} : it))
  }

  const subtotal = items.reduce((s,it) => s + (it.precio * it.qty), 0)
  const totalIva  = items.reduce((s,it) => s + (it.precio * it.qty * (it.iva/100)), 0)
  const total     = subtotal + totalIva

  const generarPropuesta = () => {
    if (!clienteSel || items.length === 0) return
    setGenLoading(true)
    const tmpl = labConfig?.cotizacion || {}
    const sustituir = (tpl, vars) => {
      let t = tpl || ''
      Object.entries(vars).forEach(([k,v]) => { t = t.replace(new RegExp(`\\{${k}\\}`,'g'), v) })
      return t
    }

    const lineas = items.map(it =>
      sustituir(tmpl.item?.texto || '• {qty} x {producto} — {total_item}', {
        qty: it.qty, producto: it.nombre, total_item: fmtM(it.precio * it.qty)
      })
    ).join('\n')

    const partes = [
      sustituir(tmpl.intro?.texto || 'Estimado {cliente},', { cliente: clienteSel }),
      '',
      tmpl.titulo_partidas?.texto || 'Partidas cotizadas:',
      lineas,
      '',
      sustituir(tmpl.subtotal?.texto || 'Subtotal: {subtotal} | IVA: {iva} | Total: {total}', {
        subtotal: fmtM(subtotal), iva: fmtM(totalIva), total: fmtM(total)
      }),
      '',
      sustituir(tmpl.cierre?.texto || 'Tiempo de entrega: {dias_entrega}.', { dias_entrega: diasEntrega }),
      '',
      sustituir(tmpl.firma?.texto || 'Atentamente,\n{firma}', { firma }),
    ]
    setPropuesta(partes.join('\n'))
    setGenLoading(false)
  }

  const copiar = () => { try { navigator.clipboard.writeText(propuesta) } catch {} }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px'}}>Cliente</div>
        <select value={clienteSel} onChange={e => setClienteSel(e.target.value)} style={{...inputStyle,width:'100%',fontSize:'14px'}}>
          <option value="">— Seleccionar cliente —</option>
          {(data.clientes||[]).map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}{c.negocio?` · ${c.negocio}`:''}</option>)}
        </select>
      </div>

      <div style={{background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'12px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Productos / servicios</div>
          <button onClick={addItem} style={{padding:'5px 12px',background:'var(--brand)',color:'white',border:'none',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>+ Agregar</button>
        </div>
        {items.length === 0 ? (
          <div style={{textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:'13px',border:'1.5px dashed var(--border)',borderRadius:'var(--radius)'}}>Agrega productos para cotizar</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {items.map((it,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr auto',gap:'8px',alignItems:'center'}}>
                <select value={it.prodCod} onChange={e => selectProd(i,e.target.value)} style={{...inputStyle,fontSize:'13px'}}>
                  <option value="">— Producto —</option>
                  {(data.productos||[]).map(p => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                </select>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <input type="number" min="1" value={it.qty} onChange={e => updateItem(i,'qty',parseInt(e.target.value)||1)}
                    style={{...inputStyle,width:'60px',fontSize:'13px',textAlign:'center'}} />
                  <span style={{fontSize:'12px',color:'var(--muted)',whiteSpace:'nowrap'}}>{fmtM(it.precio*it.qty)}</span>
                </div>
                <button onClick={() => removeItem(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontSize:'16px',padding:'4px'}}>✕</button>
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div style={{borderTop:'1.5px solid var(--border)',marginTop:'12px',paddingTop:'12px',display:'flex',flexDirection:'column',gap:'4px'}}>
            {[['Subtotal',subtotal],['IVA',totalIva],['Total',total]].map(([l,v]) => (
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:l==='Total'?'15px':'13px',fontWeight:l==='Total'?'800':'600',color:l==='Total'?'var(--brand)':'var(--ink)'}}>
                <span>{l}</span><span>{fmtM(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={generarPropuesta} disabled={genLoading||!clienteSel||items.length===0}
        style={{width:'100%',padding:'13px',background:genLoading||!clienteSel||items.length===0?'var(--muted)':'var(--brand)',color:'white',border:'none',borderRadius:'var(--radius)',fontSize:'14px',fontWeight:'700',cursor:genLoading||!clienteSel||items.length===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
        ✍️ Generar propuesta
      </button>

      {propuesta && (
        <div style={{background:'var(--white)',border:'1.5px solid var(--brand)',borderRadius:'var(--radius-lg)',padding:'16px',boxShadow:'var(--shadow)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{fontSize:'12px',fontWeight:'700',color:'var(--brand)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Propuesta generada</div>
            <button onClick={copiar} style={{padding:'5px 12px',background:'var(--brand-light)',color:'var(--brand)',border:'1.5px solid var(--brand)',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>📋 Copiar</button>
          </div>
          <div style={{fontSize:'13px',lineHeight:'1.7',color:'var(--ink)',whiteSpace:'pre-wrap'}}>{propuesta}</div>
        </div>
      )}
    </div>
  )
}

// ── COPILOTO ──────────────────────────────────────────────────────────────────
function LabCopiloto({ data, labConfig }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const SUGERENCIAS = [
    '¿Cuáles órdenes están en riesgo de perderse?',
    '¿Cómo voy contra la meta del mes?',
    'Dame un resumen ejecutivo de la semana',
    '¿Qué clientes llevan más tiempo sin comprar?',
    '¿Cuál es mi mejor cliente?',
  ]

  const sustituir = (tpl, vars) => {
    let t = (tpl || '').toString()
    Object.entries(vars).forEach(([k,v]) => { t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), v) })
    return t
  }

  const calcularVars = () => {
    const { resumenMes, ordenesActivas, clientes, graficaVentas, ranking } = data
    const hoy = getNowGuayaquil()
    const diasPasados = hoy.getDate()
    const diasMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate()
    const proyeccion = diasPasados > 0 ? (resumenMes.vendido / diasPasados) * diasMes : 0
    const pctMeta = resumenMes.meta > 0 ? Math.round((resumenMes.vendido / resumenMes.meta)*100) : 0
    const clienteTop = ranking?.[0] || { nombre:'—', total:0 }
    const ordenUrgente = ordenesActivas.sort((a,b) => b.total-a.total)[0] || {}
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const mesActual = meses[hoy.getMonth()]
    const inicioSemana = new Date(hoy); inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1)
    const fmtM2 = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`

    return {
      mes_actual: mesActual,
      venta_mes: fmtM2(resumenMes.vendido),
      dias_pasados: diasPasados,
      proyeccion: fmtM2(proyeccion),
      meta: fmtM2(resumenMes.meta),
      pct_meta: pctMeta,
      n_pendientes: ordenesActivas.length,
      total_pendientes: fmtM2(resumenMes.totalActivas),
      cliente_urgente: ordenUrgente.cliente || '—',
      monto_urgente: fmtM2(ordenUrgente.total),
      orden_urgente: ordenUrgente.numOrden || '—',
      cliente_top: clienteTop.nombre,
      total_top: fmtM2(clienteTop.total),
      n_ordenes_top: ranking?.[0] ? '(histórico)' : '—',
      ticket_top: ranking?.[0] ? fmtM2(clienteTop.total / Math.max(1, resumenMes.activas)) : '—',
      cliente_frecuente: ranking?.[1]?.nombre || '—',
      n_clientes: clientes?.length || 0,
      cliente_reciente: clientes?.[0]?.nombre || '—',
      fecha_reciente: '—',
      cliente_sin_compra: clientes?.[clientes.length-1]?.nombre || '—',
      dias_inactivo: '30+',
      total_periodo: fmtM2(resumenMes.vendido),
      crecimiento: '—',
      n_canceladas: 0,
      total_canceladas: fmtM2(0),
      patron_cancelaciones: 'Sin patrón recurrente',
      n_ordenes_semana: ordenesActivas.filter(o => o.estado==='Negociando').length,
      total_semana: fmtM2(ordenesActivas.filter(o=>o.estado==='Negociando').reduce((s,o)=>s+o.total,0)),
      cliente_semana: ordenUrgente.cliente || '—',
      monto_destacado: fmtM2(ordenUrgente.total),
      acumulado_mes: fmtM2(resumenMes.vendido),
      fecha_inicio: `lunes ${inicioSemana.getDate()} de ${mesActual}`,
      fecha_fin: `viernes ${Math.min(inicioSemana.getDate()+4, new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate())} de ${mesActual}`,
      segmento_top: 'B2B',
      ticket_segmento: fmtM2(resumenMes.totalActivas / Math.max(1, resumenMes.activas)),
    }
  }

  const responder = (pregunta) => {
    const copiloto = labConfig?.copiloto || {}
    const vars = calcularVars()
    const q = pregunta.toLowerCase()

    // Buscar patrón que coincida
    let respuesta = null
    for (const [clave, entry] of Object.entries(copiloto)) {
      if (clave === 'default') continue
      const patrones = (entry.patrones || '').split(',').map(p => p.trim()).filter(Boolean)
      if (patrones.some(p => q.includes(p))) {
        respuesta = sustituir(entry.respuesta, vars)
        break
      }
    }

    // Default si no coincidió
    if (!respuesta && copiloto.default) {
      respuesta = sustituir(copiloto.default.respuesta, vars)
    }

    return respuesta || 'No encontré información específica para esa consulta. Intenta preguntar sobre clientes, órdenes, meta del mes o pendientes.'
  }

  const generarBriefing = () => {
    const br = labConfig?.briefing || {}
    const { ordenesActivas, ranking, clientes } = data
    const vars = calcularVars()
    const clienteTop = ranking?.[0]
    if (!clienteTop) { enviarMsg('No hay datos de clientes con órdenes aún.'); return }

    const nOrdenes = ordenesActivas.filter(o => o.cliente === clienteTop.nombre).length + 3
    const vars2 = { ...vars,
      cliente: clienteTop.nombre,
      ciudad: '—', segmento: 'B2B',
      n_ordenes: nOrdenes,
      total_acumulado: `$${Math.round(clienteTop.total).toLocaleString()}`,
      fecha_ultima: '—', monto_ultima: `$${Math.round(clienteTop.total/Math.max(1,nOrdenes)).toLocaleString()}`,
      ticket_promedio: `$${Math.round(clienteTop.total/Math.max(1,nOrdenes)).toLocaleString()}`,
    }

    const tono = nOrdenes > 2 ? (br.tono_conocido?.texto||'') : (br.tono_nuevo?.texto||'')
    const oferta = br.oferta_retail?.texto || ''

    const briefingTexto = [
      sustituir(br.encabezado?.texto||'Briefing — {cliente}', vars2),
      sustituir(br.historial?.texto||'{n_ordenes} órdenes | Total {total_acumulado}', vars2),
      sustituir(br.ultima_compra?.texto||'Última compra: {fecha_ultima} por {monto_ultima}', vars2),
      sustituir(br.patron?.texto||'Ticket promedio {ticket_promedio}', vars2),
      '',
      oferta,
      '',
      tono,
    ].filter(t => t !== undefined).join('\n')

    enviarMsg(briefingTexto, 'assistant')
  }

  const enviarMsg = (texto, role = 'assistant') => {
    setMsgs(p => [...p, { role, content: texto }])
    setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100)
  }

  const enviar = (texto) => {
    const q = (texto || input).trim()
    if (!q || loading) return
    setInput('')
    setMsgs(p => [...p, { role:'user', content:q }])
    setLoading(true)
    setTimeout(() => {
      const resp = responder(q)
      setMsgs(p => [...p, { role:'assistant', content:resp }])
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100)
    }, 600)
  }

  const handleKey = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <button onClick={generarBriefing}
        style={{width:'100%',padding:'11px',background:'#7c3aed',color:'white',border:'none',borderRadius:'var(--radius)',fontSize:'13px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
        🗂 Briefing rápido del top cliente
      </button>

      {msgs.length === 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          <div style={{fontSize:'11px',fontWeight:'700',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Preguntas frecuentes</div>
          {SUGERENCIAS.map(s => (
            <button key={s} onClick={() => enviar(s)}
              style={{textAlign:'left',padding:'10px 14px',background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:'var(--radius)',fontSize:'13px',color:'var(--ink)',cursor:'pointer',transition:'border-color 0.15s'}}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--brand)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              {s}
            </button>
          ))}
        </div>
      )}

      {msgs.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'10px',maxHeight:'400px',overflowY:'auto',padding:'4px 0'}}>
          {msgs.map((m,i) => (
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'85%',padding:'10px 14px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.role==='user'?'var(--brand)':'var(--white)',color:m.role==='user'?'white':'var(--ink)',fontSize:'13px',lineHeight:'1.6',border:m.role==='assistant'?'1.5px solid var(--border)':'none',whiteSpace:'pre-wrap'}}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:'flex',justifyContent:'flex-start'}}>
              <div style={{padding:'10px 14px',borderRadius:'14px 14px 14px 4px',background:'var(--white)',border:'1.5px solid var(--border)',fontSize:'13px',color:'var(--muted)'}}>
                <span style={{animation:'pulse 1s infinite',display:'inline-block'}}>●</span> <span style={{animation:'pulse 1s infinite 0.2s',display:'inline-block'}}>●</span> <span style={{animation:'pulse 1s infinite 0.4s',display:'inline-block'}}>●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Pregunta algo sobre tus ventas..."
          style={{...inputStyle,flex:1,resize:'none',minHeight:'44px',maxHeight:'120px',lineHeight:'1.5',fontSize:'14px',padding:'10px 14px'}} />
        <button onClick={() => enviar()} disabled={loading||!input.trim()}
          style={{width:'44px',height:'44px',background:loading||!input.trim()?'var(--muted)':'var(--brand)',color:'white',border:'none',borderRadius:'var(--radius)',cursor:loading||!input.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      {msgs.length > 0 && (
        <button onClick={() => setMsgs([])} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'12px',textAlign:'center',padding:'4px'}}>
          Limpiar conversación
        </button>
      )}
    </div>
  )
}


// ─── HELPERS PISTAS SELECTS ───────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// CAPTURA RÁPIDA DE PISTA
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'

export function CapturaRapida({ onClose, showToast }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!nombre.trim() || !telefono.trim()) return
    setSaving(true)
    try {
      const params = new URLSearchParams({ action: 'create', nombre: nombre.trim(), telefono: telefono.trim() })
      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()
      if (data.success) {
        showToast(`✓ Pista "${nombre}" registrada`)
        setNombre(''); setTelefono('')
        onClose()
      } else showToast(data.error || 'Error al guardar', 'error')
    } catch { showToast('Error de conexión', 'error') }
    setSaving(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter') guardar() }

  return (
    <div style={{ padding:'14px' }}>
      <input value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={handleKey}
        placeholder="Nombre completo *" autoFocus
        style={{ ...inputStyle, fontSize:'14px', marginBottom:'8px', width:'100%', boxSizing:'border-box' }} />
      <input value={telefono} onChange={e => setTelefono(e.target.value)} onKeyDown={handleKey}
        placeholder="Celular *" type="tel"
        style={{ ...inputStyle, fontSize:'14px', marginBottom:'10px', width:'100%', boxSizing:'border-box' }} />
      <button onClick={guardar} disabled={saving || !nombre.trim() || !telefono.trim()}
        style={{ width:'100%', padding:'10px', background: saving || !nombre.trim() || !telefono.trim() ? 'var(--muted)' : '#16a34a', color:'white', border:'none', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:'700', cursor: saving || !nombre.trim() || !telefono.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
        {saving ? '⏳ Guardando...' : '⚡ Guardar pista'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSOR RÁPIDO
// ─────────────────────────────────────────────────────────────────────────────
export function ConversorRapido() {
  const [raw, setRaw] = useState('') // solo dígitos y punto decimal
  const IVA = 0.15

  // Formatea el raw como $1.234,56 mientras escribe
  const fmtInput = (r) => {
    if (!r) return ''
    const partes = r.split('.')
    const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return '$' + entero + (partes.length > 1 ? ',' + partes[1] : '')
  }

  const handleChange = (e) => {
    // Extraer solo dígitos y un punto decimal del input
    const val = e.target.value.replace(/[^0-9.]/g, '')
    // Permitir solo un punto decimal
    const parts = val.split('.')
    const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val
    setRaw(clean)
  }

  const n = parseFloat(raw) || 0
  const fmt = (v) => v > 0 ? `$${v.toLocaleString('es-EC', { minimumFractionDigits:2, maximumFractionDigits:2 })}` : '—'

  const filas = [
    { label: '+ IVA 15%',     valor: n > 0 ? n * (1 + IVA) : 0 },
    { label: '− IVA (base)',  valor: n > 0 ? n / (1 + IVA) : 0 },
    { label: 'Solo IVA',      valor: n > 0 ? n * IVA : 0 },
    { label: 'Desc. 5%',      valor: n > 0 ? n * 0.95 : 0 },
    { label: 'Desc. 10%',     valor: n > 0 ? n * 0.90 : 0 },
    { label: 'Desc. 15%',     valor: n > 0 ? n * 0.85 : 0 },
    { label: 'Desc. 20%',     valor: n > 0 ? n * 0.80 : 0 },
    { label: 'Comisión 5%',   valor: n > 0 ? n * 0.05 : 0 },
    { label: 'Comisión 10%',  valor: n > 0 ? n * 0.10 : 0 },
  ]

  return (
    <div style={{ padding:'12px' }}>
      <input value={fmtInput(raw)} onChange={handleChange} placeholder="$ 0"
        inputMode="decimal" autoFocus
        style={{ ...inputStyle, fontSize:'20px', fontWeight:'800', textAlign:'right', marginBottom:'10px', width:'100%', boxSizing:'border-box', fontFamily:'var(--font-display)', letterSpacing:'-0.01em' }} />
      <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
        {filas.map(({ label, valor }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 8px', borderRadius:'6px', background: valor > 0 ? 'var(--cream)' : 'transparent' }}>
            <span style={{ fontSize:'12px', color:'var(--muted)', fontWeight:'600' }}>{label}</span>
            <span style={{ fontSize:'13px', fontWeight:'700', color: valor > 0 ? 'var(--ink)' : 'var(--border)', fontFamily:'var(--font-display)' }}>{fmt(valor)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP RÁPIDO
// ─────────────────────────────────────────────────────────────────────────────
export function WhatsAppRapido({ onClose }) {
  const [numero, setNumero] = useState('')
  const [mensaje, setMensaje] = useState('')

  const abrir = () => {
    if (!numero.trim()) return
    const limpio = numero.replace(/\D/g,'').replace(/^0/,'')
    const url = `https://wa.me/593${limpio}${mensaje.trim() ? `?text=${encodeURIComponent(mensaje.trim())}` : ''}`
    window.open(url, '_blank')
    onClose()
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) abrir() }

  return (
    <div style={{ padding:'14px' }}>
      <input value={numero} onChange={e => setNumero(e.target.value)} onKeyDown={handleKey}
        placeholder="Número de celular *" type="tel" autoFocus
        style={{ ...inputStyle, fontSize:'14px', marginBottom:'8px', width:'100%', boxSizing:'border-box' }} />
      <textarea value={mensaje} onChange={e => setMensaje(e.target.value)}
        placeholder="Mensaje (opcional)..."
        style={{ ...inputStyle, fontSize:'13px', resize:'none', minHeight:'64px', lineHeight:'1.5', marginBottom:'10px', width:'100%', boxSizing:'border-box' }} />
      <button onClick={abrir} disabled={!numero.trim()}
        style={{ width:'100%', padding:'10px', background: !numero.trim() ? 'var(--muted)' : '#16a34a', color:'white', border:'none', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:'700', cursor: !numero.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.656 1.438 5.168L2 22l4.984-1.393A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" strokeWidth="1.5"/></svg>
        Abrir WhatsApp
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULADORA FLOTANTE
// ─────────────────────────────────────────────────────────────────────────────
export function Calculadora() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [reset, setReset] = useState(false)

  const fmt = (n) => {
    const num = parseFloat(n)
    if (isNaN(num)) return '0'
    // Formatear con separador de miles (.) y decimal (,)
    const parts = num.toFixed(10).replace(/\.?0+$/, '').split('.')
    const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const decimal = parts[1] ? ',' + parts[1] : ''
    return entero + decimal
  }

  const press = (val) => {
    if (val === 'C') { setDisplay('0'); setPrev(null); setOp(null); setReset(false); return }
    if (val === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0,-1) : '0'); return }
    if (val === '%') { setDisplay(d => fmt(parseFloat(d.replace(/\./g,'').replace(',','.')) / 100)); return }
    if (val === '+/-') { setDisplay(d => fmt(parseFloat(d.replace(/\./g,'').replace(',','.')) * -1)); return }
    if (['+','-','×','÷'].includes(val)) {
      setPrev(parseFloat(display.replace(/\./g,'').replace(',','.'))); setOp(val); setReset(true); return
    }
    if (val === '=') {
      if (prev === null || !op) return
      const a = prev, b = parseFloat(display.replace(/\./g,'').replace(',','.'))
      const res = op==='+' ? a+b : op==='-' ? a-b : op==='×' ? a*b : b!==0 ? a/b : 'Error'
      setDisplay(res === 'Error' ? 'Error' : fmt(res))
      setPrev(null); setOp(null); setReset(false)
      return
    }
    if (val === ',') {
      if (reset) { setDisplay('0,'); setReset(false); return }
      setDisplay(d => d.includes(',') ? d : d + ',')
      return
    }
    setDisplay(d => {
      if (reset) { setReset(false); return val }
      const raw = d === '0' ? val : d + val
      if (raw.length > 15) return d
      // Aplicar separador de miles al parte entera
      const partes = raw.split(',')
      const entero = partes[0].replace(/\./g, '') // quitar puntos existentes
      const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return partes.length > 1 ? conPuntos + ',' + partes[1] : conPuntos
    })
  }

  const btns = [
    ['C','±','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','-'],
    ['1','2','3','+'],
    ['0',',','⌫','='],
  ]
  const opColor = '#0891b2'
  const isOp = (v) => ['÷','×','-','+','='].includes(v)
  const isGray = (v) => ['C','±','%'].includes(v)

  return (
    <div style={{ padding:'12px' }}>
      <div style={{ background:'#f1f5f9', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:'10px', textAlign:'right' }}>
        {op && prev !== null && <div style={{ fontSize:'11px', color:'var(--muted)', marginBottom:'2px' }}>{prev} {op}</div>}
        <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'26px', letterSpacing:'-0.02em', overflowX:'auto', whiteSpace:'nowrap' }}>{display}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
        {btns.flat().map((b,i) => (
          <button key={i} onClick={() => press(b)}
            style={{ padding:'14px 0', borderRadius:'var(--radius)', border:'none', fontSize:'16px', fontWeight:'700', cursor:'pointer', background: isOp(b) ? opColor : isGray(b) ? '#e2e8f0' : 'var(--cream)', color: isOp(b) ? 'white' : 'var(--ink)', transition:'opacity 0.1s', gridColumn: b==='0' ? 'span 1' : undefined }}
            onMouseDown={e => e.currentTarget.style.opacity='0.7'}
            onMouseUp={e => e.currentTarget.style.opacity='1'}
            onTouchStart={e => e.currentTarget.style.opacity='0.7'}
            onTouchEnd={e => e.currentTarget.style.opacity='1'}>
            {b === '±' ? '+/-' : b}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDARIO FLOTANTE
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarioFlotante() {
  const hoy = getNowGuayaquil()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [sel, setSel] = useState(null)

  const DIAS = ['L','M','M','J','V','S','D']
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const primerDia = new Date(anio, mes, 1).getDay() // 0=dom
  const offset = primerDia === 0 ? 6 : primerDia - 1 // lunes=0
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const prevMes = () => { if (mes === 0) { setMes(11); setAnio(a => a-1) } else setMes(m => m-1) }
  const nextMes = () => { if (mes === 11) { setMes(0); setAnio(a => a+1) } else setMes(m => m+1) }

  const isHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
  const isSel = (d) => sel && sel.d === d && sel.m === mes && sel.a === anio

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= diasEnMes; d++) cells.push(d)

  return (
    <div style={{ padding:'12px' }}>
      {/* Nav mes */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <button onClick={prevMes} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'18px', padding:'4px 8px' }}>‹</button>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'14px' }}>{MESES[mes]} {anio}</span>
        <button onClick={nextMes} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'18px', padding:'4px 8px' }}>›</button>
      </div>
      {/* Días semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
        {DIAS.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:'11px', fontWeight:'700', color:'var(--muted)', padding:'4px 0' }}>{d}</div>)}
      </div>
      {/* Celdas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((d, i) => (
          <div key={i} onClick={() => d && setSel({ d, m: mes, a: anio })}
            style={{ textAlign:'center', padding:'7px 0', borderRadius:'50%', fontSize:'13px', fontWeight: isHoy(d) ? '800' : '500', cursor: d ? 'pointer' : 'default',
              background: isSel(d) ? '#7c3aed' : isHoy(d) ? '#ede9fe' : 'transparent',
              color: isSel(d) ? 'white' : isHoy(d) ? '#7c3aed' : d ? 'var(--ink)' : 'transparent',
              transition:'background 0.1s' }}>
            {d || ''}
          </div>
        ))}
      </div>
      {/* Fecha seleccionada */}
      {sel && (
        <div style={{ marginTop:'10px', padding:'8px 12px', background:'#ede9fe', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:'600', color:'#7c3aed', textAlign:'center' }}>
          {sel.d} de {MESES[sel.m]} {sel.a}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS RÁPIDAS FLOTANTE
// ─────────────────────────────────────────────────────────────────────────────
export function NotasRapidas({ valor, onChange }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const guardarSheets = async () => {
    if (!valor.trim()) return
    setSaving(true)
    try {
      const params = new URLSearchParams({ action: 'guardarNota', nota: valor })
      await fetch(`${API_BASE}?${params}`)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  return (
    <div style={{ padding:'12px' }}>
      <textarea
        value={valor}
        onChange={e => onChange(e.target.value)}
        placeholder="Escribe aquí tu nota rápida..."
        style={{ width:'100%', minHeight:'120px', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:'14px', lineHeight:'1.6', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}
        autoFocus
      />
      <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
        <button onClick={() => onChange('')}
          style={{ flex:1, padding:'8px', background:'var(--cream)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'var(--muted)' }}>
          Limpiar
        </button>
        <button onClick={guardarSheets} disabled={saving || !valor.trim()}
          style={{ flex:2, padding:'8px', background: saved ? '#16a34a' : saving ? 'var(--muted)' : '#d97706', border:'none', borderRadius:'var(--radius)', fontSize:'12px', fontWeight:'700', cursor: saving || !valor.trim() ? 'not-allowed' : 'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          {saved ? '✓ Guardado' : saving ? '⏳ Guardando...' : '☁ Guardar en Sheets'}
        </button>
      </div>
    </div>
  )
}

export function PistaFuenteSelect({ value, onChange }) {
  const [fuentes, setFuentes] = useState([])
  useEffect(() => {
    fetch(`${API_BASE}?action=getPistasFuentes`).then(r=>r.json()).then(d=>{ if(d.success) setFuentes(d.data) }).catch(()=>{})
  }, [])
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor:'pointer', fontSize:'14px' }}>
      <option value="">— Seleccionar —</option>
      {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
    </select>
  )
}

export function PistaAccionSelect({ value, onChange }) {
  const [acciones, setAcciones] = useState([])
  useEffect(() => {
    fetch(`${API_BASE}?action=getPistasAcciones`).then(r=>r.json()).then(d=>{ if(d.success) setAcciones(d.data) }).catch(()=>{})
  }, [])
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor:'pointer', fontSize:'14px' }}>
      <option value="">— Seleccionar —</option>
      {acciones.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  )
}


import { useState, useEffect, useRef } from 'react'

export const API_BASE = '/api/proxy'

export const EMPTY_FORM = {
  nombre: '', negocio: '', identificacion: '', telefono: '',
  email: '', direccion: '', contacto: '',
  telefonoContacto: '', notas: '',
  fuente: '', potencial: '',
  fechaSeguimiento: '', horaSeguimiento: '', accionSeguimiento: '', notaSeguimiento: '',
}

export const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export const icons = {
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.09 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  map: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M6 14h.01M10 14h.01M14 14h.01M6 10h.01M10 10h.01M14 10h.01M6 6h.01M10 6h.01M14 6h.01',
  calendar: 'M3 9h18M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M8 3v4M16 3v4',
  note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  id: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2zM9 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0',
  contact: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  chevron: 'M9 18l6-6-6-6',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  menu: 'M3 12h18M3 6h18M3 18h18',
  dashboard: 'M3 3h7v7H3zM13 3h8v7h-8zM13 13h8v8h-8zM3 13h7v8H3z',
  orders: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01',
  target: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n) => '$' + (n || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })
export const norm = (s) => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
export const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export function formatFecha(raw, prefix = '') {
  if (!raw) return ''
  let d = null
  if (typeof raw === 'string' && raw.includes('T')) {
    d = new Date(raw)
  } else if (typeof raw === 'string' && raw.includes('/')) {
    const parts = raw.split(' ')[0].split('/')
    if (parts.length === 3) d = new Date(parts[2], parts[1] - 1, parts[0])
  } else if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, day] = raw.split('-')
    d = new Date(y, m - 1, day)
  } else if (raw instanceof Date) {
    d = raw
  }
  if (!d || isNaN(d)) return raw
  const dia = DIAS[d.getDay()]
  const num = d.getDate()
  const mes = MESES_LARGO[d.getMonth()]
  const anio = d.getFullYear()
  return `${prefix}${dia} ${num} de ${mes} ${anio}`
}

export function getNowGuayaquil() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }))
}

export function getTodayLabel() {
  const d = getNowGuayaquil()
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, icon, required, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--accent)', opacity: 0.7 }}><Icon d={icons[icon]} size={14} /></span>
        {label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{hint}</span>}
    </div>
  )
}

export const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--white)',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
  color: 'var(--ink)', fontSize: '15px',
  transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none',
}

export const sectionTitle = {
  fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: '16px', paddingBottom: '8px',
  borderBottom: '1px solid var(--cream)', fontFamily: 'var(--font-display)',
}

// ─── DatePicker (semana lunes→domingo) ────────────────────────────────────────
export function DatePicker({ value, onChange, placeholder = 'dd/mm/aaaa' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const today = getNowGuayaquil()
  const parsed = value ? (() => { const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d) })() : null
  const [viewYear,  setViewYear]  = useState(parsed ? parsed.getFullYear()  : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth()     : today.getMonth())

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const DIAS_CORTOS = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']
  const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const select = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2,'0')}/${String(parsed.getMonth()+1).padStart(2,'0')}/${parsed.getFullYear()}`
    : ''

  const isSelected = (d) => parsed && parsed.getFullYear()===viewYear && parsed.getMonth()===viewMonth && parsed.getDate()===d
  const isToday = (d) => today.getFullYear()===viewYear && today.getMonth()===viewMonth && today.getDate()===d

  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <div onClick={() => setOpen(v => !v)}
        style={{ ...inputStyle, padding:'7px 10px', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', userSelect:'none', background: open ? 'var(--brand-light)' : 'var(--white)', borderColor: open ? 'var(--brand)' : 'var(--border)' }}>
        <span style={{ color: displayValue ? 'var(--ink)' : 'var(--muted)' }}>{displayValue || placeholder}</span>
        <Icon d={icons.calendar} size={14} />
      </div>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:400, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:'12px', minWidth:'260px', animation:'fadeUp 0.15s ease' }}
          onMouseDown={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:'var(--radius)', color:'var(--muted)', fontSize:'16px', lineHeight:1 }}>&#8249;</button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'13px' }}>{MESES_NOMBRES[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:'var(--radius)', color:'var(--muted)', fontSize:'16px', lineHeight:1 }}>&#8250;</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
            {DIAS_CORTOS.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', fontWeight:'700', color:'var(--muted)', padding:'2px 0' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {cells.map((d, i) => d === null
              ? <div key={`e${i}`} />
              : <button key={d} onClick={() => select(d)}
                  style={{ padding:'5px 0', textAlign:'center', border:'none', borderRadius:'var(--radius)', fontSize:'12px', fontWeight: isSelected(d) ? '800' : isToday(d) ? '700' : '400', background: isSelected(d) ? 'var(--brand)' : isToday(d) ? 'var(--brand-light)' : 'transparent', color: isSelected(d) ? 'white' : isToday(d) ? 'var(--brand)' : 'var(--ink)', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e => { if (!isSelected(d)) e.currentTarget.style.background = 'var(--cream)' }}
                  onMouseLeave={e => { if (!isSelected(d)) e.currentTarget.style.background = isToday(d) ? 'var(--brand-light)' : 'transparent' }}>
                  {d}
                </button>
            )}
          </div>
          {value && (
            <button onClick={() => { onChange(''); setOpen(false) }}
              style={{ marginTop:'8px', width:'100%', padding:'6px', background:'var(--cream)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', fontSize:'11px', fontWeight:'700', color:'var(--muted)', cursor:'pointer' }}>
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, background: type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)', border: `1.5px solid ${type === 'success' ? 'var(--success)' : 'var(--error)'}`, color: type === 'success' ? 'var(--success)' : 'var(--error)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', maxWidth: '340px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s ease' }}>
      <Icon d={type === 'success' ? icons.check : icons.x} size={18} />{message}
    </div>
  )
}

// ─── Highlight ────────────────────────────────────────────────────────────────
export function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>
  const idx = norm(text.toString()).indexOf(norm(query))
  if (idx === -1) return <>{text}</>
  return <>{text.toString().slice(0, idx)}<mark style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '2px', padding: '0 2px' }}>{text.toString().slice(idx, idx + query.length)}</mark>{text.toString().slice(idx + query.length)}</>
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────
export const CARD_STYLE = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--border)',
  boxShadow: 'var(--shadow)',
  padding: '16px',
}

export const CARD_STYLE_COMPACT = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--border)',
  boxShadow: 'var(--shadow)',
  padding: '12px',
}

export const BTN_PRIMARY = {
  background: 'var(--brand)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius)',
  padding: '10px 18px',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
}

export const BTN_GHOST = {
  background: 'none',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 14px',
  fontWeight: '600',
  fontSize: '13px',
  cursor: 'pointer',
  color: 'var(--ink)',
  transition: 'border-color 0.2s',
}

export const BTN_DANGER = {
  background: 'var(--error-bg)',
  color: 'var(--error)',
  border: '1.5px solid var(--error)',
  borderRadius: 'var(--radius)',
  padding: '8px 14px',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
}

export const SECTION_HEADER = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontFamily: 'var(--font-display)',
}

export const BADGE_BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 10px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.04em',
}

export const PILL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.15s',
}

export const FLOAT_PANEL = {
  position: 'fixed',
  bottom: '100px',
  right: '20px',
  zIndex: 700,
  background: 'var(--white)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
  overflow: 'hidden',
  animation: 'fadeUp 0.2s ease',
}

// ─── Formato de dinero con decimales ─────────────────────────────────────────
export const fmtMoney = (n) => `$${(parseFloat(n)||0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`

// ─── Colores por estado de orden ──────────────────────────────────────────────
export const ESTADO_COLORS = {
  Vendido:    { bg:'#dcfce7', color:'#166534', border:'#16a34a' },
  Negociando: { bg:'#dbeafe', color:'#1e40af', border:'#2563eb' },
  Detenido:   { bg:'#fef9c3', color:'#854d0e', border:'#ca8a04' },
  Perdido:    { bg:'#fee2e2', color:'#991b1b', border:'#dc2626' },
  Pista:      { bg:'#f3e8ff', color:'#6b21a8', border:'#9333ea' },
}

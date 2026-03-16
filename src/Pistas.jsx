import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'

export function PistasView({ onViewPista }) {
  const [pistas, setPistas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}?action=getPistas`)
      .then(r => r.json())
      .then(d => { if (d.success) setPistas(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? pistas.filter(p => norm(p.nombre).includes(norm(search)) || norm(p.negocio).includes(norm(search)) || norm(p.telefono).includes(norm(search)))
    : pistas

  const potencialColor = (p) => p === 'Alto' ? '#16a34a' : p === 'Medio' ? '#d97706' : p === 'Bajo' ? '#dc2626' : 'var(--muted)'
  const potencialBg    = (p) => p === 'Alto' ? '#f0fdf4' : p === 'Medio' ? '#fffbeb' : p === 'Bajo' ? '#fef2f2' : 'var(--cream)'

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', letterSpacing: '-0.02em' }}>Pistas</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{pistas.length} {pistas.length === 1 ? 'pista' : 'pistas'} activas</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><Icon d={icons.search} size={16} /></span>
        <input type="text" placeholder="Buscar por nombre, negocio o teléfono..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: '42px', paddingRight: search ? '42px' : '14px', fontSize: '14px' }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '2px' }}><Icon d={icons.x} size={16} /></button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}><div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>Cargando pistas...</div>
      ) : !search.trim() ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '6px' }}>Escribe para buscar</div>
          <div style={{ fontSize: '14px' }}>Busca por nombre, negocio o teléfono</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>😕</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700' }}>Sin resultados para "{search}"</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((p, i) => (
            <div key={p.rowIndex} onClick={() => onViewPista(p)}
              style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s', animation: `fadeUp 0.2s ${Math.min(i,5)*0.04}s ease both` }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

              {/* Tarjeta blanca — datos del contacto */}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  {/* Izquierda */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{p.nombre}</div>
                    {p.negocio   && <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '2px' }}>{p.negocio}</div>}
                    {p.telefono  && <div style={{ fontSize: '13px', color: '#16a34a', marginBottom: '2px' }}><a href={`https://wa.me/593${p.telefono.toString().replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#16a34a', textDecoration: 'none', fontWeight: '600' }}>📞 {p.telefono}</a></div>}
                    {p.email     && <div style={{ fontSize: '13px', color: 'var(--ink)' }}>✉️ {p.email}</div>}
                  </div>
                  {/* Derecha */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    {p.potencial && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: potencialColor(p.potencial), background: potencialBg(p.potencial), padding: '2px 8px', borderRadius: '20px' }}>
                        {p.potencial}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {p.diasEnPista} {p.diasEnPista === 1 ? 'día' : 'días'} en pista
                    </span>
                  </div>
                </div>
                {p.notas && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', lineHeight: '1.5', borderTop: '1px solid var(--cream)', paddingTop: '8px' }}>
                    {p.notas}
                  </div>
                )}
              </div>

              {/* Tarjeta negra — seguimiento */}
              {(p.fechaSeguimiento || p.accionSeguimiento || p.notaSeguimiento) && (
                <div style={{ background: '#1a1a2e', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {p.fechaSeguimiento && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>
                      📅 {p.fechaSeguimiento}{p.horaSeguimiento ? ` · ${p.horaSeguimiento}` : ''}
                    </div>
                  )}
                  {p.accionSeguimiento && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
                      {p.accionSeguimiento}
                    </div>
                  )}
                  {p.notaSeguimiento && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginTop: '2px' }}>
                      {p.notaSeguimiento}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW PISTA
// ─────────────────────────────────────────────────────────────────────────────
export function ViewPista({ pista, onBack, onEdit, showToast, backLabel = 'Volver a pistas' }) {
  const potencialColor = (p) => p === 'Alto' ? '#16a34a' : p === 'Medio' ? '#d97706' : p === 'Bajo' ? '#dc2626' : 'var(--muted)'
  const potencialBg    = (p) => p === 'Alto' ? '#f0fdf4' : p === 'Medio' ? '#fffbeb' : p === 'Bajo' ? '#fef2f2' : 'var(--cream)'

  // Calcular días en pista: usar diasEnPista si viene, si no calcular desde fechaRegistro
  const calcDias = () => {
    if (pista.diasEnPista !== undefined && pista.diasEnPista !== null) return pista.diasEnPista
    if (!pista.fechaRegistro) return null
    const partes = pista.fechaRegistro.toString().split(' ')[0].split('/')
    if (partes.length < 3) return null
    const registro = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]))
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    return Math.max(0, Math.floor((hoy - registro) / 86400000))
  }
  const dias = calcDias()

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>

      {/* Volver + botón Editar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0' }}>
          <Icon d={icons.arrowLeft} size={15} /> {backLabel}
        </button>
        <button onClick={onEdit}
          style={{ padding: '8px 16px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          ✏️ Editar
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>

        {/* Tarjeta blanca — contacto */}
        <div style={{ background: 'var(--white)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            {/* Izquierda */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.01em', marginBottom: '4px' }}>{pista.nombre}</div>
              {pista.negocio   && <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>{pista.negocio}</div>}
              {pista.telefono  && (
                <a href={`https://wa.me/593${pista.telefono.toString().replace(/\D/g,'').replace(/^0/,'')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: '14px', color: '#16a34a', textDecoration: 'none', marginBottom: '3px', fontWeight: '600' }}>
                  📞 {pista.telefono}
                </a>
              )}
              {pista.email     && (
                <a href={`mailto:${pista.email}`}
                  style={{ display: 'block', fontSize: '13px', color: 'var(--brand)', textDecoration: 'none' }}>
                  ✉️ {pista.email}
                </a>
              )}
            </div>
            {/* Derecha */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
              {pista.potencial ? (
                <span style={{ fontSize: '12px', fontWeight: '700', color: potencialColor(pista.potencial), background: potencialBg(pista.potencial), padding: '3px 10px', borderRadius: '20px' }}>
                  {pista.potencial}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--border)' }}>Sin potencial</span>
              )}
              {dias !== null && (
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  {dias} {dias === 1 ? 'día' : 'días'} en pista
                </span>
              )}            </div>
          </div>

          {/* Notas */}
          {pista.notas && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--cream)', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
              {pista.notas}
            </div>
          )}
        </div>

        {/* Tarjeta negra — seguimiento */}
        <div style={{ background: '#1a1a2e', padding: '18px 20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Seguimiento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(pista.fechaSeguimiento || pista.horaSeguimiento) && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {pista.fechaSeguimiento && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Fecha</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24' }}>{pista.fechaSeguimiento}</div>
                  </div>
                )}
                {pista.horaSeguimiento && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Hora</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24' }}>{pista.horaSeguimiento}</div>
                  </div>
                )}
              </div>
            )}
            {pista.accionSeguimiento && (
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: '2px' }}>
                {pista.accionSeguimiento}
              </div>
            )}
            {pista.notaSeguimiento && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: '1.5', marginTop: '2px' }}>
                {pista.notaSeguimiento}
              </div>
            )}
            {!pista.fechaSeguimiento && !pista.accionSeguimiento && !pista.notaSeguimiento && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Sin seguimiento programado</div>
            )}
          </div>
        </div>
      </div>

      {/* Fecha de registro */}
      {pista.fechaRegistro && (
        <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '16px' }}>
          Registrado el {pista.fechaRegistro}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT PISTA
// ─────────────────────────────────────────────────────────────────────────────
export function EditPista({ pista, onSave, onCancel, showToast }) {
  const [form, setForm] = useState({
    nombre: pista.nombre || '',
    negocio: pista.negocio || '',
    identificacion: pista.identificacion || '',
    telefono: pista.telefono || '',
    email: pista.email || '',
    direccion: pista.direccion || '',
    contacto: pista.contacto || '',
    telefonoContacto: pista.telefonoContacto || '',
    notas: pista.notas || '',
    fuente: pista.fuente || '',
    potencial: pista.potencial || '',
    fechaSeguimiento: pista.fechaSeguimiento || '',
    horaSeguimiento: pista.horaSeguimiento || '',
    accionSeguimiento: pista.accionSeguimiento || '',
    notaSeguimiento: pista.notaSeguimiento || '',
  })
  const [fuentes, setFuentes] = useState([])
  const [acciones, setAcciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_BASE}?action=getPistasFuentes`).then(r => r.json()).then(d => { if (d.success) setFuentes(d.data) }).catch(() => {})
    fetch(`${API_BASE}?action=getPistasAcciones`).then(r => r.json()).then(d => { if (d.success) setAcciones(d.data) }).catch(() => {})
  }, [])

  const set = (field) => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) })

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ action: 'update', rowIndex: pista.rowIndex, ...form })
      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()
      if (data.success) {
        showToast(`✓ ${form.nombre} actualizado`)
        onSave({ ...pista, ...form })
      } else {
        showToast('Error al guardar', 'error')
      }
    } catch { showToast('Error de conexión', 'error') }
    setLoading(false)
  }



  // fechaParaInput convierte dd/MM/yyyy a yyyy-MM-dd
  const fechaParaInput = (v) => {
    if (!v) return ''
    // Tomar solo la parte de fecha (dd/MM/yyyy), ignorar hora
    const parte = v.toString().trim().split(' ')[0]
    if (parte.includes('/')) { const [d,m,y] = parte.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }
    return v
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '4px' }}><Icon d={icons.back} size={20} /></button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '24px', letterSpacing: '-0.02em', margin: 0 }}>Editar pista</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Datos básicos */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Datos del contacto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nombre completo *</div>
              <input {...set('nombre')} style={{ ...inputStyle, fontSize: '14px' }} />
              {errors.nombre && <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px' }}>{errors.nombre}</div>}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Identificación</div>
              <input {...set('identificacion')} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Teléfono *</div>
              <input {...set('telefono')} type="tel" style={{ ...inputStyle, fontSize: '14px' }} />
              {errors.telefono && <div style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px' }}>{errors.telefono}</div>}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Email</div>
              <input {...set('email')} type="email" style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Negocio</div>
              <input {...set('negocio')} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Dirección</div>
              <input {...set('direccion')} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Contacto</div>
              <input {...set('contacto')} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Teléfono de contacto</div>
              <input {...set('telefonoContacto')} type="tel" style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notas / Comentarios</div>
              <textarea {...set('notas')} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Fuente y potencial */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>Calificación de la pista</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fuente de contacto</div>
              <select {...set('fuente')} style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                <option value="">— Seleccionar —</option>
                {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Potencial</div>
              <select {...set('potencial')} style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                <option value="">— Seleccionar —</option>
                {['Alto','Medio','Bajo'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Seguimiento */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon d={icons.calendar} size={13} />Seguimiento de pista
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fecha de seguimiento</div>
              <input type="date" value={fechaParaInput(form.fechaSeguimiento)}
                onChange={e => {
                  const iso = e.target.value
                  if (!iso) { setForm(p => ({ ...p, fechaSeguimiento: '' })); return }
                  const [y,m,d] = iso.split('-')
                  setForm(p => ({ ...p, fechaSeguimiento: `${d}/${m}/${y}` }))
                }}
                style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Hora de seguimiento</div>
              <input type="time" value={form.horaSeguimiento || ''}
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, horaSeguimiento: v })) }}
                style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Acción de seguimiento</div>
                <select {...set('accionSeguimiento')} style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                  <option value="">— Seleccionar —</option>
                  {acciones.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nota de seguimiento</div>
            <textarea value={form.notaSeguimiento || ''} placeholder="Detalles del seguimiento, acuerdos, próximos pasos..."
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, notaSeguimiento: v })) }}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Botones Cancelar + Guardar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', background: 'var(--cream)', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading}
            style={{ flex: 2, padding: '13px', background: loading ? 'var(--muted)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Guardando...</> : <><Icon d={icons.check} size={16} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}



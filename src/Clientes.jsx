import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'

export function ClientRow({ client, index, onEdit, onView, query }) {
  return (
    <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeUp 0.2s ${Math.min(index, 5) * 0.04}s ease both`, transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
          {client.nombre?.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Highlight text={client.nombre} query={query} />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Highlight text={client.negocio || '—'} query={query} /> · {client.telefono}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
        <button onClick={() => onView(client)}
          style={{ background: 'var(--cream)', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--cream)'}>
          <Icon d={icons.eye} size={13} /> Ver
        </button>
        <button onClick={() => onEdit(client)}
          style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-dark)'}>
          <Icon d={icons.edit} size={13} /> Editar
        </button>
      </div>
    </div>
  )
}

// ─── ViewClient ───────────────────────────────────────────────────────────────
export function ViewClient({ client, onEdit, onBack, onViewOrder }) {
  const fields = [
    { icon: 'id',      label: 'Identificación', val: client.identificacion },
    { icon: 'phone',   label: 'Teléfono',        val: client.telefono },
    { icon: 'mail',    label: 'Email',            val: client.email },
    { icon: 'map',     label: 'Dirección',        val: client.direccion },
    { icon: 'contact', label: 'Contacto',         val: client.contacto },
    { icon: 'phone',   label: 'Tel. Contacto',    val: client.telefonoContacto },
  ]

  const [ordenes, setOrdenes] = useState([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('Vendido')
  const [sortField, setSortField] = useState('fecha')
  const [sortDir, setSortDir] = useState('desc')

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }

  const totalPorEstado = (e) => ordenes.filter(o => o.estado === e).reduce((s, o) => s + (parseFloat(o.total)||0), 0)

  useEffect(() => {
    fetch(`${API_BASE}?action=getOrdenes`)
      .then(r => r.json())
      .then(d => { if (d.success) setOrdenes(d.data.filter(o => norm(o.clienteNombre) === norm(client.nombre))) })
      .catch(() => {})
      .finally(() => setLoadingOrdenes(false))
  }, [])

  const cntEstado = (e) => ordenes.filter(o => o.estado === e).length

  const parseF = (v) => {
    if (!v) return new Date(0)
    const str = v.toString().trim()
    if (str.includes('/')) { const [dp] = str.split(' '); const [d,m,y] = dp.split('/'); return new Date(y,m-1,d) }
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str)
    return new Date(0)
  }

  const ordenesFiltradas = useMemo(() => {
    const list = ordenes.filter(o => o.estado === filtroEstado)
    return [...list].sort((a, b) => {
      if (sortField === 'fecha') {
        const fa = parseF(a.fecha), fb = parseF(b.fecha)
        return sortDir === 'desc' ? fb - fa : fa - fb
      }
      return sortDir === 'desc' ? (parseFloat(b.total)||0) - (parseFloat(a.total)||0) : (parseFloat(a.total)||0) - (parseFloat(b.total)||0)
    })
  }, [ordenes, filtroEstado, sortDir, sortField])

  const totalFiltrado = ordenesFiltradas.reduce((s, o) => s + (parseFloat(o.total)||0), 0)
  const [listaVisible, setListaVisible] = useState(false)

  const handleCuadro = (e) => {
    if (filtroEstado === e) setListaVisible(v => !v)
    else { setFiltroEstado(e); setListaVisible(true) }
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Back */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginBottom: '24px' }}>
        <Icon d={icons.arrowLeft} size={15} /> Volver a clientes
      </button>

      {/* Header del cliente */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px' }}>
              {client.nombre?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '22px', letterSpacing: '-0.01em', margin: 0 }}>{client.nombre}</h1>
              {client.negocio && <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>{client.negocio}</div>}
            </div>
          </div>
          <button onClick={() => onEdit(client)}
            style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-dark)'}>
            <Icon d={icons.edit} size={14} /> Editar
          </button>
        </div>

        {/* Campos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
          {fields.map(({ icon, label, val }) => val ? (
            <div key={label}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon d={icons[icon]} size={12} />{label}
              </div>
              {label === 'Dirección' ? (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '14px', fontWeight: '500', color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  {val} <Icon d={icons.map} size={13} />
                </a>
              ) : label === 'Teléfono' || label === 'Tel. Contacto' ? (
                <a href={`https://wa.me/593${val.toString().replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  <Icon d={icons.phone} size={13} />{val}
                </a>
              ) : label === 'Email' ? (
                <a href={`mailto:${val}`}
                  style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  <Icon d={icons.mail} size={13} />{val}
                </a>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{val}</div>
              )}
            </div>
          ) : null)}
        </div>

        <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--border)' }}>
          {formatFecha(client.fechaRegistro, 'Registrado ')}
        </div>
      </div>

      {/* Notas */}
      {client.notas && (
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon d={icons.note} size={13} />Notas
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.6', fontStyle: 'italic' }}>"{client.notas}"</div>
        </div>
      )}

      {/* Órdenes del cliente */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px' }}>Órdenes</div>
          <div style={{ display: 'flex', gap: '6px', opacity: listaVisible ? 1 : 0.4, pointerEvents: listaVisible ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            {[['fecha','Fecha'],['total','$']].map(([field, label]) => {
              const active = sortField === field
              const arrow = sortDir === 'asc' ? '↑' : '↓'
              return (
                <button key={field} onClick={() => toggleSort(field)}
                  style={{ padding: '4px 11px', borderRadius: '20px', border: `1.5px solid ${active ? 'var(--brand)' : 'var(--border)'}`, background: active ? 'var(--brand-light)' : 'var(--white)', color: active ? 'var(--brand)' : 'var(--muted)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {label} {active ? arrow : '↕'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filtros de estado — solo los recuadros con totales */}

        {loadingOrdenes ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '13px' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Cargando órdenes...
          </div>
        ) : (
          <>
            {/* Totales por estado */}
            {!loadingOrdenes && ordenes.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
                {['Vendido','Negociando','Detenido','Perdido'].map(e => {
                  const c = ESTADO_COLORS[e]
                  const activo = filtroEstado === e
                  return (
                    <div key={e} onClick={() => handleCuadro(e)} style={{ background: activo && listaVisible ? c.bg : activo ? c.bg : 'var(--cream)', border: `1.5px solid ${activo ? c.border : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '8px 10px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: activo ? c.color : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{e}</div>
                        {activo && <span style={{ fontSize: '10px', color: c.color, transition: 'transform 0.2s', display: 'inline-block', transform: listaVisible ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: activo ? c.color : 'var(--ink)' }}>{fmtMoney(totalPorEstado(e))}</div>
                      <div style={{ fontSize: '10px', color: activo ? c.color : 'var(--muted)', marginTop: '1px' }}>{cntEstado(e)} {cntEstado(e) === 1 ? 'orden' : 'órdenes'}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {listaVisible && (ordenesFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600' }}>Sin órdenes en estado {filtroEstado}</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ordenesFiltradas.map((o, i) => {
                    const c = ESTADO_COLORS[o.estado]
                    return (
                      <div key={o.numOrden}
                        onClick={() => onViewOrder(o)}
                        style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', animation: `fadeUp 0.2s ${Math.min(i,5)*0.04}s ease both` }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', marginBottom: '2px' }}>{o.numOrden} · {formatFecha(o.fecha)}</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {(o.items||[]).slice(0,2).map((item, j) => (
                              <span key={j} style={{ fontSize: '12px', color: 'var(--ink)', background: 'var(--cream)', padding: '1px 7px', borderRadius: '20px' }}>{item.nombre}</span>
                            ))}
                            {(o.items||[]).length > 2 && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>+{o.items.length - 2} más</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '15px' }}>{fmtMoney(o.total)}</div>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{o.estado}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--cream)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                  <span style={{ color: 'var(--muted)' }}>{ordenesFiltradas.length} {ordenesFiltradas.length === 1 ? 'orden' : 'órdenes'}</span>
                  <span>{fmtMoney(totalFiltrado)}</span>
                </div>
              </>
            ))}
          </>
        )}
      </div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginTop: '8px' }}>
        <Icon d={icons.arrowLeft} size={15} /> Volver a clientes
      </button>
    </div>
  )
}

// ─── EditForm ─────────────────────────────────────────────────────────────────
export function EditForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({ nombre: client.nombre || '', negocio: client.negocio || '', identificacion: client.identificacion || '', telefono: client.telefono || '', email: client.email || '', direccion: client.direccion || '', contacto: client.contacto || '', telefonoContacto: client.telefonoContacto || '', notas: client.notas || '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const inp = (f, v) => { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(e => ({ ...e, [f]: null })) }
  const gs = (f) => ({ ...inputStyle, borderColor: errors[f] ? 'var(--accent)' : focusedField === f ? 'var(--brand)' : 'var(--border)', boxShadow: focusedField === f ? '0 0 0 3px rgba(30,58,95,0.12)' : 'none' })
  const fp = (f, x = {}) => ({ style: gs(f), value: form[f], onChange: e => inp(f, e.target.value), onFocus: () => setFocusedField(f), onBlur: () => setFocusedField(null), ...x })

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Obligatorio'
    if (!form.telefono.trim()) e.telefono = 'Obligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ ...form, action: 'update', rowIndex: client.rowIndex })
      const res = await fetch(`${API_BASE}?${params.toString()}`)
      const data = await res.json()
      if (data.success) onSave({ ...client, ...form })
      else alert(data.error || 'Error al actualizar')
    } catch { alert('Error de conexión') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '32px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginBottom: '16px' }}>
          <Icon d={icons.arrowLeft} size={15} /> Volver a clientes
        </button>
        <div style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', marginBottom: '10px' }}>Editando cliente</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{client.nombre}</h1>
      </div>
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: 'var(--shadow)' }}>
        <div>
          <div style={sectionTitle}>Datos del cliente</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nombre completo" icon="user" required><input {...fp('nombre')} placeholder="Ej: María López" />{errors.nombre && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{errors.nombre}</span>}</Field>
            <Field label="Identificación" icon="id" hint="Cédula o RUC"><input {...fp('identificacion')} placeholder="Ej: 0912345678" /></Field>
            <Field label="Teléfono" icon="phone" required><input {...fp('telefono', { type: 'tel' })} placeholder="Ej: 0997002220" />{errors.telefono && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{errors.telefono}</span>}</Field>
            <Field label="Email" icon="mail"><input {...fp('email', { type: 'email' })} placeholder="correo@ejemplo.com" />{errors.email && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{errors.email}</span>}</Field>
          </div>
        </div>
        <div>
          <div style={sectionTitle}>Datos del negocio</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nombre del negocio" icon="store"><input {...fp('negocio')} placeholder="Ej: Farmacia del Parque" /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Dirección" icon="map"><input {...fp('direccion')} placeholder="Calle, número, ciudad" /></Field></div>
          </div>
        </div>
        <div>
          <div style={sectionTitle}>Persona de contacto</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Contacto" icon="contact"><input {...fp('contacto')} placeholder="Nombre del contacto" /></Field>
            <Field label="Teléfono de contacto" icon="phone"><input {...fp('telefonoContacto', { type: 'tel' })} placeholder="Ej: 0987654321" /></Field>
          </div>
        </div>
        <div>
          <div style={sectionTitle}>Notas / Comentarios</div>
          <Field label="Notas / Comentarios" icon="note">
            <textarea {...fp('notas')} placeholder="Observaciones del cliente..." style={{ ...gs('notas'), resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px' }} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', background: 'var(--cream)', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '13px', background: loading ? 'var(--muted)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-dark)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-dark)' }}>
            {loading ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Guardando...</> : <><Icon d={icons.check} size={16} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Formato moneda ───────────────────────────────────────────────────────────
const fmtMoney = (n) => '$' + (parseFloat(n)||0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Badge de estado ──────────────────────────────────────────────────────────
const ESTADO_COLORS = {
  'Negociando': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Detenido':   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Perdido':    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Vendido':    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Pista':      { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
}



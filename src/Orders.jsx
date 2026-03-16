import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, fmtMoney, ESTADO_COLORS } from './shared.jsx'

export function EstadoBadge({ estado }) {
  const c = ESTADO_COLORS[estado] || { bg: 'var(--cream)', color: 'var(--muted)', border: 'var(--border)' }
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em' }}>
      {estado}
    </span>
  )
}

export function OrderRow({ order, index, onView }) {
  return (
    <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeUp 0.2s ${Math.min(index,5)*0.04}s ease both`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={() => onView(order)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>{order.numOrden}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.clienteNombre}</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '3px' }}>{order.clienteNegocio || '—'} · {formatFecha(order.fecha)}</div>
        {order.clienteTelefono && (
          <a href={`https://wa.me/593${order.clienteTelefono.replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#16a34a', textDecoration: 'none', marginRight: '10px' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            <Icon d={icons.phone} size={12} />{order.clienteTelefono}
          </a>
        )}
        {order.clienteEmail && (
          <a href={`mailto:${order.clienteEmail}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--brand)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            <Icon d={icons.mail} size={12} />{order.clienteEmail}
          </a>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
        <EstadoBadge estado={order.estado} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px' }}>{fmtMoney(order.total)}</div>
      </div>
    </div>
  )
}

export function ViewOrder({ order, onBack, onChangeEstado, showToast, backLabel = 'Volver a órdenes' }) {
  const [estado, setEstado] = useState(order.estado)
  const [saving, setSaving] = useState(false)
  const [notas, setNotas] = useState(order.notas || '')
  const [siguienteAccionFecha, setSiguienteAccionFecha] = useState(order.siguienteAccionFecha || '')
  const [horaAccion, setHoraAccion] = useState(() => {
    // Extraer hora si viene en formato "dd/MM/yyyy HH:mm"
    const v = order.siguienteAccionFecha || ''
    if (v.includes(' ')) return v.split(' ')[1] || ''
    return ''
  })
  const [accion, setAccion] = useState(order.accion || '')
  const [notasSeguimiento, setNotasSeguimiento] = useState(order.notasSeguimiento || '')
  const [acciones, setAcciones] = useState([])
  const [savingDetalle, setSavingDetalle] = useState(false)
  const [editNotas, setEditNotas] = useState(false)
  const [editSeguimiento, setEditSeguimiento] = useState(false)
  const [facturacion, setFacturacion] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}?action=getFacturacion`)
      .then(r => r.json())
      .then(d => { if (d.success) setFacturacion(d.data) })
      .catch(() => {})
    fetch(`${API_BASE}?action=getAcciones`)
      .then(r => r.json())
      .then(d => { if (d.success) setAcciones(d.data) })
      .catch(() => {})
  }, [])

  const [ordenesCliente, setOrdenesCliente] = useState([])
  const [filtroOC, setFiltroOC]     = useState('Vendido')
  const [listaOC, setListaOC]       = useState(false)
  const [sortFieldOC, setSortFieldOC] = useState('fecha')
  const [sortDirOC, setSortDirOC]   = useState('desc')
  useEffect(() => {
    fetch(`${API_BASE}?action=getOrdenes`)
      .then(r => r.json())
      .then(d => { if (d.success) setOrdenesCliente(d.data.filter(o => norm(o.clienteNombre) === norm(order.clienteNombre))) })
      .catch(() => {})
  }, [])

  const handleEstado = async (nuevoEstado) => {
    setSaving(true)
    try {
      const params = new URLSearchParams({ action: 'updateOrdenEstado', rowIndex: order.rowIndex, estado: nuevoEstado })
      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()
      if (data.success) { setEstado(nuevoEstado); onChangeEstado(order.rowIndex, nuevoEstado) }
    } catch {}
    finally { setSaving(false) }
  }

  const handleSaveDetalle = async () => {
    setSavingDetalle(true)
    try {
      const soloFecha = siguienteAccionFecha ? siguienteAccionFecha.split(' ')[0] : ''
      const fechaHora = soloFecha ? (horaAccion ? soloFecha + ' ' + horaAccion : soloFecha) : ''
      const params = new URLSearchParams({ action: 'updateOrdenDetalle', rowIndex: order.rowIndex, notas, siguienteAccionFecha: fechaHora, accion, notasSeguimiento })
      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()
      if (data.success) {
        setSiguienteAccionFecha(fechaHora) // sincronizar estado local con lo guardado
        showToast('✓ Guardado')
      } else showToast(data.error || 'Error al guardar', 'error')
    } catch { showToast('Error de conexión', 'error') }
    finally { setSavingDetalle(false) }
  }

  // Convertir fecha almacenada (dd/MM/yyyy) a yyyy-MM-dd para input date
  const fechaParaInput = (v) => {
    if (!v) return ''
    const solo = v.toString().trim().split(' ')[0] // quitar hora si viene "dd/MM/yyyy HH:mm"
    if (/^\d{4}-\d{2}-\d{2}$/.test(solo)) return solo
    if (solo.includes('/')) {
      const p = solo.split('/')
      if (p.length === 3) return `${p[2].padStart(4,'0')}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
    }
    return ''
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginBottom: '24px' }}>
        <Icon d={icons.arrowLeft} size={15} /> {backLabel}
      </button>
      {/* Encabezado + estado */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600', marginBottom: '4px' }}>{order.numOrden}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '20px' }}>{order.clienteNombre}</div>
            {order.clienteNegocio && <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{order.clienteNegocio}</div>}
            {order.clienteTelefono && (
              <a href={`https://wa.me/593${order.clienteTelefono.replace(/\D/g,'').replace(/^0/,'')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '13px', fontWeight: '600', color: '#16a34a', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                <Icon d={icons.phone} size={13} />{order.clienteTelefono}
              </a>
            )}
            {order.clienteEmail && (
              <a href={`mailto:${order.clienteEmail}`}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--brand)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                <Icon d={icons.mail} size={13} />{order.clienteEmail}
              </a>
            )}
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>{formatFecha(order.fecha)}</div>
          </div>
          <EstadoBadge estado={estado} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Cambiar estado</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Negociando','Detenido','Perdido','Vendido'].map(e => {
              const c = ESTADO_COLORS[e]; const activo = estado === e
              return <button key={e} onClick={() => !activo && handleEstado(e)} disabled={saving} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${activo ? c.color : 'var(--border)'}`, background: activo ? c.bg : 'var(--white)', color: activo ? c.color : 'var(--muted)', fontSize: '12px', fontWeight: '700', cursor: activo ? 'default' : 'pointer', transition: 'all 0.15s' }}>{e}</button>
            })}
          </div>
        </div>
      </div>
      {/* Productos */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Productos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(order.items||[]).map((item, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--cream)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{item.nombre}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {item.cantidad} × {fmtMoney(item.precioUnitario)}{item.descuento > 0 && ` · Desc. ${item.descuento}%`}{item.iva > 0 && ` · IVA ${item.iva}%`}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '15px', flexShrink: 0 }}>{fmtMoney(item.total)}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)' }}><span>Subtotal sin IVA</span><span>{fmtMoney(order.totalSinIva)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)' }}><span>IVA</span><span>{fmtMoney(order.totalIva)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: '800' }}><span>Total</span><span>{fmtMoney(order.total)}</span></div>
        </div>
      </div>

      {/* Enviar para facturar — solo Vendido */}
      {facturacion && estado === 'Vendido' && (() => {
        const lineasProductos = (order.items||[]).map(item =>
          `• ${item.nombre} x${item.cantidad}  ${fmtMoney(item.total)}`
        ).join('\n')

        const mensaje =
`Cliente: ${order.clienteNombre}
Identificación: ${order.clienteIdentificacion || '—'}
Teléfono: ${order.clienteTelefono || '—'}
Dirección: ${order.clienteDireccion || '—'}

--- Orden ${order.numOrden} ---
${lineasProductos}

Subtotal sin IVA:  ${fmtMoney(order.totalSinIva)}
IVA:               ${fmtMoney(order.totalIva)}
Total:             ${fmtMoney(order.total)}`

        const waLink    = `https://wa.me/${facturacion.celular}?text=${encodeURIComponent(mensaje)}`
        const emailLink = `mailto:${facturacion.email}?subject=${encodeURIComponent(`Orden ${order.numOrden} — ${order.clienteNombre}`)}&body=${encodeURIComponent(mensaje)}`

        return (
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon d={icons.mail} size={13} /> Enviar datos de la orden para facturar
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'11px 16px', background:'#22c55e', color:'white', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:'700', textDecoration:'none', boxShadow:'var(--shadow)', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#16a34a'}
                onMouseLeave={e => e.currentTarget.style.background='#22c55e'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar por WhatsApp
              </a>
              <a href={emailLink}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'11px 16px', background:'var(--brand)', color:'white', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:'700', textDecoration:'none', boxShadow:'var(--shadow)', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--brand-dark)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--brand)'}>
                <Icon d={icons.mail} size={16} />
                Enviar por Email
              </a>
            </div>
          </div>
        )
      })()}

      {/* Notas */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon d={icons.note} size={13} />Notas de la orden</div>
          <button onClick={() => setEditNotas(v => !v)} style={{ background: 'none', border: `1.5px solid ${editNotas ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '11px', fontWeight: '700', color: editNotas ? 'var(--brand)' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
            {editNotas ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        {editNotas
          ? <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas de la orden..." autoFocus
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
          : notas
            ? <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--muted)', lineHeight: '1.6' }}>"{notas}"</div>
            : <div style={{ fontSize: '13px', color: 'var(--border)' }}>Sin notas</div>
        }
      </div>
      {/* Seguimiento */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon d={icons.calendar} size={13} />Seguimiento</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {siguienteAccionFecha && !editSeguimiento && (() => {
              // Armar fechas para Google Calendar (formato YYYYMMDDTHHmmss)
              const soloFecha = siguienteAccionFecha.toString().trim().split(' ')[0]
              let dateStr = ''
              if (soloFecha.includes('/')) {
                const [d, m, y] = soloFecha.split('/')
                dateStr = `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}`
              } else if (soloFecha.includes('-')) {
                dateStr = soloFecha.replace(/-/g, '')
              }
              const [hh, mm] = horaAccion ? horaAccion.split(':') : ['09', '00']
              const startDT = `${dateStr}T${hh.padStart(2,'0')}${mm.padStart(2,'0')}00`
              // Evento de 1 hora por defecto
              const endHH = String(parseInt(hh) + 1).padStart(2, '0')
              const endDT = `${dateStr}T${endHH}${mm.padStart(2,'0')}00`
              const titulo = encodeURIComponent(`${accion} — ${order.clienteNombre}`)
              const detalle = encodeURIComponent(`Orden: ${order.numOrden}\nCliente: ${order.clienteNombre}${order.clienteNegocio ? '\nNegocio: ' + order.clienteNegocio : ''}${notasSeguimiento ? '\n\n' + notasSeguimiento : ''}`)
              const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${startDT}/${endDT}&details=${detalle}`
              return (
                <a href={calUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#4285f4', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: '700', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a73e8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4285f4'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                  Agendar
                </a>
              )
            })()}
            <button onClick={() => setEditSeguimiento(v => !v)} style={{ background: 'none', border: `1.5px solid ${editSeguimiento ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '11px', fontWeight: '700', color: editSeguimiento ? 'var(--brand)' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {editSeguimiento ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>
        {editSeguimiento ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Siguiente acción (fecha)</div>
                <input type="date" value={fechaParaInput(siguienteAccionFecha)}
                  onChange={e => {
                    const iso = e.target.value
                    if (!iso) { setSiguienteAccionFecha(''); return }
                    const [y, m, d] = iso.split('-')
                    setSiguienteAccionFecha(`${d}/${m}/${y}`)
                  }}
                  style={{ ...inputStyle, fontSize: '14px' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Hora</div>
                <input type="time" value={horaAccion} onChange={e => setHoraAccion(e.target.value)} style={{ ...inputStyle, fontSize: '14px' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Acción a realizar</div>
                <select value={accion} onChange={e => setAccion(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                  <option value="">— Seleccionar —</option>
                  {acciones.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notas de seguimiento</div>
              <textarea value={notasSeguimiento} onChange={e => setNotasSeguimiento(e.target.value)} placeholder="Detalles del seguimiento, acuerdos, próximos pasos..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Siguiente acción (fecha)</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: siguienteAccionFecha ? 'var(--ink)' : 'var(--border)' }}>
                  {siguienteAccionFecha ? formatFecha(siguienteAccionFecha) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Hora</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: horaAccion ? 'var(--ink)' : 'var(--border)' }}>{horaAccion || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Acción a realizar</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: accion ? 'var(--ink)' : 'var(--border)' }}>{accion || '—'}</div>
              </div>
            </div>
            {notasSeguimiento && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Notas de seguimiento</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.6', fontStyle: 'italic' }}>"{notasSeguimiento}"</div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Botón guardar — solo visible si hay algo en modo edición */}
      {(editNotas || editSeguimiento) && (
        <button onClick={async () => { await handleSaveDetalle(); setEditNotas(false); setEditSeguimiento(false) }} disabled={savingDetalle}
          style={{ width: '100%', padding: '13px', background: savingDetalle ? 'var(--muted)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', cursor: savingDetalle ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
          onMouseEnter={e => { if (!savingDetalle) e.currentTarget.style.background = 'var(--brand-dark)' }}
          onMouseLeave={e => { if (!savingDetalle) e.currentTarget.style.background = 'var(--brand)' }}>
          {savingDetalle ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Guardando...</> : <><Icon d={icons.check} size={16} /> Guardar cambios</>}
        </button>
      )}


      {ordenesCliente.length > 0 && (() => {
        const handleCuadroOC = (e) => {
          if (filtroOC === e) setListaOC(v => !v)
          else { setFiltroOC(e); setListaOC(true) }
        }
        const toggleSortOC = (field) => {
          if (sortFieldOC === field) setSortDirOC(d => d === 'asc' ? 'desc' : 'asc')
          else { setSortFieldOC(field); setSortDirOC(field === 'total' ? 'desc' : 'asc') }
        }
        const parseF = (v) => {
          if (!v) return new Date(0)
          const str = v.toString().trim()
          if (str.includes('/')) { const [dp] = str.split(' '); const [d,m,y] = dp.split('/'); return new Date(y,m-1,d) }
          if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str)
          return new Date(0)
        }
        const listaFiltrada = [...ordenesCliente.filter(o => o.estado === filtroOC)].sort((a,b) => {
          if (sortFieldOC === 'fecha') { const fa=parseF(a.fecha),fb=parseF(b.fecha); return sortDirOC==='desc'?fb-fa:fa-fb }
          return sortDirOC==='desc'?(parseFloat(b.total)||0)-(parseFloat(a.total)||0):(parseFloat(a.total)||0)-(parseFloat(b.total)||0)
        })
        const totalFiltradoOC = listaFiltrada.reduce((s,o) => s+(parseFloat(o.total)||0), 0)
        const cntOC  = (e) => ordenesCliente.filter(o => o.estado === e).length
        const totalOC = (e) => ordenesCliente.filter(o => o.estado === e).reduce((s,o) => s+(parseFloat(o.total)||0), 0)

        return (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'16px' }}>Órdenes de {order.clienteNombre}</div>
              <div style={{ display:'flex', gap:'6px', opacity: listaOC ? 1 : 0.4, pointerEvents: listaOC ? 'auto' : 'none', transition:'opacity 0.2s' }}>
                {[['fecha','Fecha'],['total','$']].map(([field, label]) => {
                  const active = sortFieldOC === field
                  const arrow = sortDirOC === 'asc' ? '↑' : '↓'
                  return (
                    <button key={field} onClick={() => toggleSortOC(field)}
                      style={{ padding:'4px 11px', borderRadius:'20px', border:`1.5px solid ${active?'var(--brand)':'var(--border)'}`, background:active?'var(--brand-light)':'var(--white)', color:active?'var(--brand)':'var(--muted)', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                      {label} {active ? arrow : '↕'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
              {['Vendido','Negociando','Detenido','Perdido'].map(e => {
                const c = ESTADO_COLORS[e]
                const activo = filtroOC === e
                return (
                  <div key={e} onClick={() => handleCuadroOC(e)}
                    style={{ background: activo ? c.bg : 'var(--cream)', border:`1.5px solid ${activo ? c.border : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'8px 10px', cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2px' }}>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:activo?c.color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{e}</div>
                      {activo && <span style={{ fontSize:'10px', color:c.color, display:'inline-block', transform: listaOC ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'13px', color:activo?c.color:'var(--ink)' }}>{fmtMoney(totalOC(e))}</div>
                    <div style={{ fontSize:'10px', color:activo?c.color:'var(--muted)', marginTop:'1px' }}>{cntOC(e)} {cntOC(e)===1?'orden':'órdenes'}</div>
                  </div>
                )
              })}
            </div>

            {listaOC && (listaFiltrada.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', background:'var(--white)', border:'1.5px dashed var(--border)', borderRadius:'var(--radius-lg)', color:'var(--muted)', fontSize:'12px', fontWeight:'600' }}>
                Sin órdenes en estado {filtroOC}
              </div>
            ) : (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {listaFiltrada.map((o, i) => {
                    const c = ESTADO_COLORS[o.estado]
                    const esActual = o.numOrden === order.numOrden
                    return (
                      <div key={o.numOrden}
                        style={{ background: esActual ? 'var(--brand-light)' : 'var(--white)', border: `1.5px solid ${esActual ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', animation: `fadeUp 0.2s ${Math.min(i,5)*0.04}s ease both`, opacity: esActual ? 0.8 : 1 }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600', marginBottom:'2px', display:'flex', alignItems:'center', gap:'6px' }}>
                            {o.numOrden} · {formatFecha(o.fecha)}
                            {esActual && <span style={{ fontSize:'10px', fontWeight:'700', color:'var(--brand)', background:'var(--brand-light)', padding:'1px 6px', borderRadius:'20px', border:'1px solid var(--brand)' }}>actual</span>}
                          </div>
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px' }}>
                            {(o.items||[]).slice(0,2).map((item,j) => (
                              <span key={j} style={{ fontSize:'12px', color:'var(--ink)', background:'var(--cream)', padding:'1px 7px', borderRadius:'20px' }}>{item.nombre}</span>
                            ))}
                            {(o.items||[]).length > 2 && <span style={{ fontSize:'12px', color:'var(--muted)' }}>+{o.items.length-2} más</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'15px' }}>{fmtMoney(o.total)}</div>
                          <span style={{ fontSize:'10px', fontWeight:'700', padding:'1px 6px', borderRadius:'20px', background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>{o.estado}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop:'10px', padding:'10px 14px', background:'var(--cream)', borderRadius:'var(--radius)', display:'flex', justifyContent:'space-between', fontSize:'13px', fontWeight:'700' }}>
                  <span style={{ color:'var(--muted)' }}>{listaFiltrada.length} {listaFiltrada.length===1?'orden':'órdenes'}</span>
                  <span>{fmtMoney(totalFiltradoOC)}</span>
                </div>
              </>
            ))}
          </div>
        )
      })()}

      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginTop: '8px' }}>
        <Icon d={icons.arrowLeft} size={15} /> {backLabel}
      </button>
    </div>
  )
}
const ACCION_PHONE_EMAIL = ['Mensaje','Solicitar Referidos','Enviar Propuesta','Seguimiento','Resolver Objeción','Cerrar Venta','Post Venta','Venta Cruzada','Venta Ascendente']


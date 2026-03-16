import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, Icon, icons, fmt, norm, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, EMPTY_FORM, DIAS, MESES_LARGO, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL, fmtMoney, ESTADO_COLORS } from './shared.jsx'

export default function NewOrder({ onBack, onSaved, showToast }) {
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [productos, setProductos] = useState([])
  const [items, setItems] = useState([])
  const [estado, setEstado] = useState('Negociando')
  const [notas, setNotas] = useState('')
  const [siguienteAccionFecha, setSiguienteAccionFecha] = useState('')
  const [horaAccion, setHoraAccion] = useState('')
  const [accion, setAccion] = useState('')
  const [notasSeguimiento, setNotasSeguimiento] = useState('')
  const [acciones, setAcciones] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}?action=getProductos`).then(r => r.json()).then(d => { if (d.success) setProductos(d.data) }).catch(() => {})
    fetch(`${API_BASE}?action=getAcciones`).then(r => r.json()).then(d => { if (d.success) setAcciones(d.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!clienteSearch.trim()) { setClientes([]); return }
    setLoadingClientes(true)
    fetch(API_BASE).then(r => r.json()).then(d => {
      if (d.success) {
        const q = norm(clienteSearch)
        setClientes(d.data.filter(c => norm(c.nombre).includes(q) || norm(c.negocio||'').includes(q)))
      }
    }).catch(() => {}).finally(() => setLoadingClientes(false))
  }, [clienteSearch])

  const addItem = (producto) => {
    setItems(prev => {
      const exists = prev.find(i => i.producto.rowIndex === producto.rowIndex)
      if (exists) return prev.map(i => i.producto.rowIndex === producto.rowIndex ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { producto, cantidad: 1, descuento: 0 }]
    })
  }
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: parseFloat(value)||0 } : item))

  const calcTotals = () => {
    let sinIva = 0, ivaTotal = 0
    items.forEach(({ producto, cantidad, descuento }) => { const sub = cantidad * producto.precio * (1 - descuento/100); sinIva += sub; ivaTotal += sub * (producto.iva/100) })
    return { sinIva, ivaTotal, total: sinIva + ivaTotal }
  }

  const handleSave = async () => {
    if (!clienteSeleccionado) { showToast('Selecciona un cliente', 'error'); return }
    if (items.length === 0) { showToast('Agrega al menos un producto', 'error'); return }
    setSaving(true)
    try {
      const lineItems = items.map(({ producto, cantidad, descuento }) => ({ codigo: producto.codigo, nombre: producto.nombre, cantidad, precioUnitario: producto.precio, iva: producto.iva, descuento }))
      const params = new URLSearchParams({ action: 'createOrden', clienteNombre: clienteSeleccionado.nombre, clienteNegocio: clienteSeleccionado.negocio||'', estado, notas, siguienteAccionFecha: siguienteAccionFecha||'', horaAccion: horaAccion||'', accion: accion||'', notasSeguimiento: notasSeguimiento||'', items: JSON.stringify(lineItems) })
      const res = await fetch(`${API_BASE}?${params}`)
      const data = await res.json()
      if (data.success) { showToast(`✓ Orden ${data.numOrden} creada`); onSaved() }
      else showToast(data.error || 'Error al crear orden', 'error')
    } catch { showToast('Error de conexión', 'error') }
    finally { setSaving(false) }
  }

  const { sinIva, ivaTotal, total } = calcTotals()

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '0', marginBottom: '24px' }}><Icon d={icons.arrowLeft} size={15} /> Cancelar</button>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', marginBottom: '10px' }}>Nueva orden</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Crear orden</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Cliente */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon d={icons.user} size={13} />Cliente</div>
          {clienteSeleccionado ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
              <div><div style={{ fontWeight: '700', fontSize: '15px' }}>{clienteSeleccionado.nombre}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>{clienteSeleccionado.negocio||'—'}</div></div>
              <button onClick={() => setClienteSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}><Icon d={icons.x} size={16} /></button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><Icon d={icons.search} size={15} /></span>
                <input type="text" placeholder="Buscar cliente..." value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '38px', fontSize: '14px' }} />
              </div>
              {loadingClientes && <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '8px 0' }}>Buscando...</div>}
              {clientes.length > 0 && (
                <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {clientes.slice(0,5).map((c, i) => (
                    <div key={c.rowIndex} onClick={() => { setClienteSeleccionado(c); setClienteSearch('') }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < Math.min(clientes.length,5)-1 ? '1px solid var(--cream)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.negocio||'—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Productos */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon d={icons.package} size={13} />Productos</div>

          {/* Catálogo primero */}
          {productos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: '13px' }}>No hay productos en el catálogo.<br />Agrégalos en la pestaña "Productos" del Sheet.</div>
          ) : (
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: items.length > 0 ? '14px' : '0' }}>
              {productos.map((p, i) => (
                <div key={p.rowIndex} onClick={() => addItem(p)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < productos.length-1 ? '1px solid var(--cream)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div><div style={{ fontWeight: '600', fontSize: '14px' }}>{p.nombre}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{p.categoria && `${p.categoria} · `}IVA {p.iva}% · {fmtMoney(p.precio)}</div></div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><Icon d={icons.plus} size={14} /></div>
                </div>
              ))}
            </div>
          )}

          {/* Items elegidos abajo */}
          {items.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Seleccionados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--cream)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div><div style={{ fontWeight: '700', fontSize: '14px' }}>{item.producto.nombre}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{fmtMoney(item.producto.precio)} · IVA {item.producto.iva}%</div></div>
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}><Icon d={icons.x} size={15} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cantidad</label>
                        <input type="number" min="1" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', e.target.value)} style={{ ...inputStyle, padding: '7px 10px', fontSize: '14px', marginTop: '4px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descuento %</label>
                        <input type="number" min="0" max="100" value={item.descuento} onChange={e => updateItem(idx, 'descuento', e.target.value)} style={{ ...inputStyle, padding: '7px 10px', fontSize: '14px', marginTop: '4px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '14px', marginTop: '6px' }}>
                      {fmtMoney((item.cantidad * item.producto.precio * (1 - item.descuento/100)) * (1 + item.producto.iva/100))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Estado y notas */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Estado y notas</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {['Negociando','Vendido'].map(e => {
              const c = ESTADO_COLORS[e]; const activo = estado === e
              return <button key={e} onClick={() => setEstado(e)} style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${activo ? c.color : 'var(--border)'}`, background: activo ? c.bg : 'var(--white)', color: activo ? c.color : 'var(--muted)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>{e}</button>
            })}
          </div>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas de la orden..." style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px' }} />
        </div>
        {/* Siguiente acción */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon d={icons.calendar} size={13} />Seguimiento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Siguiente acción (fecha)</div>
              <input type="date" value={siguienteAccionFecha} onChange={e => setSiguienteAccionFecha(e.target.value)} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Hora</div>
              <input type="time" value={horaAccion} onChange={e => setHoraAccion(e.target.value)} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Acción a realizar</div>
              <select value={accion} onChange={e => setAccion(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                <option value="">— Seleccionar —</option>
                {acciones.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notas de seguimiento</div>
            <textarea value={notasSeguimiento} onChange={e => setNotasSeguimiento(e.target.value)} placeholder="Detalles del seguimiento, acuerdos, próximos pasos..." style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px' }} />
          </div>
        </div>
        {/* Resumen */}
        {items.length > 0 && (
          <div style={{ background: 'var(--brand)', borderRadius: 'var(--radius-lg)', padding: '20px', color: 'white' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.7 }}><span>Subtotal sin IVA</span><span>{fmtMoney(sinIva)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: 0.7 }}><span>IVA</span><span>{fmtMoney(ivaTotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: '800', marginTop: '4px' }}><span>Total</span><span>{fmtMoney(total)}</span></div>
            </div>
            <button onClick={handleSave} disabled={saving || !clienteSeleccionado} style={{ width: '100%', padding: '13px', background: saving || !clienteSeleccionado ? 'rgba(255,255,255,0.2)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: saving || !clienteSeleccionado ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {saving ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Guardando...</> : <><Icon d={icons.check} size={16} /> Ingresar orden</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


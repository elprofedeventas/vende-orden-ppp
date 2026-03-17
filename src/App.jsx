import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE, EMPTY_FORM, Icon, icons, fmt, norm, DIAS, MESES_LARGO, formatFecha, getNowGuayaquil, getTodayLabel, Field, DatePicker, Toast, Highlight, inputStyle, sectionTitle, CARD_STYLE, CARD_STYLE_COMPACT, BTN_PRIMARY, BTN_GHOST, BTN_DANGER, SECTION_HEADER, BADGE_BASE, PILL_STYLE, FLOAT_PANEL } from './shared.jsx'
import MiDia from './MiDia.jsx'
import Dashboard from './Dashboard.jsx'
import { ClientRow, ViewClient, EditForm } from './Clientes.jsx'
import { EstadoBadge, OrderRow, ViewOrder } from './Orders.jsx'
import ActividadesView from './ActividadesView.jsx'
import { PistasView, ViewPista, EditPista } from './Pistas.jsx'
import NewOrder from './NewOrder.jsx'
import { OrdersView, CardOrdenGlobal } from './OrdersView.jsx'
import { EstaSemana, EstaSemanaVencidas } from './EstaSemana.jsx'
import ProximaSemana from './ProximaSemana.jsx'
import Laboratorio from './Laboratorio.jsx'
import { CapturaRapida, ConversorRapido, WhatsAppRapido, Calculadora, CalendarioFlotante, NotasRapidas, PistaFuenteSelect, PistaAccionSelect } from './Utils.jsx'
import Alertas from './Alertas.jsx'
import AlertaBanner from './AlertaBanner.jsx'

export default function App() {
  const [view, setView] = useState('midia')
  const [ordersKey, setOrdersKey] = useState(0)
  const [ordersFiltro, setOrdersFiltro] = useState('Negociando')
  const [activitiesModo, setActivitiesModo] = useState('pendientes')
  const [activitiesKey, setActivitiesKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [voiceState, setVoiceState] = useState('idle') // 'idle' | 'listening' | 'success' | 'error'
  const recognitionRef = useRef(null)
  const [fabOpen, setFabOpen] = useState(false)
  const [midiaVista, setMidiaVista] = useState('hoy')
  const [fabTool, setFabTool] = useState(null) // 'calc' | 'cal' | 'notes'
  const [notasRapidas, setNotasRapidas] = useState(() => { try { return localStorage.getItem('notas_rapidas') || '' } catch { return '' } })
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [toast, setToast] = useState(null)
  const [focusedField, setFocusedField] = useState(null)
  const [acciones, setAcciones] = useState([])
  const [editingClient, setEditingClient] = useState(null)
  const [viewingClient, setViewingClient] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [viewingPista, setViewingPista] = useState(null)
  const [editingPista, setEditingPista] = useState(false)
  const [orderOrigin, setOrderOrigin] = useState('orders')
  const [pistaOrigin, setPistaOrigin] = useState('pistas')
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const showToast = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    fetch(`${API_BASE}?action=getAcciones`)
      .then(r => r.json()).then(d => { if (d.success) setAcciones(d.data) }).catch(() => {})
  }, [])

  const fetchClients = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch(API_BASE)
      const data = await res.json()
      if (data.success) setClients(data.data)
      else showToast('Error al cargar clientes', 'error')
    } catch { showToast('Error de conexión', 'error') }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { if (view === 'list') fetchClients() }, [view, fetchClients])

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const q = norm(searchQuery)
    return clients.filter(c => norm(c.nombre).includes(q) || norm(c.negocio).includes(q) || norm(c.identificacion).includes(q))
  }, [clients, searchQuery])

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'create',
        nombre: form.nombre, negocio: form.negocio||'', identificacion: form.identificacion||'',
        telefono: form.telefono, email: form.email||'', direccion: form.direccion||'',
        contacto: form.contacto||'', telefonoContacto: form.telefonoContacto||'', notas: form.notas||'',
        fuente: form.fuente||'', potencial: form.potencial||'',
        fechaSeguimiento: form.fechaSeguimiento||'', horaSeguimiento: form.horaSeguimiento||'',
        accionSeguimiento: form.accionSeguimiento||'', notaSeguimiento: form.notaSeguimiento||'',
      })
      const res = await fetch(`${API_BASE}?${params.toString()}`)
      const data = await res.json()
      if (data.success) { showToast(`✓ ${form.nombre} registrado exitosamente`); setForm(EMPTY_FORM); setErrors({}); if (view === 'newPista') setView('pistas') }
      else showToast(data.error || 'Error al registrar', 'error')
    } catch { showToast('Error de conexión', 'error') }
    finally { setLoading(false) }
  }

  const navigate = (v, opts = {}) => { setView(v); setMenuOpen(false); if (v !== 'edit') setEditingClient(null); if (v !== 'view') setViewingClient(null); if (v !== 'viewPista' && v !== 'editPista') { setViewingPista(null); setEditingPista(false) } if (v !== 'viewOrder' && v !== 'newOrder') setViewingOrder(null); if (v === 'orders') { setOrdersKey(k => k + 1); setOrdersFiltro('Negociando') } if (v === 'activities' && !opts.keepModo) setActivitiesModo('pendientes'); if (v === 'pistas') setPistaOrigin('pistas') }


  const voiceSpeak = (texto) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'es-EC'; u.rate = 1.0; u.pitch = 1
    window.speechSynthesis.speak(u)
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { showToast('Tu navegador no soporta reconocimiento de voz', 'error'); return }
    if (voiceState === 'listening') {
      recognitionRef.current?.stop()
      setVoiceState('idle')
      return
    }
    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'es-ES'
    rec.interimResults = false
    rec.maxAlternatives = 3
    rec.onstart = () => setVoiceState('listening')
    rec.onerror = () => { setVoiceState('error'); setTimeout(() => setVoiceState('idle'), 1500) }
    rec.onend = () => { if (voiceState === 'listening') setVoiceState('idle') }
    rec.onresult = (e) => {
      const alternativas = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim())
      const texto = alternativas[0]
      const n = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      const incluye = (palabras) => palabras.some(p => alternativas.some(a => n(a).includes(n(p))))
      let destino = null, confirmacion = ''
      if (incluye(['mi dia', 'mi día', 'dia de hoy', 'día de hoy']))           { destino = 'midia';      confirmacion = 'Abriendo mi día de hoy.' }
      else if (incluye(['proxima semana', 'próxima semana', 'semana proxima', 'semana que viene', 'como viene la semana'])) { destino = 'proximaSemana'; confirmacion = 'Abriendo próxima semana.' }
      else if (incluye(['pistas', 'ver pistas', 'mis pistas']))                    { destino = 'pistas'; confirmacion = 'Abriendo pistas.' }
      else if (incluye(['vencidas', 'seguimiento vencidas', 'actividades vencidas', 'vencidos']))       { destino = 'activities-vencidas'; confirmacion = 'Abriendo seguimiento vencidas.' }
      else if (incluye(['pistas', 'ver pistas', 'mis pistas']))                           { destino = 'pistas'; confirmacion = 'Abriendo pistas.' }
      else if (incluye(['seguimiento', 'mis actividades', 'ver actividades', 'actividades']))  { destino = 'activities'; confirmacion = 'Abriendo seguimiento.' }
      else if (incluye(['ordenes', 'órdenes', 'ver ordenes', 'ver órdenes']))   { destino = 'orders';    confirmacion = 'Abriendo órdenes.' }
      else if (incluye(['laboratorio', 'lab'])){ destino = 'laboratorio'; confirmacion = 'Abriendo laboratorio.' }
      else if (incluye(['esta semana', 'semana actual']))                     { destino = 'estaSemana'; confirmacion = 'Abriendo esta semana.' }
      else if (incluye(['laboratorio', 'lab']))                               { destino = 'laboratorio'; confirmacion = 'Abriendo laboratorio.' }
      else if (incluye(['panel', 'inicio', 'dashboard']))                       { destino = 'dashboard'; confirmacion = 'Abriendo panel.' }
      else if (incluye(['nueva orden', 'crear orden', 'nuevo pedido']))         { destino = 'newOrder';  confirmacion = 'Abriendo nueva orden.' }
      else if (incluye(['nuevo cliente', 'crear cliente', 'agregar cliente']))  { destino = 'form';      confirmacion = 'Abriendo nuevo cliente.' }
      else if (incluye(['clientes', 'ver clientes', 'mis clientes']))           { destino = 'list';      confirmacion = 'Abriendo clientes.' }
      if (destino) {
        setVoiceState('success')
        voiceSpeak(confirmacion)
        if (destino === 'activities-vencidas') {
          setActivitiesModo('vencidas')
          setActivitiesKey(k => k + 1)
          navigate('activities', { keepModo: true })
        } else {
          navigate(destino)
        }
        setTimeout(() => setVoiceState('idle'), 1500)
      } else {
        setVoiceState('error')
        voiceSpeak('No entendí el comando. Intenta de nuevo.')
        setTimeout(() => setVoiceState('idle'), 2000)
      }
    }
    rec.start()
  }
  const handleEdit = (c) => { setEditingClient(c); setViewingClient(null); setView('edit') }
  const handleView = (c) => { setViewingClient(c); setView('view') }
  const handleSaveEdit = (c) => { setClients(p => p.map(x => x.rowIndex === c.rowIndex ? c : x)); showToast(`✓ ${c.nombre} actualizado`); setView('list') }
  const handleViewOrder = (o, origin = 'orders') => { setViewingOrder(o); setOrderOrigin(origin); setView('viewOrder') }
  const handleChangeEstado = (rowIndex, estado) => setOrders(p => p.map(o => o.rowIndex === rowIndex ? { ...o, estado } : o))

  const inp = (f, v) => { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(e => ({ ...e, [f]: null })) }
  const gs = (f) => ({ ...inputStyle, borderColor: errors[f] ? 'var(--accent)' : focusedField === f ? 'var(--brand)' : 'var(--border)', boxShadow: focusedField === f ? '0 0 0 3px rgba(30,58,95,0.12)' : 'none' })
  const fp = (f, x = {}) => ({ style: gs(f), value: form[f], onChange: e => inp(f, e.target.value), onFocus: () => setFocusedField(f), onBlur: () => setFocusedField(null), ...x })

  const menuItems = [
    { key: 'midia',         icon: icons.calendar,   label: 'Mi día de hoy' },
    { key: 'activities',    icon: icons.activity,   label: 'Seguimiento' },
    { key: 'newPista',      icon: icons.plus,       label: 'Nueva pista' },
    { key: 'newOrder',      icon: icons.plus,       label: 'Nueva orden' },
    { key: 'pistas',        icon: icons.search,     label: 'Pistas' },
    { key: 'list',          icon: icons.list,       label: 'Clientes' },
    { key: 'orders',        icon: icons.orders,     label: 'Órdenes' },
    { key: 'dashboard',     icon: icons.dashboard,  label: 'Panel' },
    { key: 'laboratorio',   icon: icons.activity,   label: 'Laboratorio' },
      ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }} onClick={() => menuOpen && setMenuOpen(false)}>

      <Alertas onNavegar={(data) => {
        if (data.esPista) {
          const partes = (data.siguienteAccionFecha || '').toString().split(' ')
          const pista = { ...data, nombre: data.clienteNombre || '', negocio: data.clienteNegocio || '', telefono: data.clienteTelefono || '', email: data.clienteEmail || '', direccion: data.clienteDireccion || '', identificacion: data.clienteIdentificacion || '', fechaSeguimiento: partes[0] || '', horaSeguimiento: partes[1] || '', accionSeguimiento: data.accion || '', notaSeguimiento: data.notasSeguimiento || '' }
          setViewingPista(pista); setEditingPista(false); setPistaOrigin('midia'); navigate('viewPista')
        }
      }} />

      <AlertaBanner
        onVer={(data) => {
          if (data?.esPista) {
            const partes = (data.siguienteAccionFecha || '').toString().split(' ')
            const pista = { ...data, nombre: data.clienteNombre || '', negocio: data.clienteNegocio || '', telefono: data.clienteTelefono || '', email: data.clienteEmail || '', direccion: data.clienteDireccion || '', identificacion: data.clienteIdentificacion || '', fechaSeguimiento: partes[0] || '', horaSeguimiento: partes[1] || '', accionSeguimiento: data.accion || '', notaSeguimiento: data.notasSeguimientos || '' }
            setViewingPista(pista); setEditingPista(false); setPistaOrigin('midia'); navigate('viewPista')
            setViewingOrder(data); setOrderOrigin('midia'); navigate('viewOrder')
          }
        }}
      />

      {/* Header */}
      <header style={{ background: 'var(--brand)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 200 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '17px', color: 'white', letterSpacing: '-0.01em' }}>
          Vende Orden PPP
        </span>
        <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }} style={{ background: menuOpen ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: 'white', padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
          <Icon d={icons.menu} size={22} />
        </button>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '68px', right: '16px', zIndex: 300, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflowY: 'auto', maxHeight: 'calc(100vh - 90px)', minWidth: '200px', animation: 'fadeUp 0.2s ease' }}>
          {menuItems.map(({ key, icon, label }) => {
              const isActive = view === key || (view === 'edit' && key === 'list') || (view === 'view' && key === 'list') || (view === 'viewOrder' && key === 'orders') || (view === 'viewOrder' && key === 'activities') || (view === 'viewOrder' && key === 'midia') || (view === 'viewPista' && key === 'pistas') || (view === 'editPista' && key === 'pistas')
              return (
                <button key={key} onClick={() => navigate(key)} style={{ width: '100%', padding: '13px 18px', background: isActive ? 'var(--accent-light)' : 'transparent', border: 'none', borderBottom: '1px solid var(--cream)', color: isActive ? 'var(--accent)' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--cream)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <Icon d={icon} size={17} stroke={isActive ? 'var(--accent)' : 'var(--ink)'} />
                  {label}
                </button>
              )
            })}
        </div>
      )}

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>

        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {view === 'midia' && <MiDia key={midiaVista} onViewOrder={(o) => handleViewOrder(o, 'midia')} onViewPista={(p) => {
          const pista = p.nombre ? p : (() => {
            const partes = (p.siguienteAccionFecha || '').toString().split(' ')
            const fechaSeg = partes[0] || ''
            const horaSeg  = partes[1] || ''
            return {
              ...p,
              nombre:           p.clienteNombre        || '',
              negocio:          p.clienteNegocio        || '',
              telefono:         p.clienteTelefono       || '',
              email:            p.clienteEmail          || '',
              direccion:        p.clienteDireccion      || '',
              identificacion:   p.clienteIdentificacion || '',
              fechaSeguimiento: fechaSeg,
              horaSeguimiento:  horaSeg,
              accionSeguimiento:p.accionSeguimiento     || p.accion || '',
              notaSeguimiento:  p.notaSeguimiento       || p.notasSeguimientos || '',
              diasEnPista:      p.diasEnPista,
              fechaRegistro:    p.fechaRegistro         || '',
              fuente:           p.fuente                || '',
              potencial:        p.potencial             || '',
            }
          })()
          setViewingPista(pista); setEditingPista(false); setPistaOrigin('midia'); setView('viewPista')
        }} onViewProximaSemana={(vista) => { setMidiaVista('hoy'); navigate(vista === 'semana' ? 'estaSemana' : 'proximaSemana') }} initialVista={midiaVista} />}

        {view === 'pistas' && (
          <PistasView onViewPista={(p) => { setViewingPista(p); setEditingPista(false); setPistaOrigin('pistas'); setView('viewPista') }} />
        )}

        {view === 'viewPista' && viewingPista && (
          <ViewPista pista={viewingPista} onBack={() => setView(pistaOrigin)} backLabel={pistaOrigin === 'midia' ? 'Volver a Mi día' : pistaOrigin === 'activities' ? 'Volver a Seguimiento' : pistaOrigin === 'estaSemana' ? 'Volver a Esta semana' : pistaOrigin === 'proximaSemana' ? 'Volver a Próxima semana' : 'Volver a pistas'} showToast={showToast}
            onEdit={() => { setEditingPista(true); setView('editPista') }} />
        )}

        {view === 'editPista' && viewingPista && (
          <EditPista pista={viewingPista} onCancel={() => setView('viewPista')} showToast={showToast}
            onSave={(updated) => { setViewingPista(updated); setView('viewPista') }} />
        )}

        {view === 'proximaSemana' && <ProximaSemana onViewOrder={(o) => handleViewOrder(o, 'proximaSemana')} onViewMiDia={(vista) => { setMidiaVista(vista || 'hoy'); navigate('midia') }} onViewEstaSemana={() => navigate('estaSemana')} onViewPista={(p) => {
          const partes = (p.siguienteAccionFecha || '').toString().split(' ')
          const pista = p.nombre ? p : { ...p, nombre: p.clienteNombre||'', negocio: p.clienteNegocio||'', telefono: p.clienteTelefono||'', email: p.clienteEmail||'', direccion: p.clienteDireccion||'', identificacion: p.clienteIdentificacion||'', fechaSeguimiento: partes[0]||'', horaSeguimiento: partes[1]||'', accionSeguimiento: p.accion||'', notaSeguimiento: p.notasSeguimiento||'', diasEnPista: p.diasEnPista, fechaRegistro: p.fechaRegistro||'', fuente: p.fuente||'', potencial: p.potencial||'' }
          setViewingPista(pista); setEditingPista(false); setPistaOrigin('proximaSemana'); setView('viewPista')
        }} />}

        {view === 'estaSemana' && <EstaSemana onViewOrder={(o) => handleViewOrder(o, 'estaSemana')} onViewMiDia={(vista) => { setMidiaVista(vista || 'hoy'); navigate('midia') }} onViewProximaSemana={() => navigate('proximaSemana')} onViewPista={(p) => {
          const partes = (p.siguienteAccionFecha || '').toString().split(' ')
          const pista = p.nombre ? p : { ...p, nombre: p.clienteNombre||'', negocio: p.clienteNegocio||'', telefono: p.clienteTelefono||'', email: p.clienteEmail||'', direccion: p.clienteDireccion||'', identificacion: p.clienteIdentificacion||'', fechaSeguimiento: partes[0]||'', horaSeguimiento: partes[1]||'', accionSeguimiento: p.accion||'', notaSeguimiento: p.notasSeguimiento||'', diasEnPista: p.diasEnPista, fechaRegistro: p.fechaRegistro||'', fuente: p.fuente||'', potencial: p.potencial||'' }
          setViewingPista(pista); setEditingPista(false); setPistaOrigin('estaSemana'); setView('viewPista')
        }} />}

        {view === 'dashboard' && <Dashboard />}

        {view === 'laboratorio' && <Laboratorio />}

        {/* ── VER CLIENTE ───────────────────────────────────────────────────── */}
        {view === 'view' && viewingClient && (
          <ViewClient client={viewingClient} onEdit={handleEdit} onBack={() => setView('list')} onViewOrder={(o) => handleViewOrder(o, 'view')} />
        )}

        {/* ── EDIT ──────────────────────────────────────────────────────────── */}
        {view === 'edit' && editingClient && <EditForm client={editingClient} onSave={handleSaveEdit} onCancel={() => setView('list')} />}

        {/* ── NUEVO ─────────────────────────────────────────────────────────── */}
        {(view === 'form' || view === 'newPista') && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', marginBottom: '10px' }}>{view === 'newPista' ? 'Nueva pista' : 'Nuevo cliente'}</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{view === 'newPista' ? 'Registrar pista' : 'Registrar cliente'}</h1>
              <p style={{ color: 'var(--muted)', marginTop: '6px', fontSize: '14px' }}>La fecha y hora se registran automáticamente al guardar.</p>
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
                <Field label="Notas / Comentarios" icon="note"><textarea {...fp('notas')} style={{ ...gs('notas'), resize: 'vertical', minHeight: '90px', lineHeight: '1.5' }} placeholder="Interés del cliente, próximos pasos, observaciones..." /></Field>
              </div>

              {/* Calificación — solo en Nueva Pista */}
              {view === 'newPista' && (
                <>
                  <div>
                    <div style={sectionTitle}>Calificación de la pista</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Field label="Fuente de contacto" icon="note">
                        <PistaFuenteSelect value={form.fuente || ''} onChange={v => setForm(p => ({ ...p, fuente: v }))} />
                      </Field>
                      <Field label="Potencial" icon="note">
                        <select value={form.potencial || ''} onChange={e => setForm(p => ({ ...p, potencial: e.target.value }))}
                          style={{ ...inputStyle, cursor: 'pointer', fontSize: '14px' }}>
                          <option value="">— Seleccionar —</option>
                          {['Alto','Medio','Bajo'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                  <div>
                    <div style={sectionTitle}>Seguimiento de pista</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <Field label="Fecha de seguimiento" icon="calendar">
                        <input type="date" value={form.fechaSeguimiento ? (() => { const p = form.fechaSeguimiento.split('/'); return p.length===3?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:'' })() : ''}
                          onChange={e => { const iso = e.target.value; if (!iso) { setForm(p => ({ ...p, fechaSeguimiento: '' })); return }; const [y,m,d] = iso.split('-'); setForm(p => ({ ...p, fechaSeguimiento: `${d}/${m}/${y}` })) }}
                          style={{ ...inputStyle, fontSize: '14px' }} />
                      </Field>
                      <Field label="Hora de seguimiento" icon="clock">
                        <input type="time" value={form.horaSeguimiento || ''}
                          onChange={e => setForm(p => ({ ...p, horaSeguimiento: e.target.value }))}
                          style={{ ...inputStyle, fontSize: '14px' }} />
                      </Field>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <Field label="Acción de seguimiento" icon="note">
                        <PistaAccionSelect value={form.accionSeguimiento || ''} onChange={v => setForm(p => ({ ...p, accionSeguimiento: v }))} />
                      </Field>
                    </div>
                    <Field label="Nota de seguimiento" icon="note">
                      <textarea value={form.notaSeguimiento || ''} placeholder="Detalles, acuerdos, próximos pasos..."
                        onChange={e => setForm(p => ({ ...p, notaSeguimiento: e.target.value }))}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.5', fontSize: '14px' }} />
                    </Field>
                  </div>
                </>
              )}

              <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'var(--muted)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s', marginTop: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-dark)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-dark)' }}>
                {loading ? <><span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Guardando...</> : <><Icon d={icons.check} size={16} /> {view === 'newPista' ? 'Registrar pista' : 'Registrar cliente'}</>}
              </button>
            </div>
          </div>
        )}

        {/* ── CLIENTES ──────────────────────────────────────────────────────── */}
        {view === 'list' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '28px', letterSpacing: '-0.02em' }}>Clientes</h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{searchQuery ? `${filteredClients.length} de ${clients.length} clientes` : `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'} en total`}</p>
            </div>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}><Icon d={icons.search} size={16} /></span>
              <input type="text" placeholder="Buscar por nombre, negocio o identificación..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: '42px', paddingRight: searchQuery ? '42px' : '14px', fontSize: '14px' }} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '2px' }}><Icon d={icons.x} size={16} /></button>}
            </div>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}><div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>Cargando clientes...</div>
            ) : !searchQuery.trim() ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '6px' }}>Escribe para buscar</div>
                <div style={{ fontSize: '14px' }}>Busca por nombre, negocio o identificación</div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>😕</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', marginBottom: '6px' }}>Sin resultados para "{searchQuery}"</div>
                <div style={{ fontSize: '14px' }}>Intenta con otro término</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredClients.map((c, i) => <ClientRow key={c.rowIndex} client={c} index={i} onEdit={handleEdit} onView={handleView} query={searchQuery} />)}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVIDADES ───────────────────────────────────────────────────── */}
        {view === 'activities' && (
          <ActividadesView key={activitiesKey} onViewOrder={(o) => handleViewOrder(o, 'activities')} onViewPista={(p) => {
            const partes = (p.siguienteAccionFecha || '').toString().split(' ')
            const fechaSeg = partes[0] || ''
            const horaSeg  = partes[1] || ''
            const pista = {
              ...p,
              nombre:           p.nombre            || p.clienteNombre        || '',
              negocio:          p.negocio            || p.clienteNegocio       || '',
              telefono:         p.telefono           || p.clienteTelefono      || '',
              email:            p.email              || p.clienteEmail         || '',
              direccion:        p.direccion          || p.clienteDireccion     || '',
              identificacion:   p.identificacion     || p.clienteIdentificacion|| '',
              fechaSeguimiento: p.fechaSeguimiento   || fechaSeg,
              horaSeguimiento:  p.horaSeguimiento    || horaSeg,
              accionSeguimiento:p.accionSeguimiento  || p.accion               || '',
              notaSeguimiento:  p.notaSeguimiento    || p.notasSeguimiento     || '',
              diasEnPista:      p.diasEnPista,
              fechaRegistro:    p.fechaRegistro      || '',
              fuente:           p.fuente             || '',
              potencial:        p.potencial          || '',
            }
            setViewingPista(pista); setEditingPista(false); setPistaOrigin('activities'); setView('viewPista')
          }} modoInicial={activitiesModo} />
        )}

        {/* ── ÓRDENES ───────────────────────────────────────────────────────── */}
        {view === 'orders' && (
          <OrdersView key={ordersKey} onViewOrder={(o) => handleViewOrder(o, 'orders')} filtroInicial={ordersFiltro} onFiltroChange={setOrdersFiltro} />
        )}

        {/* ── VER ORDEN ─────────────────────────────────────────────────────── */}
        {view === 'viewOrder' && viewingOrder && (
          <ViewOrder order={viewingOrder} onBack={() => setView(['midia','proximaSemana','activities'].includes(orderOrigin) ? orderOrigin : orderOrigin)} onChangeEstado={handleChangeEstado} showToast={showToast} backLabel={orderOrigin === 'view' ? 'Volver al cliente' : orderOrigin === 'midia' ? 'Volver a Mi día' : orderOrigin === 'proximaSemana' ? 'Volver a próxima semana' : 'Volver a órdenes'} />
        )}

        {/* ── NUEVA ORDEN ───────────────────────────────────────────────────── */}
                {view === 'newOrder' && (
          <NewOrder onBack={() => setView('orders')} onSaved={() => setView('orders')} showToast={showToast} />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}


      {/* ── FAB: Relámpago + herramientas ─────────────────────────────────── */}
      {!['form','edit','editPista'].includes(view) && (
        <div style={{ position:'fixed', bottom:'24px', right:'20px', zIndex:600, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'10px' }}>

          {/* Overlay para cerrar */}
          {fabOpen && <div onClick={() => { setFabOpen(false); setFabTool(null) }} style={{ position:'fixed', inset:0, zIndex:-1 }} />}

          {/* Herramientas en columna */}
          {fabOpen && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
              {[
                { key:'voice', label: voiceState==='listening'?'Escuchando...':'Voz', icon: voiceState==='listening'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    : voiceState==='success'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>,
                  bg: voiceState==='listening'?'#dc2626':voiceState==='success'?'#16a34a':voiceState==='error'?'#d97706':'#1e3a5f',
                  action: () => { startVoice(); setFabOpen(false) } },
                { key:'calc', label:'Calculadora', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10" strokeWidth="3"/><line x1="12" y1="10" x2="12" y2="10" strokeWidth="3"/><line x1="16" y1="10" x2="16" y2="10" strokeWidth="3"/><line x1="8" y1="14" x2="8" y2="14" strokeWidth="3"/><line x1="12" y1="14" x2="12" y2="14" strokeWidth="3"/><line x1="16" y1="14" x2="16" y2="14" strokeWidth="3"/><line x1="8" y1="18" x2="8" y2="18" strokeWidth="3"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3"/><line x1="16" y1="18" x2="16" y2="18" strokeWidth="3"/></svg>,
                  bg:'#0891b2', action: () => setFabTool(fabTool==='calc'?null:'calc') },
                { key:'cal', label:'Calendario', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
                  bg:'#7c3aed', action: () => setFabTool(fabTool==='cal'?null:'cal') },
                { key:'notes', label:'Notas rápidas', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
                  bg:'#d97706', action: () => setFabTool(fabTool==='notes'?null:'notes') },
                { key:'captura', label:'Nueva pista', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
                  bg:'#2563eb', action: () => setFabTool(fabTool==='captura'?null:'captura') },
                { key:'conversor', label:'Conversor', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                  bg:'#0891b2', action: () => setFabTool(fabTool==='conversor'?null:'conversor') },
                { key:'whatsapp', label:'WhatsApp', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.656 1.438 5.168L2 22l4.984-1.393A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" strokeWidth="1.5"/></svg>,
                  bg:'#16a34a', action: () => setFabTool(fabTool==='whatsapp'?null:'whatsapp') },
              ].map(({ key, label, icon, bg, action }, i) => (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:'8px', animation:`fadeUp 0.15s ${i*0.04}s ease both` }}>
                  <span style={{ fontSize:'12px', fontWeight:'700', color:'white', background:'rgba(0,0,0,0.55)', padding:'3px 10px', borderRadius:'20px', whiteSpace:'nowrap', backdropFilter:'blur(4px)' }}>{label}</span>
                  <button onClick={action} style={{ width:'44px', height:'44px', borderRadius:'50%', border:'none', background:bg, color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 12px rgba(0,0,0,0.25)', transition:'transform 0.15s', flexShrink:0 }}
                    onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                    {icon}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón principal ⚡ */}
          <button onClick={() => { setFabOpen(o => !o); if (fabOpen) setFabTool(null) }}
            style={{ width:'56px', height:'56px', borderRadius:'50%', border:'none', background: fabOpen?'#374151':'#fbbf24', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(251,191,36,0.5)', transition:'background 0.2s, transform 0.2s', transform: fabOpen?'rotate(45deg)':'rotate(0deg)', flexShrink:0 }}>
            {fabOpen
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <span style={{ fontSize:'30px', fontWeight:'900', color:'#1e3a5f', lineHeight:1, fontFamily:'Georgia, serif' }}>!</span>
            }
          </button>
        </div>
      )}

      {/* ── CALCULADORA FLOTANTE ─────────────────────────────────────────────── */}
      {fabTool === 'calc' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'280px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#0891b2', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>Calculadora</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <Calculadora />
        </div>
      )}

      {/* ── CALENDARIO FLOTANTE ──────────────────────────────────────────────── */}
      {fabTool === 'cal' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'300px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#7c3aed', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>Calendario</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <CalendarioFlotante />
        </div>
      )}

      {/* ── NOTAS RÁPIDAS FLOTANTE ───────────────────────────────────────────── */}
      {fabTool === 'notes' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'300px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#d97706', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>Notas rápidas</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <NotasRapidas valor={notasRapidas} onChange={v => { setNotasRapidas(v); try { localStorage.setItem('notas_rapidas', v) } catch {} }} />
        </div>
      )}

      {/* ── CAPTURA RÁPIDA FLOTANTE ──────────────────────────────────────────── */}
      {fabTool === 'captura' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'290px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#2563eb', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>Nueva pista rápida</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <CapturaRapida onClose={() => setFabTool(null)} showToast={showToast} />
        </div>
      )}

      {/* ── CONVERSOR FLOTANTE ───────────────────────────────────────────────── */}
      {fabTool === 'conversor' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'290px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#0891b2', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>Conversor rápido</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <ConversorRapido />
        </div>
      )}

      {/* ── WHATSAPP RÁPIDO FLOTANTE ─────────────────────────────────────────── */}
      {fabTool === 'whatsapp' && (
        <div style={{ position:'fixed', bottom:'100px', right:'20px', zIndex:700, background:'var(--white)', borderRadius:'var(--radius-lg)', boxShadow:'0 8px 40px rgba(0,0,0,0.25)', width:'290px', overflow:'hidden', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#16a34a', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>WhatsApp rápido</span>
            <button onClick={() => setFabTool(null)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>✕</button>
          </div>
          <WhatsAppRapido onClose={() => setFabTool(null)} />
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { API_BASE, Icon, icons, inputStyle } from './shared.jsx'

export default function Notas() {
  const [notas, setNotas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId]   = useState(null)   // rowIndex en edición
  const [editText, setEditText] = useState('')
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)

  const cargar = () => {
    setLoading(true)
    fetch(`${API_BASE}?action=getNotas`)
      .then(r => r.json())
      .then(d => { if (d.success) setNotas(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const iniciarEdicion = (n) => {
    setEditId(n.rowIndex)
    setEditText(n.nota)
  }

  const cancelarEdicion = () => {
    setEditId(null)
    setEditText('')
  }

  const guardarEdicion = async (rowIndex) => {
    if (!editText.trim()) return
    setSaving(true)
    try {
      const params = new URLSearchParams({ action: 'updateNota', rowIndex, nota: editText.trim() })
      const res = await fetch(`${API_BASE}?${params}`)
      const d   = await res.json()
      if (d.success) {
        setNotas(prev => prev.map(n => n.rowIndex === rowIndex ? { ...n, nota: editText.trim() } : n))
        setEditId(null)
        setEditText('')
      }
    } catch {} finally { setSaving(false) }
  }

  const eliminar = async (rowIndex) => {
    setDeleting(rowIndex)
    try {
      const params = new URLSearchParams({ action: 'deleteNota', rowIndex })
      const res = await fetch(`${API_BASE}?${params}`)
      const d   = await res.json()
      if (d.success) {
        setNotas(prev => prev.filter(n => n.rowIndex !== rowIndex))
      }
    } catch {} finally { setDeleting(null) }
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-title)', fontSize: '28px', letterSpacing: '-0.02em', margin: 0 }}>Notas</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>{notas.length} {notas.length === 1 ? 'nota' : 'notas'} guardadas</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>
          Cargando notas...
        </div>
      ) : notas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '6px' }}>Sin notas guardadas</div>
          <div style={{ fontSize: '14px' }}>Usa el botón ⚡ para agregar notas rápidas</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notas.map(n => (
            <div key={n.rowIndex} style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              {/* Header: fecha + botones */}
              <div style={{ background: '#1a1a2e', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#fbbf24' }}>📅 {n.fecha}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {editId !== n.rowIndex && (
                    <button onClick={() => iniciarEdicion(n)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      ✏️ Editar
                    </button>
                  )}
                  <button onClick={() => eliminar(n.rowIndex)} disabled={deleting === n.rowIndex}
                    style={{ background: deleting === n.rowIndex ? 'rgba(255,255,255,0.05)' : 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: deleting === n.rowIndex ? 'not-allowed' : 'pointer' }}>
                    {deleting === n.rowIndex ? '⏳' : '🗑 Borrar'}
                  </button>
                </div>
              </div>

              {/* Cuerpo: texto o editor */}
              <div style={{ padding: '12px 14px' }}>
                {editId === n.rowIndex ? (
                  <>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '14px', lineHeight: '1.6', boxSizing: 'border-box', marginBottom: '8px' }}
                      autoFocus />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => guardarEdicion(n.rowIndex)} disabled={saving || !editText.trim()}
                        style={{ flex: 2, padding: '8px', background: saving ? 'var(--muted)' : 'var(--brand)', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: '600', color: 'white', cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? '⏳ Guardando...' : '✓ Guardar'}
                      </button>
                      <button onClick={cancelarEdicion}
                        style={{ flex: 1, padding: '8px', background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: '600', color: 'var(--muted)', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{n.nota}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Services() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', slug: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)

  useEffect(() => { ladeServices() }, [])

  async function ladeServices() {
    setLaden(true)
    const { data } = await supabase
      .from('hausmeisterservice')
      .select('*')
      .order('name')
    setServices(data || [])
    setLaden(false)
  }

  function nameZuSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function serviceAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    const { error } = await supabase.from('hausmeisterservice').insert({
      name: neu.name,
      slug: neu.slug || nameZuSlug(neu.name),
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeu({ name: '', slug: '' })
    setFormOffen(false)
    setSpeichern(false)
    ladeServices()
  }

  async function serviceSpeichern(id) {
    await supabase.from('hausmeisterservice').update({
      name: bearbeitenWert.name,
      slug: bearbeitenWert.slug,
    }).eq('id', id)
    setBearbeitenId(null)
    ladeServices()
  }

  async function serviceLoeschen(id) {
    await supabase.from('hausmeisterservice').delete().eq('id', id)
    setLoeschenId(null)
    ladeServices()
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Hausmeisterservice-Firmen</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {formOffen && (
          <form onSubmit={serviceAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neue Firma</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Firmenname" value={neu.name}
                onChange={e => setNeu({ name: e.target.value, slug: nameZuSlug(e.target.value) })} required />
              <input style={inputStyle} placeholder="Slug (automatisch)" value={neu.slug}
                onChange={e => setNeu({...neu, slug: e.target.value})} required />
            </div>
            {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </form>
        )}

        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Firmen angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map(s => (
              <div key={s.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px' }}>
                {bearbeitenId === s.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} value={bearbeitenWert.name} onChange={e => setBearbeitenWert({...bearbeitenWert, name: e.target.value})} placeholder="Firmenname" />
                    <input style={inputStyle} value={bearbeitenWert.slug} onChange={e => setBearbeitenWert({...bearbeitenWert, slug: e.target.value})} placeholder="Slug" />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => setBearbeitenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => serviceSpeichern(s.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Speichern</button>
                    </div>
                  </div>
                ) : loeschenId === s.id ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', marginBottom: 6 }}>{s.name} wirklich löschen?</div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>Alle Techniker und Objekte dieser Firma werden ebenfalls gelöscht.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setLoeschenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => serviceLoeschen(s.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>Ja, löschen</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>/{s.slug}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setBearbeitenId(s.id); setBearbeitenWert({ name: s.name, slug: s.slug }) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Bearbeiten</button>
                      <button onClick={() => setLoeschenId(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
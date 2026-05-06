import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Techniker() {
  const navigate = useNavigate()
  const [techniker, setTechniker] = useState([])
  const [services, setServices] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', pin: '', rolle: 'techniker', user_id: '', service_id: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [schritt, setSchritt] = useState(1)
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)

  useEffect(() => { ladeTechniker(); ladeServices() }, [])

  async function ladeServices() {
    const { data } = await supabase.from('hausmeisterservice').select('id, name').order('name')
    setServices(data || [])
  }

  async function ladeTechniker() {
    setLaden(true)
    const { data } = await supabase
      .from('techniker')
      .select('*, hausmeisterservice(name)')
      .order('name')
    setTechniker(data || [])
    setLaden(false)
  }

  async function technikerAnlegen(e) {
    e.preventDefault()
    if (neu.pin.length !== 4 || !/^\d{4}$/.test(neu.pin)) {
      setFehler('PIN muss genau 4 Ziffern sein')
      return
    }
    setSpeichern(true)
    setFehler('')
      console.log('Anlegen mit UUID:', neu.user_id)  // ← hier


    const { error } = await supabase.from('techniker').insert({
      id: neu.user_id,
      service_id: neu.service_id,
      name: neu.name,
      pin_hash: neu.pin,
      rolle: neu.rolle,
    })

    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }

    setNeu({ name: '', pin: '', rolle: 'techniker', user_id: '', service_id: '' })
    setFormOffen(false)
    setSchritt(1)
    setSpeichern(false)
    ladeTechniker()
  }

  async function technikerSpeichern(id) {
    await supabase.from('techniker').update({
      name: bearbeitenWert.name,
      pin_hash: bearbeitenWert.pin_hash,
      rolle: bearbeitenWert.rolle,
      service_id: bearbeitenWert.service_id,
    }).eq('id', id)
    setBearbeitenId(null)
    ladeTechniker()
  }

  async function technikerLoeschen(id) {
    await supabase.from('techniker').delete().eq('id', id)
    setLoeschenId(null)
    ladeTechniker()
  }

  async function aktivToggle(t) {
    await supabase.from('techniker').update({ aktiv: !t.aktiv }).eq('id', t.id)
    ladeTechniker()
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
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Techniker</span>
        </div>
        <button onClick={() => { setFormOffen(true); setSchritt(1) }} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {formOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 4 }}>Neuer Techniker</div>

            {schritt === 1 && (
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, padding: '10px 12px', background: '#F8F7F2', borderRadius: 8, lineHeight: 1.6 }}>
                  <strong style={{ color: '#2C2C2A' }}>Schritt 1:</strong> Geh in Supabase → Authentication → Users → <strong style={{ color: '#2C2C2A' }}>Add user</strong>:<br/><br/>
                  • E-Mail: beliebig (z.B. name@hausmeister.app)<br/>
                  • Passwort: die gewünschte PIN (4 Ziffern)<br/>
                  • Auto Confirm User: ✓<br/><br/>
                  Danach die <strong style={{ color: '#2C2C2A' }}>UUID</strong> des neuen Users kopieren.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                  <button onClick={() => setSchritt(2)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Weiter →</button>
                </div>
              </div>
            )}

            {schritt === 2 && (
              <form onSubmit={technikerAnlegen}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, marginTop: 12 }}>
                  <input style={inputStyle} placeholder="Name des Technikers" value={neu.name} onChange={e => setNeu({...neu, name: e.target.value})} required />
                  <input style={inputStyle} placeholder="PIN (4 Ziffern)" maxLength={4} value={neu.pin} onChange={e => setNeu({...neu, pin: e.target.value.replace(/\D/g, '')})} required />
                  <input style={inputStyle} placeholder="UUID aus Supabase einfügen" value={neu.user_id} onChange={e => setNeu({...neu, user_id: e.target.value.trim()})} required />
                  <select style={inputStyle} value={neu.service_id} onChange={e => setNeu({...neu, service_id: e.target.value})} required>
                    <option value="">Firma auswählen…</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select style={inputStyle} value={neu.rolle} onChange={e => setNeu({...neu, rolle: e.target.value})}>
                    <option value="techniker">Techniker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setSchritt(1)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>← Zurück</button>
                  <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                    {speichern ? 'Wird gespeichert…' : 'Speichern'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : techniker.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Techniker angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {techniker.map(t => (
              <div key={t.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px' }}>

                {bearbeitenId === t.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} value={bearbeitenWert.name} onChange={e => setBearbeitenWert({...bearbeitenWert, name: e.target.value})} placeholder="Name" />
                    <input style={inputStyle} value={bearbeitenWert.pin_hash} onChange={e => setBearbeitenWert({...bearbeitenWert, pin_hash: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="PIN (4 Ziffern)" maxLength={4} />
                    <select style={inputStyle} value={bearbeitenWert.service_id} onChange={e => setBearbeitenWert({...bearbeitenWert, service_id: e.target.value})}>
                      <option value="">Firma auswählen…</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select style={inputStyle} value={bearbeitenWert.rolle} onChange={e => setBearbeitenWert({...bearbeitenWert, rolle: e.target.value})}>
                      <option value="techniker">Techniker</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => setBearbeitenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => technikerSpeichern(t.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Speichern</button>
                    </div>
                  </div>
                ) : loeschenId === t.id ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', marginBottom: 6 }}>{t.name} wirklich löschen?</div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>Der Techniker verliert sofort den Zugang zur App.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setLoeschenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => technikerLoeschen(t.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>Ja, löschen</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
                        {t.rolle === 'admin' ? 'Admin' : 'Techniker'} · PIN: {t.pin_hash} · {t.hausmeisterservice?.name || '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => aktivToggle(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: t.aktiv ? '#E8F5E9' : '#F1EFE8', color: t.aktiv ? '#2E7D32' : '#888780', border: `0.5px solid ${t.aktiv ? '#A5D6A7' : '#D3D1C7'}`, cursor: 'pointer' }}>
                        {t.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </button>
                      <button onClick={() => { setBearbeitenId(t.id); setBearbeitenWert({ name: t.name, pin_hash: t.pin_hash, rolle: t.rolle, service_id: t.service_id }) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Bearbeiten</button>
                      <button onClick={() => setLoeschenId(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
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

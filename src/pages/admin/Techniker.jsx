import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Techniker() {
  const navigate = useNavigate()
  const [techniker, setTechniker] = useState([])
  const [services, setServices] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', pin: '', rolle: 'techniker', service_id: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)
  const [objektZuweisungId, setObjektZuweisungId] = useState(null)
  const [zugewieseneObjekte, setZugewieseneObjekte] = useState([])

  useEffect(() => { ladeTechniker(); ladeServices(); ladeObjekte() }, [])

  async function ladeServices() {
    const { data } = await supabase.from('hausmeisterservice').select('id, name').order('name')
    setServices(data || [])
  }

  async function ladeObjekte() {
    const { data } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    setObjekte(data || [])
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

  async function ladeZugewieseneObjekte(technikerId) {
    const { data } = await supabase
      .from('techniker_objekt')
      .select('id, objekt_id')
      .eq('techniker_id', technikerId)
    setZugewieseneObjekte(data || [])
    setObjektZuweisungId(technikerId)
  }

  async function objektToggle(objektId) {
    const vorhanden = zugewieseneObjekte.find(z => z.objekt_id === objektId)
    if (vorhanden) {
      await supabase.from('techniker_objekt').delete().eq('id', vorhanden.id)
    } else {
      await supabase.from('techniker_objekt').insert({ techniker_id: objektZuweisungId, objekt_id: objektId })
    }
    ladeZugewieseneObjekte(objektZuweisungId)
  }

  async function technikerAnlegen(e) {
    e.preventDefault()
    if (neu.pin.length !== 4 || !/^\d{4}$/.test(neu.pin)) {
      setFehler('PIN muss genau 4 Ziffern sein')
      return
    }
    setSpeichern(true)
    setFehler('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/techniker-anlegen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: neu.name,
          pin: neu.pin,
          service_id: neu.service_id,
          rolle: neu.rolle,
        })
      })
      const result = await response.json()
      if (!response.ok || result?.error) {
        setFehler('Fehler: ' + (result?.error || 'Unbekannter Fehler'))
        setSpeichern(false)
        return
      }
      setNeu({ name: '', pin: '', rolle: 'techniker', service_id: '' })
      setFormOffen(false)
      setSpeichern(false)
      ladeTechniker()
    } catch (err) {
      setFehler('Fehler: ' + err.message)
      setSpeichern(false)
    }
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
        <button onClick={() => { setFormOffen(true); setFehler('') }} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {/* Neuer Techniker */}
        {formOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neuer Techniker</div>
            <form onSubmit={technikerAnlegen}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input style={inputStyle} placeholder="Name des Technikers" value={neu.name} onChange={e => setNeu({...neu, name: e.target.value})} required />
                <input style={inputStyle} placeholder="PIN (4 Ziffern)" maxLength={4} value={neu.pin} onChange={e => setNeu({...neu, pin: e.target.value.replace(/\D/g, '')})} required />
                <select style={inputStyle} value={neu.service_id} onChange={e => setNeu({...neu, service_id: e.target.value})} required>
                  <option value="">Firma auswählen…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select style={inputStyle} value={neu.rolle} onChange={e => setNeu({...neu, rolle: e.target.value})}>
                  <option value="techniker">Techniker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                  {speichern ? 'Wird angelegt…' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Objektzuweisung */}
        {objektZuweisungId && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Objekte zuweisen</div>
              <button onClick={() => setObjektZuweisungId(null)} style={{ fontSize: 12, color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>Schließen</button>
            </div>
            {objekte.length === 0 ? (
              <div style={{ fontSize: 13, color: '#888780' }}>Keine Objekte vorhanden</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {objekte.map(o => {
                  const hatZuweisung = zugewieseneObjekte.some(z => z.objekt_id === o.id)
                  return (
                    <div key={o.id} onClick={() => objektToggle(o.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: hatZuweisung ? '#E8F5E9' : '#F8F7F2', border: `0.5px solid ${hatZuweisung ? '#A5D6A7' : '#D3D1C7'}`, cursor: 'pointer' }}>
                      <span style={{ fontSize: 13, color: '#2C2C2A' }}>{o.strasse} {o.hausnummer}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: hatZuweisung ? '#2E7D32' : '#888780' }}>{hatZuweisung ? '✓ Zugewiesen' : '+ Zuweisen'}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Liste */}
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
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
                          {t.rolle === 'admin' ? 'Admin' : 'Techniker'} · PIN: {t.pin_hash} · {t.hausmeisterservice?.name || '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => aktivToggle(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: t.aktiv ? '#E8F5E9' : '#F1EFE8', color: t.aktiv ? '#2E7D32' : '#888780', border: `0.5px solid ${t.aktiv ? '#A5D6A7' : '#D3D1C7'}`, cursor: 'pointer' }}>
                          {t.aktiv ? 'Aktiv' : 'Inaktiv'}
                        </button>
                        <button onClick={() => ladeZugewieseneObjekte(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#E1F5EE', color: '#085041', border: '0.5px solid #9FE1CB', cursor: 'pointer' }}>Objekte</button>
                        <button onClick={() => { setBearbeitenId(t.id); setBearbeitenWert({ name: t.name, pin_hash: t.pin_hash, rolle: t.rolle, service_id: t.service_id }) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Bearbeiten</button>
                        <button onClick={() => setLoeschenId(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
                      </div>
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

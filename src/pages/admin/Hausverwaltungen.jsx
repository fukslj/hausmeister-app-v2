import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Hausverwaltungen() {
  const navigate = useNavigate()
  const [verwaltungen, setVerwaltungen] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', email: '', user_id: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [schritt, setSchritt] = useState(1)
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)
  const [zugangId, setZugangId] = useState(null)
  const [zugaenge, setZugaenge] = useState([])

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: v } = await supabase.from('hausverwaltung').select('*').order('name')
    const { data: o } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    setVerwaltungen(v || [])
    setObjekte(o || [])
    setLaden(false)
  }

  async function verwaltungAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')

    const { error } = await supabase.from('hausverwaltung').insert({
      id: neu.user_id,
      name: neu.name,
      email: neu.email,
    })

    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }

    setNeu({ name: '', email: '', user_id: '' })
    setFormOffen(false)
    setSchritt(1)
    setSpeichern(false)
    ladeDaten()
  }

  async function verwaltungSpeichern(id) {
    await supabase.from('hausverwaltung').update({
      name: bearbeitenWert.name,
      email: bearbeitenWert.email,
    }).eq('id', id)
    setBearbeitenId(null)
    ladeDaten()
  }

  async function verwaltungLoeschen(id) {
    await supabase.from('hausverwaltung').delete().eq('id', id)
    setLoeschenId(null)
    ladeDaten()
  }

  async function ladeZugaenge(verwaltungId) {
    const { data } = await supabase
      .from('verwaltungszugang')
      .select('id, objekt_id')
      .eq('hausverwaltung_id', verwaltungId)
    setZugaenge(data || [])
    setZugangId(verwaltungId)
  }

  async function zugangToggle(objektId) {
    const vorhanden = zugaenge.find(z => z.objekt_id === objektId)
    if (vorhanden) {
      await supabase.from('verwaltungszugang').delete().eq('id', vorhanden.id)
    } else {
      await supabase.from('verwaltungszugang').insert({ hausverwaltung_id: zugangId, objekt_id: objektId })
    }
    ladeZugaenge(zugangId)
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
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Hausverwaltungen</span>
        </div>
        <button onClick={() => { setFormOffen(true); setSchritt(1) }} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {/* Neue Hausverwaltung */}
        {formOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 4 }}>Neue Hausverwaltung</div>

            {schritt === 1 && (
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, padding: '10px 12px', background: '#F8F7F2', borderRadius: 8, lineHeight: 1.6 }}>
                  <strong style={{ color: '#2C2C2A' }}>Schritt 1:</strong> Geh in Supabase → Authentication → Users → <strong style={{ color: '#2C2C2A' }}>Add user</strong>:<br/><br/>
                  • E-Mail: E-Mail der Hausverwaltung<br/>
                  • Passwort: beliebiges Passwort<br/>
                  • Auto Confirm User: ✓<br/><br/>
                  Danach die <strong style={{ color: '#2C2C2A' }}>UUID</strong> kopieren.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                  <button onClick={() => setSchritt(2)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Weiter →</button>
                </div>
              </div>
            )}

            {schritt === 2 && (
              <form onSubmit={verwaltungAnlegen}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, marginTop: 12 }}>
                  <input style={inputStyle} placeholder="Name der Hausverwaltung" value={neu.name} onChange={e => setNeu({...neu, name: e.target.value})} required />
                  <input style={inputStyle} placeholder="E-Mail" type="email" value={neu.email} onChange={e => setNeu({...neu, email: e.target.value})} required />
                  <input style={inputStyle} placeholder="UUID aus Supabase einfügen" value={neu.user_id} onChange={e => setNeu({...neu, user_id: e.target.value.trim()})} required />
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

        {/* Objektzugang */}
        {zugangId && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Objekte zuweisen</div>
              <button onClick={() => setZugangId(null)} style={{ fontSize: 12, color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>Schließen</button>
            </div>
            {objekte.length === 0 ? (
              <div style={{ fontSize: 13, color: '#888780' }}>Keine Objekte vorhanden</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {objekte.map(o => {
                  const hatZugang = zugaenge.some(z => z.objekt_id === o.id)
                  return (
                    <div key={o.id} onClick={() => zugangToggle(o.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: hatZugang ? '#E8F5E9' : '#F8F7F2', border: `0.5px solid ${hatZugang ? '#A5D6A7' : '#D3D1C7'}`, cursor: 'pointer' }}>
                      <span style={{ fontSize: 13, color: '#2C2C2A' }}>{o.strasse} {o.hausnummer}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: hatZugang ? '#2E7D32' : '#888780' }}>{hatZugang ? '✓ Zugang' : '+ Hinzufügen'}</span>
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
        ) : verwaltungen.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Hausverwaltungen angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {verwaltungen.map(v => (
              <div key={v.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px' }}>

                {bearbeitenId === v.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input style={inputStyle} value={bearbeitenWert.name} onChange={e => setBearbeitenWert({...bearbeitenWert, name: e.target.value})} placeholder="Name" />
                    <input style={inputStyle} value={bearbeitenWert.email} onChange={e => setBearbeitenWert({...bearbeitenWert, email: e.target.value})} placeholder="E-Mail" type="email" />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => setBearbeitenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => verwaltungSpeichern(v.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Speichern</button>
                    </div>
                  </div>
                ) : loeschenId === v.id ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', marginBottom: 6 }}>{v.name} wirklich löschen?</div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>Alle Objektzugänge werden ebenfalls entfernt.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setLoeschenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => verwaltungLoeschen(v.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>Ja, löschen</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{v.name}</div>
                        <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{v.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => ladeZugaenge(v.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#EEEDFE', color: '#534AB7', border: '0.5px solid #AFA9EC', cursor: 'pointer' }}>Objekte</button>
                        <button onClick={() => { setBearbeitenId(v.id); setBearbeitenWert({ name: v.name, email: v.email }) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Bearbeiten</button>
                        <button onClick={() => setLoeschenId(v.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
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
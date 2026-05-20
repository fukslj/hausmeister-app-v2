import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Fahrzeuge() {
  const navigate = useNavigate()
  const [fahrzeuge, setFahrzeuge] = useState([])
  const [buchungen, setBuchungen] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [buchungFormOffen, setBuchungFormOffen] = useState(false)
  const [selectedFahrzeug, setSelectedFahrzeug] = useState(null)
  const [techniker, setTechniker] = useState([])
  const [neu, setNeu] = useState({ kennzeichen: '', bezeichnung: '', typ: 'pkw' })
  const [neuBuchung, setNeuBuchung] = useState({ techniker_id: '', von: '', bis: '', zweck: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: t_admin } = await supabase.from('techniker').select('service_id').eq('id', user.id).single()
    
    const { data: f } = await supabase
      .from('fahrzeug')
      .select('*')
      .eq('service_id', t_admin.service_id)
      .order('bezeichnung')
    const { data: b } = await supabase
      .from('fahrzeug_buchung')
      .select('*, fahrzeug(bezeichnung, kennzeichen), techniker(name)')
      .gte('bis', new Date().toISOString())
      .order('von')
    const { data: t } = await supabase
      .from('techniker')
      .select('id, name')
      .eq('rolle', 'techniker')
      .order('name')
    setFahrzeuge(f || [])
    setBuchungen(b || [])
    setTechniker(t || [])
    setLaden(false)
  }

  async function fahrzeugAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: t_admin } = await supabase.from('techniker').select('service_id').eq('id', user.id).single()
    
    const { error } = await supabase.from('fahrzeug').insert({
      ...neu,
      service_id: t_admin.service_id,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeu({ kennzeichen: '', bezeichnung: '', typ: 'pkw' })
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  async function buchungAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')

    // Konfliktprüfung
    const { data: konflikt } = await supabase
      .from('fahrzeug_buchung')
      .select('id')
      .eq('fahrzeug_id', selectedFahrzeug.id)
      .lt('von', neuBuchung.bis)
      .gt('bis', neuBuchung.von)
      .limit(1)

    if (konflikt?.length > 0) {
      setFehler('Fahrzeug ist in diesem Zeitraum bereits gebucht')
      setSpeichern(false)
      return
    }

    const { error } = await supabase.from('fahrzeug_buchung').insert({
      fahrzeug_id: selectedFahrzeug.id,
      techniker_id: neuBuchung.techniker_id,
      von: neuBuchung.von,
      bis: neuBuchung.bis,
      zweck: neuBuchung.zweck || null,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeuBuchung({ techniker_id: '', von: '', bis: '', zweck: '' })
    setBuchungFormOffen(false)
    setSelectedFahrzeug(null)
    setSpeichern(false)
    ladeDaten()
  }

  async function buchungLoeschen(id) {
    await supabase.from('fahrzeug_buchung').delete().eq('id', id)
    ladeDaten()
  }

  async function fahrzeugLoeschen(id) {
    await supabase.from('fahrzeug').delete().eq('id', id)
    ladeDaten()
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
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Fahrzeuge</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Fahrzeug
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Neues Fahrzeug */}
        {formOffen && (
          <form onSubmit={fahrzeugAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neues Fahrzeug</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Kennzeichen (z.B. KG-AB 123)" value={neu.kennzeichen} onChange={e => setNeu({...neu, kennzeichen: e.target.value})} required />
              <input style={inputStyle} placeholder="Bezeichnung (z.B. VW Transporter)" value={neu.bezeichnung} onChange={e => setNeu({...neu, bezeichnung: e.target.value})} required />
              <select style={inputStyle} value={neu.typ} onChange={e => setNeu({...neu, typ: e.target.value})}>
                <option value="pkw">PKW</option>
                <option value="transporter">Transporter</option>
                <option value="lkw">LKW</option>
                <option value="sonstiges">Sonstiges</option>
              </select>
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

        {/* Buchungsformular */}
        {buchungFormOffen && selectedFahrzeug && (
          <form onSubmit={buchungAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 4 }}>Buchung — {selectedFahrzeug.bezeichnung}</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 16 }}>{selectedFahrzeug.kennzeichen}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <select style={inputStyle} value={neuBuchung.techniker_id} onChange={e => setNeuBuchung({...neuBuchung, techniker_id: e.target.value})} required>
                <option value="">Techniker auswählen…</option>
                {techniker.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Von</div>
                  <input type="datetime-local" style={inputStyle} value={neuBuchung.von} onChange={e => setNeuBuchung({...neuBuchung, von: e.target.value})} required />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Bis</div>
                  <input type="datetime-local" style={inputStyle} value={neuBuchung.bis} onChange={e => setNeuBuchung({...neuBuchung, bis: e.target.value})} required />
                </div>
              </div>
              <input style={inputStyle} placeholder="Zweck (optional)" value={neuBuchung.zweck} onChange={e => setNeuBuchung({...neuBuchung, zweck: e.target.value})} />
            </div>
            {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setBuchungFormOffen(false); setFehler('') }} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Prüfe…' : 'Buchen'}
              </button>
            </div>
          </form>
        )}

        {/* Fahrzeugliste */}
        <div style={{ fontSize: 13, fontWeight: 500, color: '#888780' }}>Fuhrpark</div>
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : fahrzeuge.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Fahrzeuge angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fahrzeuge.map(f => (
              <div key={f.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{f.bezeichnung}</div>
                    <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{f.kennzeichen} · {f.typ.toUpperCase()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelectedFahrzeug(f); setBuchungFormOffen(true); setFehler('') }}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #9FE1CB', cursor: 'pointer' }}>
                      Buchen
                    </button>
                    <button onClick={() => fahrzeugLoeschen(f.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aktuelle Buchungen */}
        {buchungen.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#888780' }}>Aktuelle & kommende Buchungen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
              {buchungen.map((b, i) => (
                <div key={b.id} style={{ background: 'white', padding: '12px 16px', borderBottom: i < buchungen.length - 1 ? '0.5px solid #F1EFE8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{b.fahrzeug?.bezeichnung}</div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{b.techniker?.name} · {b.zweck || 'Kein Zweck'}</div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                      {new Date(b.von).toLocaleDateString('de-DE')} {new Date(b.von).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.bis).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={() => buchungLoeschen(b.id)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer', flexShrink: 0 }}>
                    Stornieren
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

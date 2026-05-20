import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Fahrzeuge() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [fahrzeuge, setFahrzeuge] = useState([])
  const [meineBuchungen, setMeineBuchungen] = useState([])
  const [laden, setLaden] = useState(true)
  const [buchungFormOffen, setBuchungFormOffen] = useState(false)
  const [selectedFahrzeug, setSelectedFahrzeug] = useState(null)
  const [neuBuchung, setNeuBuchung] = useState({ von: '', bis: '', zweck: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    if (profil?.id) ladeDaten()
  }, [profil])

  async function ladeDaten() {
    setLaden(true)
    const { data: f } = await supabase
      .from('fahrzeug')
      .select('*')
      .eq('aktiv', true)
      .order('bezeichnung')
    const { data: b } = await supabase
      .from('fahrzeug_buchung')
      .select('*, fahrzeug(bezeichnung, kennzeichen)')
      .eq('techniker_id', profil.id)
      .gte('bis', new Date().toISOString())
      .order('von')
    setFahrzeuge(f || [])
    setMeineBuchungen(b || [])
    setLaden(false)
  }

  async function buchungAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')

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
      techniker_id: profil.id,
      von: neuBuchung.von,
      bis: neuBuchung.bis,
      zweck: neuBuchung.zweck || null,
    })

    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeuBuchung({ von: '', bis: '', zweck: '' })
    setBuchungFormOffen(false)
    setSelectedFahrzeug(null)
    setSpeichern(false)
    ladeDaten()
  }

  async function buchungStornieren(id) {
    await supabase.from('fahrzeug_buchung').delete().eq('id', id)
    ladeDaten()
  }

  async function istVerfuegbar(fahrzeugId) {
    const jetzt = new Date().toISOString()
    const { data } = await supabase
      .from('fahrzeug_buchung')
      .select('id')
      .eq('fahrzeug_id', fahrzeugId)
      .lte('von', jetzt)
      .gte('bis', jetzt)
      .limit(1)
    return !data?.length
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C',
    border: '0.5px solid #9FE1CB', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Fahrzeuge</span>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Buchungsformular */}
        {buchungFormOffen && selectedFahrzeug && (
          <form onSubmit={buchungAnlegen} style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#04342C', marginBottom: 4 }}>Buchung — {selectedFahrzeug.bezeichnung}</div>
            <div style={{ fontSize: 12, color: '#0F6E56', marginBottom: 16 }}>{selectedFahrzeug.kennzeichen}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 4 }}>Von</div>
                  <input type="datetime-local" style={inputStyle} value={neuBuchung.von} onChange={e => setNeuBuchung({...neuBuchung, von: e.target.value})} required />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 4 }}>Bis</div>
                  <input type="datetime-local" style={inputStyle} value={neuBuchung.bis} onChange={e => setNeuBuchung({...neuBuchung, bis: e.target.value})} required />
                </div>
              </div>
              <input style={inputStyle} placeholder="Zweck (optional)" value={neuBuchung.zweck} onChange={e => setNeuBuchung({...neuBuchung, zweck: e.target.value})} />
            </div>
            {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setBuchungFormOffen(false); setFehler('') }} style={{ flex: 1, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.5)', color: '#0F6E56', border: '0.5px solid #9FE1CB', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Prüfe…' : 'Buchen'}
              </button>
            </div>
          </form>
        )}

        {/* Fahrzeugliste */}
        <div style={{ fontSize: 13, fontWeight: 500, color: '#888780' }}>Verfügbare Fahrzeuge</div>
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : fahrzeuge.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Fahrzeuge vorhanden</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fahrzeuge.map(f => (
              <div key={f.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{f.bezeichnung}</div>
                  <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{f.kennzeichen} · {f.typ.toUpperCase()}</div>
                </div>
                <button onClick={() => { setSelectedFahrzeug(f); setBuchungFormOffen(true); setFehler('') }}
                  style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', cursor: 'pointer' }}>
                  Buchen
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Meine Buchungen */}
        {meineBuchungen.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#888780' }}>Meine Buchungen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
              {meineBuchungen.map((b, i) => (
                <div key={b.id} style={{ background: 'white', padding: '12px 16px', borderBottom: i < meineBuchungen.length - 1 ? '0.5px solid #F1EFE8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{b.fahrzeug?.bezeichnung}</div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{b.fahrzeug?.kennzeichen}</div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                      {new Date(b.von).toLocaleDateString('de-DE')} {new Date(b.von).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.bis).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {b.zweck && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 2 }}>{b.zweck}</div>}
                  </div>
                  <button onClick={() => buchungStornieren(b.id)}
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

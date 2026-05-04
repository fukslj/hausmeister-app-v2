import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Objekte() {
  const navigate = useNavigate()
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ strasse: '', hausnummer: '', plz: '', ort: '', eingaenge: 1, service_id: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [services, setServices] = useState([])

  useEffect(() => { ladeObjekte(); ladeServices() }, [])

  async function ladeServices() {
    const { data } = await supabase.from('hausmeisterservice').select('id, name').order('name')
    setServices(data || [])
  }

  async function ladeObjekte() {
    setLaden(true)
    const { data } = await supabase
      .from('objekt')
      .select('*, eingang(id, bezeichnung, qr_token)')
      .order('strasse')
    setObjekte(data || [])
    setLaden(false)
  }

  async function objektAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')

    const { data: objekt, error: objektError } = await supabase
      .from('objekt')
      .insert({
        strasse: neu.strasse,
        hausnummer: neu.hausnummer,
        plz: neu.plz,
        ort: neu.ort,
        service_id: neu.service_id,
      })
      .select()
      .single()

    if (objektError) {
      setFehler('Fehler: ' + objektError.message)
      setSpeichern(false)
      return
    }

    const anzahl = parseInt(neu.eingaenge) || 1
    if (anzahl === 1) {
      const { error: eingangError } = await supabase.from('eingang').insert({ objekt_id: objekt.id, bezeichnung: 'Eingang' })
      } else {
      const bezeichnungen = anzahl === 2
        ? ['Links', 'Rechts']
        : Array.from({ length: anzahl }, (_, i) => `Eingang ${i + 1}`)
      for (const bezeichnung of bezeichnungen) {
        const { error: eingangError } = await supabase.from('eingang').insert({ objekt_id: objekt.id, bezeichnung })
      
      }
    }

    setNeu({ strasse: '', hausnummer: '', plz: '', ort: '', eingaenge: 1, service_id: '' })
    setFormOffen(false)
    setSpeichern(false)
    ladeObjekte()
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
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Objekte</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {formOffen && (
          <form onSubmit={objektAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neues Objekt</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="Straße" value={neu.strasse} onChange={e => setNeu({...neu, strasse: e.target.value})} required />
              <input style={{...inputStyle, width: 80}} placeholder="Nr." value={neu.hausnummer} onChange={e => setNeu({...neu, hausnummer: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="PLZ" value={neu.plz} onChange={e => setNeu({...neu, plz: e.target.value})} required />
              <input style={inputStyle} placeholder="Ort" value={neu.ort} onChange={e => setNeu({...neu, ort: e.target.value})} required />
            </div>
            <select
              style={{ ...inputStyle, marginBottom: 8 }}
              value={neu.service_id}
              onChange={e => setNeu({...neu, service_id: e.target.value})}
              required
            >
              <option value="">Firma auswählen…</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, marginBottom: 16 }}
              type="number"
              min="1"
              max="10"
              placeholder="Anzahl Eingänge (z.B. 1, 2, 3)"
              value={neu.eingaenge}
              onChange={e => setNeu({...neu, eingaenge: e.target.value})}
              required
            />
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
        ) : objekte.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Objekte angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {objekte.map(obj => (
              <div key={obj.id} onClick={() => navigate(`/admin/objekte/${obj.id}`)}
                style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8F7F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{obj.strasse} {obj.hausnummer}</div>
                    <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{obj.plz} {obj.ort}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#888780' }}>{obj.eingang?.length || 0} Eingänge</span>
                </div>
                {obj.eingang?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {obj.eingang.map(e => (
                      <span key={e.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F1EFE8', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}>{e.bezeichnung}</span>
                    ))}
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
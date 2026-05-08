import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profil, abmelden } = useAuth()
  const [meldungen, setMeldungen] = useState([])
  const [objekte, setObjekte] = useState([])
  const [eingaenge, setEingaenge] = useState([])
  const [laden, setLaden] = useState(true)
  const [filter, setFilter] = useState('alle')
  const [aktivesObjekt, setAktivesObjekt] = useState(null)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ eingang_id: '', beschreibung: '', foto: null, fotoPreview: null })
  const [senden, setSenden] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    if (profil?.id) ladeDaten()
  }, [profil])

  async function ladeDaten() {
    setLaden(true)
    const { data: m } = await supabase
      .from('meldung')
      .select('*, eingang(bezeichnung, objekt_id, objekt(strasse, hausnummer)), meldung_techniker(techniker_id)')
      .order('erstellt_am', { ascending: false })
    const { data: z } = await supabase
      .from('verwaltungszugang')
      .select('objekt(id, strasse, hausnummer)')
      .eq('hausverwaltung_id', profil?.id)
    const objektListe = z?.map(z => z.objekt) || []
    setMeldungen(m || [])
    setObjekte(objektListe)

    // Eingänge für alle Objekte laden
    if (objektListe.length > 0) {
      const { data: e } = await supabase
        .from('eingang')
        .select('id, bezeichnung, objekt_id')
        .in('objekt_id', objektListe.map(o => o.id))
        .eq('aktiv', true)
      setEingaenge(e || [])
    }
    setLaden(false)
  }

  async function aufgabeAnlegen(e) {
    e.preventDefault()
    if (!neu.eingang_id) { setFehler('Bitte einen Eingang auswählen'); return }
    if (!neu.beschreibung.trim()) { setFehler('Bitte eine Beschreibung eingeben'); return }
    setSenden(true)
    setFehler('')

    const { data: meldungId, error } = await supabase.rpc('aufgabe_erstellen', {
      p_eingang_id: neu.eingang_id,
      p_beschreibung: neu.beschreibung.trim(),
      p_melder_name: profil.name || 'Hausverwaltung',
    })

    if (error) { setFehler('Fehler: ' + error.message); setSenden(false); return }

    // Foto hochladen falls vorhanden
    if (neu.foto && meldungId) {
      const ext = neu.foto.name.split('.').pop()
      const pfad = `${meldungId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('meldung-fotos').upload(pfad, neu.foto)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('meldung-fotos').getPublicUrl(pfad)
        await supabase.from('meldung_foto').insert({ meldung_id: meldungId, url: publicUrl, hochgeladen_von: profil.name || 'Hausverwaltung' })
      }
    }

    setNeu({ eingang_id: '', beschreibung: '', foto: null, fotoPreview: null })
    setFormOffen(false)
    setSenden(false)
    ladeDaten()
  }

  function gefilterteMeldungen() {
    let liste = meldungen
    if (aktivesObjekt) liste = liste.filter(m => m.eingang?.objekt_id === aktivesObjekt)
    if (filter === 'offen') return liste.filter(m => m.status === 'offen')
    if (filter === 'in_arbeit') return liste.filter(m => m.status === 'in_arbeit')
    if (filter === 'erledigt') return liste.filter(m => m.status === 'erledigt')
    return liste
  }

  function statusBadge(m) {
    if (m.status === 'offen') return { text: 'Offen', bg: '#FEF3CD', color: '#856404' }
    if (m.status === 'in_arbeit') return { text: 'In Arbeit', bg: '#E8F4FD', color: '#0C5460' }
    if (m.status === 'erledigt') return { text: 'Erledigt', bg: '#E8F5E9', color: '#2E7D32' }
    return { text: m.status, bg: '#F1EFE8', color: '#5F5E5A' }
  }

  const gefiltert = gefilterteMeldungen()
  const offenAnzahl = meldungen.filter(m => m.status === 'offen').length
  const inArbeitAnzahl = meldungen.filter(m => m.status === 'in_arbeit').length
  const erledigtAnzahl = meldungen.filter(m => m.status === 'erledigt').length

  const inputStyle = {
    padding: '10px 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: 'rgba(255,255,255,0.7)', color: '#26215C',
    border: '0.5px solid #AFA9EC', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#EEEDFE', padding: '14px 20px', borderBottom: '0.5px solid #AFA9EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="10" width="18" height="11" rx="2" stroke="#3C3489" strokeWidth="1.5"/>
              <path d="M3 10l9-7 9 7" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#26215C' }}>{profil?.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#534AB7', color: '#EEEDFE', border: 'none', cursor: 'pointer' }}>
            + Aufgabe
          </button>
          <button onClick={abmelden} style={{ fontSize: 12, color: '#534AB7', background: 'none', border: 'none', cursor: 'pointer' }}>Abmelden</button>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {/* Aufgabe anlegen Modal */}
        {formOffen && (
          <div style={{ background: '#EEEDFE', border: '0.5px solid #AFA9EC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#26215C', marginBottom: 16 }}>Neue Aufgabe</div>
            <form onSubmit={aufgabeAnlegen} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select style={inputStyle} value={neu.eingang_id} onChange={e => setNeu({...neu, eingang_id: e.target.value})} required>
                <option value="">Eingang auswählen…</option>
                {objekte.map(o => (
                  <optgroup key={o.id} label={`${o.strasse} ${o.hausnummer}`}>
                    {eingaenge.filter(e => e.objekt_id === o.id).map(e => (
                      <option key={e.id} value={e.id}>{e.bezeichnung}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <textarea
                style={{ ...inputStyle, height: 80, resize: 'none' }}
                placeholder="Was soll erledigt werden?"
                value={neu.beschreibung}
                onChange={e => setNeu({...neu, beschreibung: e.target.value})}
                required
              />
              <label style={{ width: '100%', height: 60, borderRadius: 8, border: '1px dashed #AFA9EC', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#534AB7' }}>
                {neu.fotoPreview ? (
                  <img src={neu.fotoPreview} alt="" style={{ height: 50, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    Foto hinzufügen (optional)
                  </>
                )}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setNeu({...neu, foto: f, fotoPreview: URL.createObjectURL(f)}) }} style={{ display: 'none' }} />
              </label>
              {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>{fehler}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setFormOffen(false); setFehler('') }} style={{ flex: 1, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.5)', color: '#534AB7', border: '0.5px solid #AFA9EC', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                <button type="submit" disabled={senden} style={{ flex: 1, height: 36, borderRadius: 8, background: '#534AB7', color: '#EEEDFE', border: 'none', fontSize: 13, cursor: 'pointer', opacity: senden ? 0.6 : 1 }}>
                  {senden ? 'Wird gesendet…' : 'Senden'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Metriken */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Offen', value: offenAnzahl, color: '#856404' },
            { label: 'In Arbeit', value: inArbeitAnzahl, color: '#0C5460' },
            { label: 'Erledigt', value: erledigtAnzahl, color: '#2E7D32' },
          ].map(m => (
            <div key={m.label} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Meine Objekte */}
        {objekte.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 10 }}>Meine Objekte</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div onClick={() => setAktivesObjekt(null)} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', background: aktivesObjekt === null ? '#534AB7' : '#EEEDFE', color: aktivesObjekt === null ? '#EEEDFE' : '#534AB7', border: '0.5px solid #AFA9EC' }}>
                Alle
              </div>
              {objekte.map(o => (
                <div key={o.id} onClick={() => setAktivesObjekt(aktivesObjekt === o.id ? null : o.id)} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', background: aktivesObjekt === o.id ? '#534AB7' : '#EEEDFE', color: aktivesObjekt === o.id ? '#EEEDFE' : '#534AB7', border: '0.5px solid #AFA9EC' }}>
                  {o.strasse} {o.hausnummer}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['alle', 'offen', 'in_arbeit', 'erledigt'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, border: '0.5px solid', cursor: 'pointer', background: filter === f ? '#534AB7' : 'transparent', color: filter === f ? '#EEEDFE' : '#888780', borderColor: filter === f ? '#534AB7' : '#D3D1C7' }}>
              {f === 'alle' ? 'Alle' : f === 'in_arbeit' ? 'In Arbeit' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Meldungsliste */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Meldungen</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
            {gefiltert.map((m, i) => {
              const badge = statusBadge(m)
              return (
                <div key={m.id} onClick={() => navigate(`/meldung/${m.id}`)}
                  style={{ background: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: i < gefiltert.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8F7F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: badge.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.beschreibung || 'Keine Beschreibung'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                      {m.eingang?.objekt?.strasse} {m.eingang?.objekt?.hausnummer} · {m.eingang?.bezeichnung} · {m.melder_name}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                    {badge.text}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

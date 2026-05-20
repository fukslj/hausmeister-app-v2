import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Muellkalender() {
  const navigate = useNavigate()
  const [termine, setTermine] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [importOffen, setImportOffen] = useState(false)
  const [selectedObjekt, setSelectedObjekt] = useState('')
  const [neu, setNeu] = useState({ objekt_id: '', datum: '', fraktion: 'Restmüll', notiz: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [filterObjekt, setFilterObjekt] = useState('')
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [muellEmail, setMuellEmail] = useState('')
  const [meldeFormOffen, setMeldeFormOffen] = useState(false)
  const [meldungText, setMeldungText] = useState('')
  const [meldungTermin, setMeldungTermin] = useState(null)

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: o } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    const { data: t } = await supabase
      .from('muell_termin')
      .select('*, objekt(strasse, hausnummer)')
      .order('datum')
    setObjekte(o || [])
    setTermine(t || [])
    setLaden(false)
  }

  async function terminAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    const { error } = await supabase.from('muell_termin').insert({
      objekt_id: neu.objekt_id,
      datum: neu.datum,
      fraktion: neu.fraktion,
      notiz: neu.notiz || null,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeu({ objekt_id: '', datum: '', fraktion: 'Restmüll', notiz: '' })
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

 async function csvImport(e) {
  const file = e.target.files[0]
  if (!file || !selectedObjekt) return

  // ISO-8859-1 Encoding unterstützen
  const buffer = await file.arrayBuffer()
  const decoder = new TextDecoder('iso-8859-1')
  const text = decoder.decode(buffer)

  const zeilen = text.replace(/\r/g, '').split('\n').filter(z => z.trim())
   alert(`Zeilen: ${zeilen.length}, Erste: ${zeilen[0]}`)
  if (zeilen.length < 2) return

  // Automatisch Trennzeichen erkennen (Semikolon oder Komma)
  const trennzeichen = zeilen[0].includes(';') ? ';' : ','

  const fraktionen = zeilen[0].split(trennzeichen).map(s => s.trim().replace(/"/g, ''))
  const inserts = []

  for (const zeile of zeilen.slice(1)) {
    const werte = zeile.split(trennzeichen).map(s => s.trim().replace(/"/g, ''))
    fraktionen.forEach((fraktion, i) => {
      const datumRaw = werte[i]
      if (!datumRaw) return
      const teile = datumRaw.split('.')
      if (teile.length !== 3) return
      const datum = `${teile[2]}-${teile[1].padStart(2, '0')}-${teile[0].padStart(2, '0')}`
      inserts.push({ objekt_id: selectedObjekt, datum, fraktion })
    })
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from('muell_termin').insert(inserts)
    if (!error) { ladeDaten(); setImportOffen(false) }
    else alert('Fehler: ' + error.message)
  }
  e.target.value = ''
}
    console.log('Inserts:', JSON.stringify(inserts))
    if (inserts.length > 0) {
      const { error } = await supabase.from('muell_termin').insert(inserts)
      console.log('Insert Fehler:', error)
      if (!error) { ladeDaten(); setImportOffen(false) }
    }
    e.target.value = ''
  }

    if (inserts.length > 0) {
      await supabase.from('muell_termin').insert(inserts)
      ladeDaten()
      setImportOffen(false)
    }
    e.target.value = ''
  }

  async function terminLoeschen(id) {
    await supabase.from('muell_termin').delete().eq('id', id)
    ladeDaten()
  }

  function gefilterteTermine() {
    return termine.filter(t => {
      const monatMatch = t.datum?.startsWith(filterMonat)
      const objektMatch = !filterObjekt || t.objekt_id === filterObjekt
      return monatMatch && objektMatch
    })
  }

  function fraktionFarbe(fraktion) {
    if (fraktion.toLowerCase().includes('rest')) return { bg: '#F5F5F5', color: '#444441', border: '#D3D1C7' }
    if (fraktion.toLowerCase().includes('papier') || fraktion.toLowerCase().includes('blau')) return { bg: '#EBF4FD', color: '#0C5460', border: '#AFA9EC' }
    if (fraktion.toLowerCase().includes('bio') || fraktion.toLowerCase().includes('grün')) return { bg: '#E1F5EE', color: '#085041', border: '#9FE1CB' }
    if (fraktion.toLowerCase().includes('gelb') || fraktion.toLowerCase().includes('wertstoff')) return { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' }
    return { bg: '#F1EFE8', color: '#5F5E5A', border: '#D3D1C7' }
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteTermine()

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Müllkalender</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setImportOffen(true)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
            CSV Import
          </button>
          <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
            + Termin
          </button>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* CSV Import */}
        {importOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>CSV Import</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, padding: '10px 12px', background: '#F8F7F2', borderRadius: 8, lineHeight: 1.8 }}>
              <strong style={{ color: '#2C2C2A' }}>Format:</strong><br/>
              Erste Zeile: Müllarten als Spaltenköpfe<br/>
              Ab Zeile 2: Termine im Format TT.MM.YYYY<br/><br/>
              <code style={{ fontSize: 11 }}>Restmüll,Papiertonne,Biotonne</code><br/>
              <code style={{ fontSize: 11 }}>15.01.2024,08.01.2024,22.01.2024</code><br/>
              <code style={{ fontSize: 11 }}>12.02.2024,05.02.2024,19.02.2024</code>
            </div>
            <select style={{ ...inputStyle, marginBottom: 10 }} value={selectedObjekt} onChange={e => setSelectedObjekt(e.target.value)}>
              <option value="">Objekt auswählen…</option>
              {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
            </select>
            <div
  onClick={() => selectedObjekt && document.getElementById('csv-input').click()}
  style={{ height: 60, borderRadius: 8, border: '1px dashed #D3D1C7', background: '#F8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedObjekt ? 'pointer' : 'not-allowed', fontSize: 13, color: selectedObjekt ? '#444441' : '#888780' }}>
  📂 CSV Datei auswählen
</div>
<input
  id="csv-input"
  type="file"
  accept=".csv"
  onChange={csvImport}
  disabled={!selectedObjekt}
  style={{ display: 'none' }}
/>
            <button onClick={() => setImportOffen(false)} style={{ marginTop: 10, width: '100%', height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Schließen</button>
          </div>
        )}

        {/* Neuer Termin */}
        {formOffen && (
          <form onSubmit={terminAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neuer Termin</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <select style={inputStyle} value={neu.objekt_id} onChange={e => setNeu({...neu, objekt_id: e.target.value})} required>
                <option value="">Objekt auswählen…</option>
                {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
              </select>
              <input type="date" style={inputStyle} value={neu.datum} onChange={e => setNeu({...neu, datum: e.target.value})} required />
              <select style={inputStyle} value={neu.fraktion} onChange={e => setNeu({...neu, fraktion: e.target.value})}>
                <option>Restmüll</option>
                <option>Papiertonne</option>
                <option>Biotonne</option>
                <option>Gelbe Tonne</option>
                <option>Sperrmüll</option>
                <option>Sonstiges</option>
              </select>
              <input style={inputStyle} placeholder="Notiz (optional)" value={neu.notiz} onChange={e => setNeu({...neu, notiz: e.target.value})} />
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

        {/* Meldung ans Müllunternehmen */}
        {meldeFormOffen && meldungTermin && (
          <div style={{ background: '#FDECEB', border: '0.5px solid #F5C6C2', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#C0392B', marginBottom: 4 }}>Meldung ans Müllunternehmen</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 16 }}>{meldungTermin.fraktion} · {new Date(meldungTermin.datum).toLocaleDateString('de-DE')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={{ ...inputStyle, borderColor: '#F5C6C2' }} type="email" placeholder="E-Mail des Müllunternehmens" value={muellEmail} onChange={e => setMuellEmail(e.target.value)} />
              <textarea style={{ ...inputStyle, height: 80, padding: '10px 12px', resize: 'none', borderColor: '#F5C6C2' }} placeholder="Beschreibung des Problems…" value={meldungText} onChange={e => setMeldungText(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setMeldeFormOffen(false); setMeldungTermin(null) }} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={async () => {
                if (!muellEmail || !meldungText) return
                await supabase.functions.invoke('meldung-status-email', {
                  body: {
                    typ: 'muell',
                    email: muellEmail,
                    termin: meldungTermin,
                    text: meldungText,
                    objekt: objekte.find(o => o.id === meldungTermin.objekt_id),
                  }
                })
                setMeldeFormOffen(false)
                setMeldungTermin(null)
                setMuellEmail('')
                setMeldungText('')
                alert('Meldung wurde gesendet')
              }} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                Senden
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="month" style={{ ...inputStyle, flex: 1 }} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />
          <select style={{ ...inputStyle, flex: 1 }} value={filterObjekt} onChange={e => setFilterObjekt(e.target.value)}>
            <option value="">Alle Objekte</option>
            {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
          </select>
        </div>

        {/* Termine */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Termine für diesen Monat</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gefiltert.map(t => {
              const farbe = fraktionFarbe(t.fraktion)
              const istHeute = t.datum === new Date().toISOString().split('T')[0]
              const istVergangen = new Date(t.datum) < new Date() && !istHeute
              return (
                <div key={t.id} style={{ background: 'white', border: `0.5px solid ${istHeute ? '#F5C6C2' : '#D3D1C7'}`, borderRadius: 12, padding: '14px 16px', opacity: istVergangen ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: farbe.bg, color: farbe.color, border: `0.5px solid ${farbe.border}` }}>
                          {t.fraktion}
                        </span>
                        {istHeute && <span style={{ fontSize: 11, fontWeight: 500, color: '#C0392B' }}>Heute!</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{t.objekt?.strasse} {t.objekt?.hausnummer}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
                        {new Date(t.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      {t.notiz && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{t.notiz}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setMeldungTermin(t); setMeldeFormOffen(true) }}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>
                        Melden
                      </button>
                      <button onClick={() => terminLoeschen(t.id)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

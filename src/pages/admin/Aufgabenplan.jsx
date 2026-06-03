import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Aufgabenplan() {
  const navigate = useNavigate()
  const [aufgaben, setAufgaben] = useState([])
  const [objekte, setObjekte] = useState([])
  const [techniker, setTechniker] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [importOffen, setImportOffen] = useState(false)
  const [neu, setNeu] = useState({
    objekt_id: '', techniker_id: '', titel: '',
    beschreibung: '', faellig_am: '', wiederkehrend: 'einmalig'
  })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const csvInputRef = useRef(null)

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: o } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    const { data: t } = await supabase.from('techniker').select('id, name').eq('rolle', 'techniker').order('name')
    const { data: a } = await supabase
      .from('aufgabenplan')
      .select('*, objekt(strasse, hausnummer), techniker(name)')
      .order('faellig_am')
    setObjekte(o || [])
    setTechniker(t || [])
    setAufgaben(a || [])
    setLaden(false)
  }

  async function aufgabeAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    const { error } = await supabase.from('aufgabenplan').insert({
      objekt_id: neu.objekt_id,
      techniker_id: neu.techniker_id || null,
      titel: neu.titel,
      beschreibung: neu.beschreibung || null,
      faellig_am: neu.faellig_am,
      wiederkehrend: neu.wiederkehrend,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeu({ objekt_id: '', techniker_id: '', titel: '', beschreibung: '', faellig_am: '', wiederkehrend: 'einmalig' })
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  async function csvImport(e) {
    const file = e.target.files[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('iso-8859-1')
    const text = decoder.decode(buffer)
    const zeilen = text.replace(/\r/g, '').split('\n').filter(z => z.trim())
    if (zeilen.length < 2) { alert('CSV hat zu wenig Zeilen'); return }

    const trennzeichen = zeilen[0].includes(';') ? ';' : ','
    const kopf = zeilen[0].split(trennzeichen).map(s => s.trim().toLowerCase().replace(/"/g, '').replace(/^\uFEFF/, '').replace(/^\u00ef\u00bb\u00bf/, ''))
    alert(`Kopf: ${JSON.stringify(kopf)}\nErste Zeile: ${zeilen[0]}`)

    const inserts = []
    const fehlerZeilen = []

    for (let i = 1; i < zeilen.length; i++) {
      const werte = zeilen[i].split(trennzeichen).map(s => s.trim().replace(/"/g, ''))
      const row = {}
      kopf.forEach((k, idx) => row[k] = werte[idx] || '')

      // Objekt suchen
      const objekt = objekte.find(o =>
        `${o.strasse} ${o.hausnummer}`.toLowerCase() === row['objekt']?.toLowerCase()
      )
      if (!objekt) { fehlerZeilen.push(`Zeile ${i + 1}: Objekt "${row['objekt']}" nicht gefunden`); continue }

      // Techniker suchen (optional)
      const tech = techniker.find(t => t.name.toLowerCase() === row['techniker']?.toLowerCase())

      // Datum parsen TT.MM.YYYY oder YYYY-MM-DD
      let datum = ''
      const datumRaw = row['datum'] || ''
      if (datumRaw.includes('.')) {
        const teile = datumRaw.split('.')
        if (teile.length === 3) datum = `${teile[2]}-${teile[1].padStart(2,'0')}-${teile[0].padStart(2,'0')}`
      } else {
        datum = datumRaw
      }
      if (!datum) { fehlerZeilen.push(`Zeile ${i + 1}: Ungültiges Datum "${datumRaw}"`); continue }

      // Häufigkeit mappen
      const haeufigkeitMap = {
        'einmalig': 'einmalig', 'monatlich': 'monatlich',
        'quartalsweise': 'quartalsweise', 'jährlich': 'jaehrlich',
        'jaehrlich': 'jaehrlich', 'wöchentlich': 'woechentlich',
        'woechentlich': 'woechentlich', 'täglich': 'taeglich', 'taeglich': 'taeglich'
      }
      const haeufigkeit = haeufigkeitMap[row['häufigkeit']?.toLowerCase() || row['haeufigkeit']?.toLowerCase() || 'einmalig'] || 'einmalig'

      inserts.push({
        objekt_id: objekt.id,
        techniker_id: tech?.id || null,
        titel: row['titel'] || 'Ohne Titel',
        faellig_am: datum,
        wiederkehrend: haeufigkeit,
      })
    }

    if (fehlerZeilen.length > 0) {
      alert(`Folgende Zeilen konnten nicht importiert werden:\n${fehlerZeilen.join('\n')}`)
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('aufgabenplan').insert(inserts)
      if (!error) {
        alert(`${inserts.length} Aufgaben erfolgreich importiert`)
        ladeDaten()
        setImportOffen(false)
      } else {
        alert('Fehler beim Import: ' + error.message)
      }
    }
    e.target.value = ''
  }

  function csvExport() {
    const bom = '\uFEFF'
    const kopf = 'Objekt;Techniker;Titel;Datum;Häufigkeit'
    const zeilen = aufgaben.map(a =>
      `${a.objekt?.strasse} ${a.objekt?.hausnummer};${a.techniker?.name || ''};${a.titel};${new Date(a.faellig_am).toLocaleDateString('de-DE')};${a.wiederkehrend}`
    )
    const csv = bom + [kopf, ...zeilen].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aufgabenplan_${filterMonat}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function beispielExport() {
    const bom = '\uFEFF'
    const inhalt = `Objekt;Techniker;Titel;Datum;Häufigkeit\nErnst-Putz-Str. 43;S. Samchenko;Heizung prüfen;15.01.2026;monatlich\nErnst-Putz-Str. 43;;Dach kontrollieren;20.01.2026;jährlich\nErnst-Putz-Str. 43;S. Samchenko;Treppe reinigen;05.01.2026;wöchentlich`
    const blob = new Blob([bom + inhalt], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'aufgabenplan_beispiel.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function statusAendern(id, status) {
    await supabase.from('aufgabenplan').update({ status }).eq('id', id)
    ladeDaten()
  }

  async function loeschen(id) {
    await supabase.from('aufgabenplan').delete().eq('id', id)
    ladeDaten()
  }

  function gefilterteAufgaben() {
    return aufgaben.filter(a => a.faellig_am?.startsWith(filterMonat))
  }

  function statusBadge(status) {
    if (status === 'offen') return { text: 'Offen', bg: '#FEF3CD', color: '#856404' }
    if (status === 'in_arbeit') return { text: 'In Arbeit', bg: '#E8F4FD', color: '#0C5460' }
    if (status === 'erledigt') return { text: 'Erledigt', bg: '#E8F5E9', color: '#2E7D32' }
    return { text: status, bg: '#F1EFE8', color: '#5F5E5A' }
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteAufgaben()

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Aufgabenplan</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setImportOffen(!importOffen)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
            CSV
          </button>
          <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
            + Neu
          </button>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* CSV Import/Export */}
        {importOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>CSV Import / Export</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, padding: '10px 12px', background: '#F8F7F2', borderRadius: 8, lineHeight: 1.8 }}>
              <strong style={{ color: '#2C2C2A' }}>Spalten:</strong> Objekt · Techniker · Titel · Datum · Häufigkeit<br/>
              <strong style={{ color: '#2C2C2A' }}>Datum:</strong> TT.MM.YYYY oder YYYY-MM-DD<br/>
              <strong style={{ color: '#2C2C2A' }}>Häufigkeit:</strong> einmalig · monatlich · quartalsweise · jährlich · wöchentlich · täglich<br/>
              <strong style={{ color: '#2C2C2A' }}>Trennzeichen:</strong> Semikolon oder Komma
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={beispielExport} style={{ height: 36, borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>
                📥 Beispiel-CSV herunterladen
              </button>
              <button onClick={csvExport} style={{ height: 36, borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>
                📤 Aktuellen Plan exportieren
              </button>
              <div onClick={() => csvInputRef.current?.click()}
                style={{ height: 52, borderRadius: 8, border: '1px dashed #D3D1C7', background: '#F8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: '#444441' }}>
                📂 CSV importieren
              </div>
              <input ref={csvInputRef} type="file" accept=".csv" onChange={csvImport} style={{ display: 'none' }} />
              <button onClick={() => setImportOffen(false)} style={{ height: 36, borderRadius: 8, background: 'transparent', color: '#888780', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                Schließen
              </button>
            </div>
          </div>
        )}

        {/* Formular */}
        {formOffen && (
          <form onSubmit={aufgabeAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neue Aufgabe</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Titel der Aufgabe" value={neu.titel} onChange={e => setNeu({...neu, titel: e.target.value})} required />
              <textarea style={{ ...inputStyle, height: 72, padding: '10px 12px', resize: 'none' }} placeholder="Beschreibung (optional)" value={neu.beschreibung} onChange={e => setNeu({...neu, beschreibung: e.target.value})} />
              <select style={inputStyle} value={neu.objekt_id} onChange={e => setNeu({...neu, objekt_id: e.target.value})} required>
                <option value="">Objekt auswählen…</option>
                {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
              </select>
              <select style={inputStyle} value={neu.techniker_id} onChange={e => setNeu({...neu, techniker_id: e.target.value})}>
                <option value="">Techniker auswählen (optional)</option>
                {techniker.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="date" style={inputStyle} value={neu.faellig_am} onChange={e => setNeu({...neu, faellig_am: e.target.value})} required />
              <select style={inputStyle} value={neu.wiederkehrend} onChange={e => setNeu({...neu, wiederkehrend: e.target.value})}>
                <option value="einmalig">Einmalig</option>
                <option value="monatlich">Monatlich</option>
                <option value="quartalsweise">Quartalsweise</option>
                <option value="jaehrlich">Jährlich</option>
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

        {/* Monatsfilter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="month" style={{ ...inputStyle, flex: 1 }} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />
          <span style={{ fontSize: 13, color: '#888780' }}>{gefiltert.length} Aufgaben</span>
        </div>

        {/* Liste */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Aufgaben für diesen Monat</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gefiltert.map(a => {
              const badge = statusBadge(a.status)
              const istUeberfaellig = a.status !== 'erledigt' && new Date(a.faellig_am) < new Date()
              return (
                <div key={a.id} style={{ background: 'white', border: `0.5px solid ${istUeberfaellig ? '#F5C6C2' : '#D3D1C7'}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: istUeberfaellig ? '#C0392B' : '#2C2C2A' }}>{a.titel}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{a.objekt?.strasse} {a.objekt?.hausnummer}</div>
                      {a.beschreibung && <div style={{ fontSize: 12, color: '#5F5E5A', marginTop: 4 }}>{a.beschreibung}</div>}
                      <div style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>
                        Fällig: {new Date(a.faellig_am).toLocaleDateString('de-DE')} · {a.techniker?.name || 'Kein Techniker'} · {a.wiederkehrend}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0, marginLeft: 8 }}>
                      {badge.text}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.status !== 'erledigt' && (
                      <button onClick={() => statusAendern(a.id, a.status === 'offen' ? 'in_arbeit' : 'erledigt')}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#E8F5E9', color: '#2E7D32', border: '0.5px solid #A5D6A7', cursor: 'pointer' }}>
                        {a.status === 'offen' ? 'Starten' : 'Erledigen'}
                      </button>
                    )}
                    <button onClick={() => loeschen(a.id)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>
                      Löschen
                    </button>
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

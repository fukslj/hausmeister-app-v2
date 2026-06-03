import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Einkauf() {
  const navigate = useNavigate()
  const [einkaufe, setEinkaufe] = useState([])
  const [objekte, setObjekte] = useState([])
  const [techniker, setTechniker] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({
    objekt_id: '', artikel: '', menge: 1, einheit: 'Stück',
    preis: '', kategorie: 'sonstiges', notiz: '', gekauft_am: new Date().toISOString().split('T')[0]
  })
  const [speichern, setSpeichern] = useState(false)
  const [filterObjekt, setFilterObjekt] = useState('')
  const [filterKategorie, setFilterKategorie] = useState('')
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: o } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    const { data: t } = await supabase.from('techniker').select('id, name').eq('rolle', 'techniker').order('name')
    const { data: e } = await supabase
      .from('einkauf')
      .select('*, objekt(strasse, hausnummer), techniker(name)')
      .order('gekauft_am', { ascending: false })
    setObjekte(o || [])
    setTechniker(t || [])
    setEinkaufe(e || [])
    setLaden(false)
  }

  async function einkaufAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('einkauf').insert({
      objekt_id: neu.objekt_id,
      techniker_id: user.id,
      artikel: neu.artikel,
      menge: parseFloat(neu.menge),
      einheit: neu.einheit,
      preis: neu.preis ? parseFloat(neu.preis) : null,
      kategorie: neu.kategorie,
      notiz: neu.notiz || null,
      gekauft_am: neu.gekauft_am,
    })
    if (!error) {
      setNeu({ objekt_id: '', artikel: '', menge: 1, einheit: 'Stück', preis: '', kategorie: 'sonstiges', notiz: '', gekauft_am: new Date().toISOString().split('T')[0] })
      setFormOffen(false)
      ladeDaten()
    }
    setSpeichern(false)
  }

  async function loeschen(id) {
    await supabase.from('einkauf').delete().eq('id', id)
    ladeDaten()
  }

  function gefilterteEinkaufe() {
    return einkaufe.filter(e => {
      const monatMatch = e.gekauft_am?.startsWith(filterMonat)
      const objektMatch = !filterObjekt || e.objekt_id === filterObjekt
      const kategorieMatch = !filterKategorie || e.kategorie === filterKategorie
      return monatMatch && objektMatch && kategorieMatch
    })
  }

  function kategorieBadge(kategorie) {
    if (kategorie === 'reinigung') return { bg: '#E8F4FD', color: '#0C5460' }
    if (kategorie === 'streumaterial') return { bg: '#EBF4FD', color: '#1a5276' }
    if (kategorie === 'baumaterial') return { bg: '#FEF9C3', color: '#854D0E' }
    if (kategorie === 'gartenpflege') return { bg: '#E1F5EE', color: '#085041' }
    return { bg: '#F1EFE8', color: '#5F5E5A' }
  }

  function gesamtKosten(liste) {
    return liste.reduce((sum, e) => sum + (e.preis || 0), 0).toFixed(2)
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteEinkaufe()

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Einkäufe</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Einkauf
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Formular */}
        {formOffen && (
          <form onSubmit={einkaufAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neuer Einkauf</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <select style={inputStyle} value={neu.objekt_id} onChange={e => setNeu({...neu, objekt_id: e.target.value})} required>
                <option value="">Objekt auswählen…</option>
                {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
              </select>
              <input style={inputStyle} placeholder="Artikel (z.B. Streusalz 25kg)" value={neu.artikel} onChange={e => setNeu({...neu, artikel: e.target.value})} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder="Menge" value={neu.menge} onChange={e => setNeu({...neu, menge: e.target.value})} required />
                <select style={inputStyle} value={neu.einheit} onChange={e => setNeu({...neu, einheit: e.target.value})}>
                  <option>Stück</option>
                  <option>kg</option>
                  <option>Liter</option>
                  <option>Packung</option>
                  <option>Meter</option>
                  <option>Sack</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder="Preis € (optional)" value={neu.preis} onChange={e => setNeu({...neu, preis: e.target.value})} />
                <input style={inputStyle} type="date" value={neu.gekauft_am} onChange={e => setNeu({...neu, gekauft_am: e.target.value})} required />
              </div>
              <select style={inputStyle} value={neu.kategorie} onChange={e => setNeu({...neu, kategorie: e.target.value})}>
                <option value="reinigung">Reinigung</option>
                <option value="streumaterial">Streumaterial</option>
                <option value="baumaterial">Baumaterial</option>
                <option value="gartenpflege">Gartenpflege</option>
                <option value="sonstiges">Sonstiges</option>
              </select>
              <textarea style={{ ...inputStyle, height: 60, padding: '10px 12px', resize: 'none' }} placeholder="Notiz (optional)" value={neu.notiz} onChange={e => setNeu({...neu, notiz: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </form>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="month" style={inputStyle} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select style={inputStyle} value={filterObjekt} onChange={e => setFilterObjekt(e.target.value)}>
              <option value="">Alle Objekte</option>
              {objekte.map(o => <option key={o.id} value={o.id}>{o.strasse} {o.hausnummer}</option>)}
            </select>
            <select style={inputStyle} value={filterKategorie} onChange={e => setFilterKategorie(e.target.value)}>
              <option value="">Alle Kategorien</option>
              <option value="reinigung">Reinigung</option>
              <option value="streumaterial">Streumaterial</option>
              <option value="baumaterial">Baumaterial</option>
              <option value="gartenpflege">Gartenpflege</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>

        {/* Gesamtkosten */}
        {gefiltert.length > 0 && (
          <div style={{ background: '#444441', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#D3D1C7' }}>{gefiltert.length} Einkäufe</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#F1EFE8' }}>€ {gesamtKosten(gefiltert)}</div>
          </div>
        )}

        {/* Liste */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Einkäufe gefunden</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gefiltert.map(e => {
              const badge = kategorieBadge(e.kategorie)
              return (
                <div key={e.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{e.artikel}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{e.objekt?.strasse} {e.objekt?.hausnummer}</div>
                      <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                        {e.menge} {e.einheit} · {new Date(e.gekauft_am).toLocaleDateString('de-DE')} · {e.techniker?.name || 'Admin'}
                      </div>
                      {e.notiz && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{e.notiz}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      {e.preis && <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>€ {Number(e.preis).toFixed(2)}</div>}
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color }}>{e.kategorie}</span>
                    </div>
                  </div>
                  <button onClick={() => loeschen(e.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>
                    Löschen
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

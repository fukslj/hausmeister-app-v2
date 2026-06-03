import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Einkauf() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [einkaufe, setEinkaufe] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({
    objekt_id: '', artikel: '', menge: 1, einheit: 'Stück',
    preis: '', kategorie: 'sonstiges', notiz: '', gekauft_am: new Date().toISOString().split('T')[0]
  })
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [speichern, setSpeichern] = useState(false)
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    if (profil?.id) ladeDaten()
  }, [profil])

  async function ladeDaten() {
    setLaden(true)
    const { data: tobj } = await supabase.from('techniker_objekt').select('objekt_id').eq('techniker_id', profil.id)
    const objektIds = tobj?.map(t => t.objekt_id) || []
    const { data: o } = await supabase.from('objekt').select('id, strasse, hausnummer')
      .in('id', objektIds.length > 0 ? objektIds : ['00000000-0000-0000-0000-000000000000'])
      .order('strasse')
    const { data: e } = await supabase
      .from('einkauf')
      .select('*, objekt(strasse, hausnummer)')
      .eq('techniker_id', profil.id)
      .order('gekauft_am', { ascending: false })
    setObjekte(o || [])
    setEinkaufe(e || [])
    setLaden(false)
  }

  async function einkaufAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)

    let foto_url = null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const pfad = `${profil.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('einkauf-fotos').upload(pfad, foto)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('einkauf-fotos').getPublicUrl(pfad)
        foto_url = publicUrl
      }
    }

    await supabase.from('einkauf').insert({
      objekt_id: neu.objekt_id,
      techniker_id: profil.id,
      artikel: neu.artikel,
      menge: parseFloat(neu.menge),
      einheit: neu.einheit,
      preis: neu.preis ? parseFloat(neu.preis) : null,
      kategorie: neu.kategorie,
      notiz: neu.notiz || null,
      gekauft_am: neu.gekauft_am,
      foto_url,
    })
    setNeu({ objekt_id: '', artikel: '', menge: 1, einheit: 'Stück', preis: '', kategorie: 'sonstiges', notiz: '', gekauft_am: new Date().toISOString().split('T')[0] })
    setFoto(null)
    setFotoPreview(null)
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  function fotoAuswaehlen(e) {
    const f = e.target.files[0]
    if (f) {
      setFoto(f)
      setFotoPreview(URL.createObjectURL(f))
    }
  }

  function gefilterteEinkaufe() {
    return einkaufe.filter(e => e.gekauft_am?.startsWith(filterMonat))
  }

  function kategorieBadge(kategorie) {
    if (kategorie === 'reinigung') return { bg: '#E8F4FD', color: '#0C5460' }
    if (kategorie === 'streumaterial') return { bg: '#EBF4FD', color: '#1a5276' }
    if (kategorie === 'baumaterial') return { bg: '#FEF9C3', color: '#854D0E' }
    if (kategorie === 'gartenpflege') return { bg: '#E1F5EE', color: '#085041' }
    return { bg: '#F1EFE8', color: '#5F5E5A' }
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C',
    border: '0.5px solid #9FE1CB', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteEinkaufe()
  const gesamtKosten = gefiltert.reduce((sum, e) => sum + (e.preis || 0), 0).toFixed(2)

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Einkäufe</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', cursor: 'pointer' }}>
          + Einkauf
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {formOffen && (
          <form onSubmit={einkaufAnlegen} style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#04342C', marginBottom: 16 }}>Neuer Einkauf</div>
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

              {/* Foto Upload */}
              <label style={{ display: 'flex', height: 60, borderRadius: 8, border: '1px dashed #9FE1CB', background: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: '#0F6E56', gap: 8 }}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="" style={{ height: 50, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    Kassenbon / Foto (optional)
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={fotoAuswaehlen} style={{ display: 'none' }} />
              </label>
              {fotoPreview && (
                <button type="button" onClick={() => { setFoto(null); setFotoPreview(null) }}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.5)', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Foto entfernen
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setFormOffen(false); setFoto(null); setFotoPreview(null) }} style={{ flex: 1, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.5)', color: '#0F6E56', border: '0.5px solid #9FE1CB', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', fontSize: 13, cursor: 'pointer', opacity: speichern ? 0.6 : 1 }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </form>
        )}

        <input type="month" style={inputStyle} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />

        {gefiltert.length > 0 && (
          <div style={{ background: '#0F6E56', borderRadius: 12, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#9FE1CB' }}>{gefiltert.length} Einkäufe</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#E1F5EE' }}>€ {gesamtKosten}</div>
          </div>
        )}

        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Einkäufe für diesen Monat</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gefiltert.map(e => {
              const badge = kategorieBadge(e.kategorie)
              return (
                <div key={e.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: e.foto_url ? 10 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{e.artikel}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{e.objekt?.strasse} {e.objekt?.hausnummer}</div>
                      <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{e.menge} {e.einheit} · {new Date(e.gekauft_am).toLocaleDateString('de-DE')}</div>
                      {e.notiz && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{e.notiz}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      {e.preis && <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>€ {Number(e.preis).toFixed(2)}</div>}
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color }}>{e.kategorie}</span>
                    </div>
                  </div>
                  {e.foto_url && (
                    <img src={e.foto_url} alt="Kassenbon" onClick={() => window.open(e.foto_url, '_blank')}
                      style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

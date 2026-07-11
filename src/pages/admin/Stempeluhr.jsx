import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function StempeluhrAdmin() {
  const navigate = useNavigate()
  const [eintraege, setEintraege] = useState([])
  const [techniker, setTechniker] = useState([])
  const [laden, setLaden] = useState(true)
  const [filterTechniker, setFilterTechniker] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)
  const [filterVon, setFilterVon] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [filterBis, setFilterBis] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: t } = await supabase
      .from('techniker')
      .select('id, name')
      .eq('rolle', 'techniker')
      .order('name')
    setTechniker(t || [])

    const { data: e } = await supabase
      .from('stempeluhr')
      .select('*, techniker(name), stempeluhr_aufgabe(bezeichnung)')
      .not('ausgestempelt_am', 'is', null)
      .order('eingestempelt_am', { ascending: false })
    setEintraege(e || [])
    setLaden(false)
  }

  async function filtern() {
    setLaden(true)
    let query = supabase
      .from('stempeluhr')
      .select('*, techniker(name), stempeluhr_aufgabe(bezeichnung)')
      .not('ausgestempelt_am', 'is', null)
      .gte('eingestempelt_am', filterVon + 'T00:00:00')
      .lte('eingestempelt_am', filterBis + 'T23:59:59')
      .order('eingestempelt_am', { ascending: false })

    if (filterTechniker) query = query.eq('techniker_id', filterTechniker)

    const { data } = await query
    setEintraege(data || [])
    setLaden(false)
  }

  // Wandelt einen ISO-Zeitstempel in einen Wert für datetime-local (lokale Zeit)
  function toLocalInput(iso) {
    const d = new Date(iso)
    const off = d.getTimezoneOffset()
    const local = new Date(d.getTime() - off * 60000)
    return local.toISOString().slice(0, 16)
  }

  function starteBearbeiten(e) {
    setBearbeitenId(e.id)
    setBearbeitenWert({
      eingestempelt_am: toLocalInput(e.eingestempelt_am),
      ausgestempelt_am: toLocalInput(e.ausgestempelt_am),
      notiz: e.notiz || '',
    })
    setLoeschenId(null)
  }

  async function speichern(id) {
    const ein = new Date(bearbeitenWert.eingestempelt_am)
    const aus = new Date(bearbeitenWert.ausgestempelt_am)
    if (aus <= ein) {
      alert('Die Ausstempelzeit muss nach der Einstempelzeit liegen.')
      return
    }
    await supabase.from('stempeluhr').update({
      eingestempelt_am: ein.toISOString(),
      ausgestempelt_am: aus.toISOString(),
      notiz: bearbeitenWert.notiz || null,
    }).eq('id', id)
    setBearbeitenId(null)
    filtern()
  }

  async function loeschen(id) {
    await supabase.from('stempeluhr').delete().eq('id', id)
    setLoeschenId(null)
    filtern()
  }

  function formatDauer(von, bis) {
    const ms = new Date(bis) - new Date(von)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  function gesamtStunden() {
    const ms = eintraege.reduce((sum, e) => {
      if (!e.ausgestempelt_am) return sum
      return sum + (new Date(e.ausgestempelt_am) - new Date(e.eingestempelt_am))
    }, 0)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  const inputStyle = {
    height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Stempeluhr</span>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filter */}
        <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A', marginBottom: 12 }}>Filter</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select style={{ ...inputStyle, width: '100%' }} value={filterTechniker} onChange={e => setFilterTechniker(e.target.value)}>
              <option value="">Alle Techniker</option>
              {techniker.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="date" style={{ ...inputStyle, width: '100%' }} value={filterVon} onChange={e => setFilterVon(e.target.value)} />
              <input type="date" style={{ ...inputStyle, width: '100%' }} value={filterBis} onChange={e => setFilterBis(e.target.value)} />
            </div>
            <button onClick={filtern} style={{ height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Filtern
            </button>
          </div>
        </div>

        {/* Gesamtstunden */}
        {eintraege.length > 0 && (
          <div style={{ background: '#444441', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#D3D1C7' }}>Gesamtstunden</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#F1EFE8' }}>{gesamtStunden()}</div>
          </div>
        )}

        {/* Liste */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : eintraege.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Einträge gefunden</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {eintraege.map(e => {
              if (bearbeitenId === e.id) {
                return (
                  <div key={e.id} style={{ background: 'white', border: '0.5px solid #AFA9EC', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A', marginBottom: 4 }}>{e.techniker?.name}</div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>{e.stempeluhr_aufgabe?.bezeichnung}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Eingestempelt</div>
                        <input type="datetime-local" style={{ ...inputStyle, width: '100%' }} value={bearbeitenWert.eingestempelt_am} onChange={ev => setBearbeitenWert({...bearbeitenWert, eingestempelt_am: ev.target.value})} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Ausgestempelt</div>
                        <input type="datetime-local" style={{ ...inputStyle, width: '100%' }} value={bearbeitenWert.ausgestempelt_am} onChange={ev => setBearbeitenWert({...bearbeitenWert, ausgestempelt_am: ev.target.value})} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Notiz</div>
                        <input style={{ ...inputStyle, width: '100%' }} value={bearbeitenWert.notiz} onChange={ev => setBearbeitenWert({...bearbeitenWert, notiz: ev.target.value})} placeholder="Notiz (optional)" />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={() => setBearbeitenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                        <button onClick={() => speichern(e.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Speichern</button>
                      </div>
                    </div>
                  </div>
                )
              }

              if (loeschenId === e.id) {
                return (
                  <div key={e.id} style={{ background: 'white', border: '0.5px solid #F5C6C2', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', marginBottom: 6 }}>Eintrag wirklich löschen?</div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>{e.techniker?.name} · {new Date(e.eingestempelt_am).toLocaleDateString('de-DE')} · {formatDauer(e.eingestempelt_am, e.ausgestempelt_am)}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setLoeschenId(null)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                      <button onClick={() => loeschen(e.id)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>Ja, löschen</button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={e.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{e.techniker?.name}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{e.stempeluhr_aufgabe?.bezeichnung}</div>
                      <div style={{ fontSize: 11, color: '#B4B2A9', marginTop: 2 }}>
                        {new Date(e.eingestempelt_am).toLocaleDateString('de-DE')} · {new Date(e.eingestempelt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – {new Date(e.ausgestempelt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {e.notiz && <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{e.notiz}</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#444441', background: '#F1EFE8', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                      {formatDauer(e.eingestempelt_am, e.ausgestempelt_am)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => starteBearbeiten(e)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#EEEDFE', color: '#534AB7', border: '0.5px solid #AFA9EC', cursor: 'pointer' }}>Korrigieren</button>
                    <button onClick={() => { setLoeschenId(e.id); setBearbeitenId(null) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
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

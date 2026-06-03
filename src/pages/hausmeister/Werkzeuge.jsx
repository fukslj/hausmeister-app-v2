import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Werkzeuge() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [werkzeuge, setWerkzeuge] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', marke: '', antrieb: 'manuell', lagerort: '', zustand: 'gut', notiz: '' })
  const [speichern, setSpeichern] = useState(false)
  const [filterAntrieb, setFilterAntrieb] = useState('')

  useEffect(() => {
    if (profil?.id) ladeDaten()
  }, [profil])

  async function ladeDaten() {
    setLaden(true)
    const { data: t } = await supabase.from('techniker').select('service_id').eq('id', profil.id).single()
    const { data } = await supabase.from('werkzeug').select('*').eq('service_id', t.service_id).order('name')
    setWerkzeuge(data || [])
    setLaden(false)
  }

  async function speichernWerkzeug(e) {
    e.preventDefault()
    setSpeichern(true)
    const { data: t } = await supabase.from('techniker').select('service_id').eq('id', profil.id).single()
    await supabase.from('werkzeug').insert({
      service_id: t.service_id,
      name: neu.name, marke: neu.marke || null, antrieb: neu.antrieb,
      lagerort: neu.lagerort || null, zustand: neu.zustand, notiz: neu.notiz || null,
    })
    setNeu({ name: '', marke: '', antrieb: 'manuell', lagerort: '', zustand: 'gut', notiz: '' })
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  function antriebBadge(antrieb) {
    if (antrieb === 'akku') return { bg: '#E8F4FD', color: '#0C5460' }
    if (antrieb === 'benzin') return { bg: '#FEF9C3', color: '#854D0E' }
    if (antrieb === 'elektro') return { bg: '#EEEDFE', color: '#534AB7' }
    return { bg: '#F1EFE8', color: '#5F5E5A' }
  }

  function zustandBadge(zustand) {
    if (zustand === 'gut') return { text: 'Gut', bg: '#E8F5E9', color: '#2E7D32' }
    if (zustand === 'reparatur') return { text: 'Reparatur', bg: '#FEF3CD', color: '#856404' }
    if (zustand === 'defekt') return { text: 'Defekt', bg: '#FDECEB', color: '#C0392B' }
    return { text: zustand, bg: '#F1EFE8', color: '#5F5E5A' }
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C',
    border: '0.5px solid #9FE1CB', width: '100%', outline: 'none',
  }

  const gefiltert = filterAntrieb ? werkzeuge.filter(w => w.antrieb === filterAntrieb) : werkzeuge

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Werkzeuge</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', cursor: 'pointer' }}>
          + Werkzeug
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {formOffen && (
          <form onSubmit={speichernWerkzeug} style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#04342C', marginBottom: 16 }}>Neues Werkzeug</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Name (z.B. Rasenmäher)" value={neu.name} onChange={e => setNeu({...neu, name: e.target.value})} required />
              <input style={inputStyle} placeholder="Marke (z.B. Stihl, Bosch)" value={neu.marke} onChange={e => setNeu({...neu, marke: e.target.value})} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select style={inputStyle} value={neu.antrieb} onChange={e => setNeu({...neu, antrieb: e.target.value})}>
                  <option value="manuell">Manuell</option>
                  <option value="akku">Akku</option>
                  <option value="benzin">Benzin</option>
                  <option value="elektro">Elektro</option>
                </select>
                <select style={inputStyle} value={neu.zustand} onChange={e => setNeu({...neu, zustand: e.target.value})}>
                  <option value="gut">Gut</option>
                  <option value="reparatur">Reparatur</option>
                  <option value="defekt">Defekt</option>
                </select>
              </div>
              <input style={inputStyle} placeholder="Lagerort" value={neu.lagerort} onChange={e => setNeu({...neu, lagerort: e.target.value})} />
              <textarea style={{ ...inputStyle, height: 60, padding: '10px 12px', resize: 'none' }} placeholder="Notiz (optional)" value={neu.notiz} onChange={e => setNeu({...neu, notiz: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.5)', color: '#0F6E56', border: '0.5px solid #9FE1CB', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </form>
        )}

        <select style={inputStyle} value={filterAntrieb} onChange={e => setFilterAntrieb(e.target.value)}>
          <option value="">Alle Antriebe</option>
          <option value="manuell">Manuell</option>
          <option value="akku">Akku</option>
          <option value="benzin">Benzin</option>
          <option value="elektro">Elektro</option>
        </select>

        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Werkzeuge gefunden</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gefiltert.map(w => {
              const antrieb = antriebBadge(w.antrieb)
              const zustand = zustandBadge(w.zustand)
              return (
                <div key={w.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{w.name}</div>
                      {w.marke && <div style={{ fontSize: 12, color: '#888780', marginTop: 1 }}>{w.marke}</div>}
                      {w.lagerort && <div style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>📍 {w.lagerort}</div>}
                      {w.notiz && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{w.notiz}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: zustand.bg, color: zustand.color }}>{zustand.text}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: antrieb.bg, color: antrieb.color }}>{w.antrieb}</span>
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

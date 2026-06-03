import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Aufgabenplan() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [aufgaben, setAufgaben] = useState([])
  const [laden, setLaden] = useState(true)
  const [ansichtAufgabe, setAnsichtAufgabe] = useState(null)
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    if (profil?.id) ladeAufgaben()
  }, [profil])

  async function ladeAufgaben() {
    setLaden(true)
    const { data } = await supabase
      .from('aufgabenplan')
      .select('*, objekt(strasse, hausnummer)')
      .eq('techniker_id', profil.id)
      .order('faellig_am')
    setAufgaben(data || [])
    setLaden(false)
  }

  async function statusAendern(id, status) {
    await supabase.from('aufgabenplan').update({ status }).eq('id', id)
    ladeAufgaben()
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
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C',
    border: '0.5px solid #9FE1CB', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteAufgaben()
  const offenAnzahl = aufgaben.filter(a => a.status === 'offen').length
  const erledigtAnzahl = aufgaben.filter(a => a.status === 'erledigt').length

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Mein Aufgabenplan</span>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Metriken */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Offen</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#856404' }}>{offenAnzahl}</div>
          </div>
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Erledigt</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#2E7D32' }}>{erledigtAnzahl}</div>
          </div>
        </div>

        {/* Monatsfilter */}
        <input type="month" style={inputStyle} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />

        {/* Aufgabe Ansehen */}
        {ansichtAufgabe && (
          <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Aufgabe</div>
              <button onClick={() => setAnsichtAufgabe(null)} style={{ fontSize: 12, color: '#0F6E56', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Schließen</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Titel</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#04342C' }}>{ansichtAufgabe.titel}</div>
              </div>
              {ansichtAufgabe.beschreibung && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Beschreibung</div>
                  <div style={{ fontSize: 13, color: '#04342C' }}>{ansichtAufgabe.beschreibung}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Objekt</div>
                  <div style={{ fontSize: 13, color: '#04342C' }}>{ansichtAufgabe.objekt?.strasse} {ansichtAufgabe.objekt?.hausnummer}</div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Fällig am</div>
                  <div style={{ fontSize: 13, color: '#04342C' }}>{new Date(ansichtAufgabe.faellig_am).toLocaleDateString('de-DE')}</div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Häufigkeit</div>
                  <div style={{ fontSize: 13, color: '#04342C' }}>{ansichtAufgabe.wiederkehrend}</div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginBottom: 3 }}>Status</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: ansichtAufgabe.status === 'erledigt' ? '#2E7D32' : ansichtAufgabe.status === 'in_arbeit' ? '#0C5460' : '#856404' }}>
                    {ansichtAufgabe.status === 'offen' ? 'Offen' : ansichtAufgabe.status === 'in_arbeit' ? 'In Arbeit' : 'Erledigt'}
                  </div>
                </div>
              </div>
              {ansichtAufgabe.status !== 'erledigt' && (
                <button onClick={() => { statusAendern(ansichtAufgabe.id, ansichtAufgabe.status === 'offen' ? 'in_arbeit' : 'erledigt'); setAnsichtAufgabe(null) }}
                  style={{ width: '100%', height: 36, borderRadius: 8, background: ansichtAufgabe.status === 'offen' ? '#0F6E56' : '#2E7D32', color: '#E1F5EE', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                  {ansichtAufgabe.status === 'offen' ? 'Starten' : '✓ Als erledigt markieren'}
                </button>
              )}
            </div>
          </div>
        )}

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: istUeberfaellig ? '#C0392B' : '#2C2C2A' }}>{a.titel}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{a.objekt?.strasse} {a.objekt?.hausnummer}</div>
                      {a.beschreibung && <div style={{ fontSize: 12, color: '#5F5E5A', marginTop: 4 }}>{a.beschreibung}</div>}
                      <div style={{ fontSize: 11, color: istUeberfaellig ? '#C0392B' : '#888780', marginTop: 4 }}>
                        {istUeberfaellig ? '⚠ Überfällig · ' : ''}Fällig: {new Date(a.faellig_am).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0, marginLeft: 8 }}>
                      {badge.text}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setAnsichtAufgabe(a)}
                      style={{ flex: 1, height: 36, borderRadius: 8, background: '#F8F7F2', color: '#5F5E5A', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>
                      Ansehen
                    </button>
                    {a.status !== 'erledigt' && (
                      <button onClick={() => statusAendern(a.id, a.status === 'offen' ? 'in_arbeit' : 'erledigt')}
                        style={{ flex: 2, height: 36, borderRadius: 8, background: a.status === 'offen' ? '#E1F5EE' : '#E8F5E9', color: a.status === 'offen' ? '#0F6E56' : '#2E7D32', border: `0.5px solid ${a.status === 'offen' ? '#9FE1CB' : '#A5D6A7'}`, fontSize: 13, cursor: 'pointer' }}>
                        {a.status === 'offen' ? 'Starten' : '✓ Als erledigt markieren'}
                      </button>
                    )}
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

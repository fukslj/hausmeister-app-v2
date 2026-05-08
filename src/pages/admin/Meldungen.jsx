import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Meldungen() {
  const navigate = useNavigate()
  const [meldungen, setMeldungen] = useState([])
  const [laden, setLaden] = useState(true)
  const [filter, setFilter] = useState('alle')
  const { profil } = useAuth()

useEffect(() => { 
  if (profil?.id) ladeMeldungen() 
}, [profil])

  async function ladeMeldungen() {
    setLaden(true)
    const { data } = await supabase
      .from('meldung')
      .select('*, eingang(bezeichnung, objekt(strasse, hausnummer)), meldung_techniker(techniker_id, techniker(name))')
      .order('erstellt_am', { ascending: false })
    setMeldungen(data || [])
    setLaden(false)
  }

  function gefilterteMeldungen() {
    if (filter === 'offen') return meldungen.filter(m => m.status === 'offen')
    if (filter === 'in_arbeit') return meldungen.filter(m => m.status === 'in_arbeit')
    if (filter === 'erledigt') return meldungen.filter(m => m.status === 'erledigt')
    if (filter === 'archiviert') return meldungen.filter(m => m.status === 'archiviert')
    return meldungen.filter(m => m.status !== 'archiviert')
  }

  function statusBadge(m) {
    if (m.status === 'offen') return { text: 'Offen', bg: '#FEF3CD', color: '#856404' }
    if (m.status === 'in_arbeit') return { text: 'In Arbeit', bg: '#E8F4FD', color: '#0C5460' }
    if (m.status === 'erledigt') return { text: 'Erledigt', bg: '#E8F5E9', color: '#2E7D32' }
    if (m.status === 'archiviert') return { text: 'Archiviert', bg: '#F1EFE8', color: '#888780' }
    return { text: m.status, bg: '#F1EFE8', color: '#5F5E5A' }
  }

  const gefiltert = gefilterteMeldungen()

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Alle Meldungen</span>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['alle', 'offen', 'in_arbeit', 'erledigt', 'archiviert'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
              border: '0.5px solid', cursor: 'pointer',
              background: filter === f ? '#444441' : 'transparent',
              color: filter === f ? '#F1EFE8' : '#888780',
              borderColor: filter === f ? '#444441' : '#D3D1C7',
            }}>
              {f === 'alle' ? 'Alle' : f === 'in_arbeit' ? 'In Arbeit' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

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

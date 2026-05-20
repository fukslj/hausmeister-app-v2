import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { registerPush } from '../../lib/push'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profil, abmelden } = useAuth()
  const [meldungen, setMeldungen] = useState([])
  const [laden, setLaden] = useState(true)
  const [filter, setFilter] = useState('alle')

  useEffect(() => {
  if (profil?.id) {
    ladeMeldungen()
    registerPush(supabase, profil.id)
  }
}, [profil])

  async function ladeMeldungen() {
    setLaden(true)
    const { data } = await supabase
      .from('meldung')
      .select('*, eingang(bezeichnung, objekt(strasse, hausnummer)), meldung_techniker(techniker_id)')
      .order('erstellt_am', { ascending: false })
    setMeldungen(data || [])
    setLaden(false)
  }

  function meineMeldungen() {
    return meldungen.filter(m => m.meldung_techniker?.some(t => t.techniker_id === profil?.id))
  }

  function gefilterteMeldungen() {
    if (filter === 'meine') return meineMeldungen()
    if (filter === 'offen') return meldungen.filter(m => m.status === 'offen')
    if (filter === 'erledigt') return meldungen.filter(m => m.status === 'erledigt')
    return meldungen
  }

  function statusBadge(m) {
  const istMeine = m.meldung_techniker?.some(t => t.techniker_id === profil?.id)
  if (m.status === 'erledigt') return { text: 'Erledigt', bg: '#E8F5E9', color: '#2E7D32' }
  if (m.status === 'in_arbeit' && istMeine) return { text: 'Meine Aufgabe', bg: '#E1F5EE', color: '#085041' }
  if (m.status === 'in_arbeit') return { text: 'In Arbeit', bg: '#E8F4FD', color: '#0C5460' }
  if (m.status === 'offen') return { text: 'Offen', bg: '#FEF3CD', color: '#856404' }
  return { text: m.status, bg: '#F1EFE8', color: '#5F5E5A' }
}

  const gefiltert = gefilterteMeldungen()
  const offenAnzahl = meldungen.filter(m => m.status === 'offen').length
  const meineAnzahl = meineMeldungen().length
  const erledigtAnzahl = meldungen.filter(m => m.status === 'erledigt').length

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      {/* Topbar */}
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#9FE1CB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" stroke="#085041" strokeWidth="1.5"/>
              <path d="M3 18c0-3 2.5-5 5-5h8c2.5 0 5 2 5 5" stroke="#085041" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>{profil?.name}</span>
        </div>
        <button onClick={abmelden} style={{ fontSize: 12, color: '#0F6E56', background: 'none', border: 'none', cursor: 'pointer' }}>Abmelden</button>
        <button onClick={() => navigate('/hausmeister/stempeluhr')} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', border: 'none', cursor: 'pointer' }}>
          ⏱ Stempeluhr
        </button>
        <button onClick={() => navigate('/hausmeister/aufgabenplan')} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #9FE1CB', cursor: 'pointer' }}>
          📅 Aufgaben
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        {/* Metriken */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Offen', value: offenAnzahl, color: '#856404' },
            { label: 'Meine', value: meineAnzahl, color: '#085041' },
            { label: 'Erledigt', value: erledigtAnzahl, color: '#2E7D32' },
          ].map(m => (
            <div key={m.label} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['alle', 'meine', 'offen', 'erledigt'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
              border: '0.5px solid', cursor: 'pointer',
              background: filter === f ? '#0F6E56' : 'transparent',
              color: filter === f ? '#E1F5EE' : '#888780',
              borderColor: filter === f ? '#0F6E56' : '#D3D1C7',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
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

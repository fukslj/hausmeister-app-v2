import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profil, abmelden } = useAuth()
  const [meldungen, setMeldungen] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [filter, setFilter] = useState('alle')
  const [aktivesObjekt, setAktivesObjekt] = useState(null)

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
    setMeldungen(m || [])
    setObjekte(z?.map(z => z.objekt) || [])
    setLaden(false)
  }

  function gefilterteMeldungen() {
    let liste = meldungen

    if (aktivesObjekt) {
      liste = liste.filter(m => m.eingang?.objekt_id === aktivesObjekt)
    }

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
        <button onClick={abmelden} style={{ fontSize: 12, color: '#534AB7', background: 'none', border: 'none', cursor: 'pointer' }}>Abmelden</button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

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
              <div
                onClick={() => setAktivesObjekt(null)}
                style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                  background: aktivesObjekt === null ? '#534AB7' : '#EEEDFE',
                  color: aktivesObjekt === null ? '#EEEDFE' : '#534AB7',
                  border: '0.5px solid #AFA9EC' }}>
                Alle
              </div>
              {objekte.map(o => (
                <div key={o.id}
                  onClick={() => setAktivesObjekt(aktivesObjekt === o.id ? null : o.id)}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    background: aktivesObjekt === o.id ? '#534AB7' : '#EEEDFE',
                    color: aktivesObjekt === o.id ? '#EEEDFE' : '#534AB7',
                    border: '0.5px solid #AFA9EC' }}>
                  {o.strasse} {o.hausnummer}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['alle', 'offen', 'in_arbeit', 'erledigt'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
              border: '0.5px solid', cursor: 'pointer',
              background: filter === f ? '#534AB7' : 'transparent',
              color: filter === f ? '#EEEDFE' : '#888780',
              borderColor: filter === f ? '#534AB7' : '#D3D1C7',
            }}>
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

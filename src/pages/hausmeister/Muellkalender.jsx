import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Muellkalender() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [termine, setTermine] = useState([])
  const [laden, setLaden] = useState(true)
  const [meldeFormOffen, setMeldeFormOffen] = useState(false)
  const [meldungTermin, setMeldungTermin] = useState(null)
  const [muellEmail, setMuellEmail] = useState('')
  const [meldungText, setMeldungText] = useState('')
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    if (profil?.id) ladeTermine()
  }, [profil])

  async function ladeTermine() {
    setLaden(true)
    // Objekte des Technikers laden
    const { data: objekte } = await supabase
      .from('techniker_objekt')
      .select('objekt_id')
      .eq('techniker_id', profil.id)

    if (!objekte?.length) {
      setLaden(false)
      return
    }

    const objektIds = objekte.map(o => o.objekt_id)
    const { data } = await supabase
      .from('muell_termin')
      .select('*, objekt(strasse, hausnummer)')
      .in('objekt_id', objektIds)
      .order('datum')
    setTermine(data || [])
    setLaden(false)
  }

  function gefilterteTermine() {
    return termine.filter(t => t.datum?.startsWith(filterMonat))
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
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C',
    border: '0.5px solid #9FE1CB', width: '100%', outline: 'none',
  }

  const gefiltert = gefilterteTermine()
  const heute = new Date().toISOString().split('T')[0]
  const terminHeute = termine.filter(t => t.datum === heute).length

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Müllkalender</span>
        {terminHeute > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#C0392B', color: 'white' }}>
            {terminHeute} heute
          </span>
        )}
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Meldung ans Müllunternehmen */}
        {meldeFormOffen && meldungTermin && (
          <div style={{ background: '#FDECEB', border: '0.5px solid #F5C6C2', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#C0392B', marginBottom: 4 }}>Meldung ans Müllunternehmen</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 16 }}>{meldungTermin.fraktion} · {new Date(meldungTermin.datum).toLocaleDateString('de-DE')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input style={{ ...inputStyle, borderColor: '#F5C6C2' }} type="email" placeholder="E-Mail des Müllunternehmens" value={muellEmail} onChange={e => setMuellEmail(e.target.value)} />
              <textarea style={{ ...inputStyle, height: 80, padding: '10px 12px', resize: 'none', borderColor: '#F5C6C2' }} placeholder="z.B. Tonne wurde nicht geleert, Tonne ist defekt…" value={meldungText} onChange={e => setMeldungText(e.target.value)} />
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

        {/* Monatsfilter */}
        <input type="month" style={inputStyle} value={filterMonat} onChange={e => setFilterMonat(e.target.value)} />

        {/* Termine */}
        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Laden…</div>
        ) : gefiltert.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Keine Termine für diesen Monat</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gefiltert.map(t => {
              const farbe = fraktionFarbe(t.fraktion)
              const istHeute = t.datum === heute
              const istVergangen = new Date(t.datum) < new Date() && !istHeute
              return (
                <div key={t.id} style={{ background: 'white', border: `0.5px solid ${istHeute ? '#F5C6C2' : '#D3D1C7'}`, borderRadius: 12, padding: '14px 16px', opacity: istVergangen ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: farbe.bg, color: farbe.color, border: `0.5px solid ${farbe.border}` }}>
                          {t.fraktion}
                        </span>
                        {istHeute && <span style={{ fontSize: 11, fontWeight: 700, color: '#C0392B' }}>⚠ Heute!</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{t.objekt?.strasse} {t.objekt?.hausnummer}</div>
                      <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>
                        {new Date(t.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      {t.notiz && <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{t.notiz}</div>}
                    </div>
                    <button onClick={() => { setMeldungTermin(t); setMeldeFormOffen(true) }}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer', flexShrink: 0 }}>
                      Problem melden
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Stempeluhr() {
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [aktuellerEintrag, setAktuellerEintrag] = useState(null)
  const [aufgaben, setAufgaben] = useState([])
  const [ausgewaehlteAufgabe, setAusgewaehlteAufgabe] = useState('')
  const [notiz, setNotiz] = useState('')
  const [verlauf, setVerlauf] = useState([])
  const [laden, setLaden] = useState(true)
  const [uhrzeit, setUhrzeit] = useState(new Date())

  useEffect(() => {
    if (profil?.id) {
      ladeStatus()
      ladeAufgaben()
      ladeVerlauf()
    }
    const timer = setInterval(() => setUhrzeit(new Date()), 1000)
    return () => clearInterval(timer)
  }, [profil])

  async function ladeAufgaben() {
    const { data } = await supabase
      .from('stempeluhr_aufgabe')
      .select('*')
      .eq('aktiv', true)
      .order('bezeichnung')
    setAufgaben(data || [])
  }

  async function ladeStatus() {
    const { data } = await supabase
      .from('stempeluhr')
      .select('*, stempeluhr_aufgabe(bezeichnung)')
      .eq('techniker_id', profil.id)
      .is('ausgestempelt_am', null)
      .single()
    setAktuellerEintrag(data || null)
    setLaden(false)
  }

  async function ladeVerlauf() {
    const { data } = await supabase
      .from('stempeluhr')
      .select('*, stempeluhr_aufgabe(bezeichnung)')
      .eq('techniker_id', profil.id)
      .not('ausgestempelt_am', 'is', null)
      .order('eingestempelt_am', { ascending: false })
      .limit(10)
    setVerlauf(data || [])
  }

  async function einstempeln() {
    if (!ausgewaehlteAufgabe) return
    const { data } = await supabase
      .from('stempeluhr')
      .insert({
        techniker_id: profil.id,
        aufgabe_id: ausgewaehlteAufgabe,
        notiz: notiz.trim() || null,
      })
      .select()
      .single()
    setAktuellerEintrag(data)
    setNotiz('')
    ladeVerlauf()
  }

  async function ausstempeln() {
    await supabase
      .from('stempeluhr')
      .update({ ausgestempelt_am: new Date().toISOString() })
      .eq('id', aktuellerEintrag.id)
    setAktuellerEintrag(null)
    ladeVerlauf()
  }

  function formatDauer(von, bis) {
    const ms = new Date(bis) - new Date(von)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  function formatLaufzeit() {
    if (!aktuellerEintrag) return ''
    const ms = new Date() - new Date(aktuellerEintrag.eingestempelt_am)
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const inputStyle = {
    height: 44, padding: '0 14px', borderRadius: 10, fontSize: 14,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      {/* Topbar */}
      <div style={{ background: '#E1F5EE', padding: '14px 20px', borderBottom: '0.5px solid #5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/hausmeister')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#04342C' }}>Stempeluhr</span>
        </div>
        <span style={{ fontSize: 13, color: '#0F6E56', fontVariantNumeric: 'tabular-nums' }}>
          {uhrzeit.toLocaleTimeString('de-DE')}
        </span>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {laden ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>Laden…</div>
        ) : aktuellerEintrag ? (
          /* Eingestempelt */
          <div style={{ background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: 8 }}>Eingestempelt seit</div>
            <div style={{ fontSize: 48, fontWeight: 500, color: '#04342C', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
              {formatLaufzeit()}
            </div>
            <div style={{ fontSize: 13, color: '#0F6E56', marginBottom: 6 }}>
              {aktuellerEintrag.stempeluhr_aufgabe?.bezeichnung}
            </div>
            <div style={{ fontSize: 12, color: '#1D9E75', marginBottom: 24 }}>
              seit {new Date(aktuellerEintrag.eingestempelt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </div>
            <button onClick={ausstempeln} style={{ width: '100%', height: 52, borderRadius: 12, background: '#04342C', color: '#E1F5EE', fontSize: 16, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Ausstempeln
            </button>
          </div>
        ) : (
          /* Ausgestempelt */
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A', marginBottom: 6 }}>Einstempeln</div>
            <div style={{ fontSize: 13, color: '#888780', marginBottom: 20 }}>Wähle eine Aufgabe und stempel ein</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <select style={inputStyle} value={ausgewaehlteAufgabe} onChange={e => setAusgewaehlteAufgabe(e.target.value)}>
                <option value="">Aufgabe auswählen…</option>
                {aufgaben.map(a => (
                  <option key={a.id} value={a.id}>{a.bezeichnung}</option>
                ))}
              </select>
              <input
                style={inputStyle}
                placeholder="Notiz (optional)"
                value={notiz}
                onChange={e => setNotiz(e.target.value)}
              />
            </div>

            <button
              onClick={einstempeln}
              disabled={!ausgewaehlteAufgabe}
              style={{ width: '100%', height: 52, borderRadius: 12, background: '#0F6E56', color: '#E1F5EE', fontSize: 16, fontWeight: 500, border: 'none', cursor: ausgewaehlteAufgabe ? 'pointer' : 'not-allowed', opacity: ausgewaehlteAufgabe ? 1 : 0.4 }}>
              Einstempeln
            </button>
          </div>
        )}

        {/* Verlauf */}
        {verlauf.length > 0 && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #D3D1C7', fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>Letzte Einträge</div>
            {verlauf.map((e, i) => (
              <div key={e.id} style={{ padding: '12px 16px', borderBottom: i < verlauf.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>{e.stempeluhr_aufgabe?.bezeichnung}</div>
                    <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>
                      {new Date(e.eingestempelt_am).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} · {new Date(e.eingestempelt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – {new Date(e.ausgestempelt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {e.notiz && <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{e.notiz}</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#0F6E56', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20 }}>
                    {formatDauer(e.eingestempelt_am, e.ausgestempelt_am)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

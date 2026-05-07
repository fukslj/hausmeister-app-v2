import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PasswortReset() {
  const navigate = useNavigate()
  const [passwort, setPasswort] = useState('')
  const [bestaetigung, setBestaetigung] = useState('')
  const [fehler, setFehler] = useState('')
  const [laden, setLaden] = useState(false)
  const [fertig, setFertig] = useState(false)

  async function speichern(e) {
    e.preventDefault()
    if (passwort !== bestaetigung) { setFehler('Passwörter stimmen nicht überein'); return }
    if (passwort.length < 6) { setFehler('Passwort muss mindestens 6 Zeichen haben'); return }
    setLaden(true)
    setFehler('')
    const { error } = await supabase.auth.updateUser({ password: passwort })
    setLaden(false)
    if (error) { setFehler('Fehler: ' + error.message); return }
    setFertig(true)
    setTimeout(() => navigate('/login/hausverwaltung'), 3000)
  }

  const inputStyle = {
    height: 44, padding: '0 14px', borderRadius: 10, fontSize: 14,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 16, padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#3C3489" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {fertig ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>Passwort gespeichert</div>
            <div style={{ fontSize: 13, color: '#888780' }}>Sie werden in wenigen Sekunden weitergeleitet…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A', marginBottom: 6 }}>Neues Passwort</div>
            <div style={{ fontSize: 13, color: '#888780', marginBottom: 28 }}>Geben Sie Ihr neues Passwort ein</div>

            <form onSubmit={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>Neues Passwort</label>
                <input type="password" value={passwort} onChange={e => setPasswort(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>Passwort bestätigen</label>
                <input type="password" value={bestaetigung} onChange={e => setBestaetigung(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>

              {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8 }}>{fehler}</div>}

              <button type="submit" disabled={laden} style={{ height: 44, borderRadius: 10, background: '#534AB7', color: '#EEEDFE', fontSize: 14, fontWeight: 500, border: 'none', cursor: laden ? 'not-allowed' : 'pointer', opacity: laden ? 0.6 : 1, marginTop: 4 }}>
                {laden ? 'Wird gespeichert…' : 'Passwort speichern'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

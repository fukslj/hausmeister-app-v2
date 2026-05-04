import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function HausverwaltungLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState('')
  const [laden, setLaden] = useState(false)

  async function anmelden(e) {
    e.preventDefault()
    setFehler('')
    setLaden(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort })
    setLaden(false)
    if (error) { setFehler('Ungültige Zugangsdaten'); return }
    navigate('/hausverwaltung')
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 10, fontSize: 13,
    fontFamily: 'var(--font)', background: 'white', color: '#26215C',
    border: '0.5px solid #AFA9EC', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', display: 'flex' }}>
      {/* Links */}
      <div style={{ flex: 1, background: 'var(--hv-bg)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <span onClick={() => navigate('/')} style={{ fontSize: 12, color: '#534AB7', cursor: 'pointer' }}>← Zurück</span>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px 0 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="10" width="18" height="11" rx="2" stroke="#3C3489" strokeWidth="1.5"/>
              <path d="M9 21V15h6v6" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 10l9-7 9 7" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 500, color: '#26215C', marginBottom: 8 }}>Hausverwaltung</div>
          <div style={{ fontSize: 14, color: '#534AB7', lineHeight: 1.6 }}>Verwalten Sie Ihre Liegenschaften, verfolgen Sie Meldungen und koordinieren Sie Aufgaben — alles an einem Ort.</div>
        </div>
        <div style={{ fontSize: 12, color: '#7F77DD' }}>Nur für autorisierte Hausverwaltungen</div>
      </div>

      {/* Rechts */}
      <div style={{ flex: 1, background: 'white', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#1A1A18', marginBottom: 6 }}>Anmelden</div>
        <div style={{ fontSize: 13, color: '#888780', marginBottom: 32 }}>Geben Sie Ihre Zugangsdaten ein</div>

        <form onSubmit={anmelden} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>E-Mail-Adresse</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="verwaltung@beispiel.de" required style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>Passwort</label>
            <input type="password" value={passwort} onChange={e => setPasswort(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>

          <span style={{ fontSize: 12, color: '#7F77DD', textAlign: 'right', cursor: 'pointer' }}>Passwort vergessen?</span>

          {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8 }}>{fehler}</div>}

          <button type="submit" disabled={laden} style={{ height: 40, borderRadius: 10, background: '#534AB7', color: '#EEEDFE', fontSize: 14, fontWeight: 500, border: 'none', cursor: laden ? 'not-allowed' : 'pointer', opacity: laden ? 0.6 : 1, marginTop: 4 }}>
            {laden ? 'Wird angemeldet…' : 'Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}

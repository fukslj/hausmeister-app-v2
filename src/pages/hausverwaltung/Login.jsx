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
    height: 44, padding: '0 14px', borderRadius: 10, fontSize: 14,
    fontFamily: 'var(--font)', background: 'rgba(255,255,255,0.7)', color: '#26215C',
    border: '0.5px solid #AFA9EC', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @media (max-width: 600px) {
          .hv-left { display: none !important; }
          .hv-right { 
            flex: 1 !important; 
            background: #EEEDFE !important;
            padding: 60px 28px 40px !important; 
            justify-content: flex-start !important;
          }
          .hv-input {
            background: rgba(255,255,255,0.7) !important;
          }
          .hv-btn {
            background: #3C3489 !important;
          }
        }
      `}</style>

      {/* Links — nur Desktop */}
      <div className="hv-left" style={{ flex: 1, background: '#EEEDFE', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
      <div className="hv-right" style={{ flex: 1, background: 'white', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span onClick={() => navigate('/')} style={{ fontSize: 12, color: '#534AB7', cursor: 'pointer', marginBottom: 40, display: 'block' }}>← Zurück</span>

        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="10" width="18" height="11" rx="2" stroke="#3C3489" strokeWidth="1.5"/>
            <path d="M9 21V15h6v6" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 10l9-7 9 7" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#534AB7', marginBottom: 6 }}>Hausverwaltung</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: '#26215C', marginBottom: 4 }}>Anmelden</div>
        <div style={{ fontSize: 13, color: '#534AB7', marginBottom: 32 }}>Geben Sie Ihre Zugangsdaten ein</div>

        <form onSubmit={anmelden} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>E-Mail-Adresse</label>
            <input className="hv-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="verwaltung@beispiel.de" required style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#534AB7' }}>Passwort</label>
            <input className="hv-input" type="password" value={passwort} onChange={e => setPasswort(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>

          <span style={{ fontSize: 12, color: '#7F77DD', textAlign: 'right', cursor: 'pointer' }}>Passwort vergessen?</span>

          {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>{fehler}</div>}

          <button className="hv-btn" type="submit" disabled={laden} style={{ height: 44, borderRadius: 10, background: '#534AB7', color: '#EEEDFE', fontSize: 14, fontWeight: 500, border: 'none', cursor: laden ? 'not-allowed' : 'pointer', opacity: laden ? 0.6 : 1, marginTop: 4 }}>
            {laden ? 'Wird angemeldet…' : 'Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}

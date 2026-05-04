import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SuperadminLogin() {
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
    navigate('/admin')
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 10, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F1EFE8', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#F1EFE8', padding: '20px 40px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="#5F5E5A" strokeWidth="1.5"/>
              <path d="M4 20c0-3.5 3-6 8-6s8 2.5 8 6" stroke="#5F5E5A" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M19 2l.8 1.8L22 4.5l-1.8 1.8.3 2.2L19 7.4l-1.5 1.1.3-2.2L16 4.5l2.2-.7L19 2Z" stroke="#5F5E5A" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5F5E5A' }}>Systemadministration</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A' }}>Superadmin-Zugang</div>
          </div>
        </div>
        <span onClick={() => navigate('/')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
      </div>

      {/* Formular */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A', marginBottom: 6 }}>Anmelden</div>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 28 }}>Nur für autorisierte Systemadministratoren</div>

          <form onSubmit={anmelden} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A' }}>E-Mail-Adresse</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@system.de" required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A' }}>Passwort</label>
              <input type="password" value={passwort} onChange={e => setPasswort(e.target.value)} placeholder="••••••••" required style={inputStyle} />
            </div>

            {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8 }}>{fehler}</div>}

            <button type="submit" disabled={laden} style={{ height: 40, borderRadius: 10, background: '#444441', color: '#F1EFE8', fontSize: 14, fontWeight: 500, border: 'none', cursor: laden ? 'not-allowed' : 'pointer', opacity: laden ? 0.6 : 1, marginTop: 4 }}>
              {laden ? 'Wird angemeldet…' : 'Anmelden →'}
            </button>
          </form>

          {/* Warnhinweis */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, padding: '10px 12px', borderRadius: 8, background: '#FEF3CD', border: '0.5px solid #F0C040' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 9v4M12 17h.01" stroke="#856404" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10.3 4.3L3 18h18L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="#856404" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 12, color: '#856404', lineHeight: 1.5 }}>Dieser Bereich ist nur für Systemadministratoren. Unbefugter Zugriff wird protokolliert.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

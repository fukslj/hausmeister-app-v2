import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export default function Startseite() {
  const navigate = useNavigate()
  const { profil } = useAuth()

  useEffect(() => {
    if (!profil) return
    if (profil.typ === 'hausverwaltung') navigate('/hausverwaltung')
    else if (profil.typ === 'hausmeister') navigate('/hausmeister')
    else if (profil.typ === 'superadmin') navigate('/admin')
  }, [profil, navigate])

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 480, margin: '0 auto' }}>

        <div onClick={() => navigate('/login/hausverwaltung')}
          style={{ flex: 1, background: 'var(--hv-bg)', borderBottom: '0.5px solid #AFA9EC', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.96)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="10" width="18" height="11" rx="2" stroke="#3C3489" strokeWidth="1.5"/>
                <path d="M9 21V15h6v6" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 10l9-7 9 7" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#534AB7', marginBottom: 3 }}>Hausverwaltung</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#26215C', marginBottom: 2 }}>Für Verwalter</div>
              <div style={{ fontSize: 12, color: '#534AB7' }}>Liegenschaften und Meldungen im Überblick</div>
            </div>
          </div>
          <span style={{ fontSize: 18, opacity: 0.35, color: '#3C3489', flexShrink: 0 }}>→</span>
        </div>

        <div onClick={() => navigate('/login/hausmeister')}
          style={{ flex: 1, background: 'var(--hm-bg)', borderBottom: '0.5px solid #5DCAA5', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.96)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#9FE1CB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" stroke="#085041" strokeWidth="1.5"/>
                <path d="M3 18c0-3 2.5-5 5-5h1l1.5 2h3L15 13h1c2.5 0 5 2 5 5" stroke="#085041" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="18.5" cy="14.5" r="3" stroke="#085041" strokeWidth="1.4"/>
                <path d="M18.5 13v1.5l1 1" stroke="#085041" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: 3 }}>Hausmeisterservice</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#04342C', marginBottom: 2 }}>Für Hausmeister</div>
              <div style={{ fontSize: 12, color: '#0F6E56' }}>Meldungen übernehmen und erledigen</div>
            </div>
          </div>
          <span style={{ fontSize: 18, opacity: 0.35, color: '#085041', flexShrink: 0 }}>→</span>
        </div>

        <div onClick={() => navigate('/login/admin')}
          style={{ background: 'var(--admin-bg)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: '#D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3" stroke="#5F5E5A" strokeWidth="1.5"/>
                <path d="M4 20c0-3.5 3-6 8-6s8 2.5 8 6" stroke="#5F5E5A" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M19 2l.8 1.8L22 4.5l-1.8 1.8.3 2.2L19 7.4l-1.5 1.1.3-2.2L16 4.5l2.2-.7L19 2Z" stroke="#5F5E5A" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5F5E5A' }}>Systemadministration</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>Superadmin</div>
            </div>
          </div>
          <span style={{ fontSize: 13, opacity: 0.35, color: '#444441' }}>→</span>
        </div>

      </div>
    </div>
  )
}
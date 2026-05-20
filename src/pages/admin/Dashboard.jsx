import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { abmelden } = useAuth()

  const menuItems = [
  { label: 'Alle Meldungen', sub: 'Übersicht und Archivieren', icon: '📋', path: '/admin/meldungen' },
  { label: 'Hausmeisterservice', sub: 'Service anlegen und verwalten', icon: '🔧', path: '/admin/service' },
  { label: 'Objekte', sub: 'Gebäude und Eingänge', icon: '🏢', path: '/admin/objekte' },
  { label: 'Techniker', sub: 'Mitarbeiter und PINs', icon: '👷', path: '/admin/techniker' },
  { label: 'Hausverwaltungen', sub: 'Zugänge und Zuweisung', icon: '🏠', path: '/admin/hausverwaltungen' },
  { label: 'Stempeluhr', sub: 'Arbeitszeiten der Techniker', icon: '⏱', path: '/admin/stempeluhr' },
]

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" stroke="#5F5E5A" strokeWidth="1.5"/>
              <path d="M4 20c0-3.5 3-6 8-6s8 2.5 8 6" stroke="#5F5E5A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Superadmin</span>
        </div>
        <button onClick={abmelden} style={{ fontSize: 12, color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>Abmelden</button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A', marginBottom: 4, marginTop: 8 }}>Verwaltung</div>
        <div style={{ fontSize: 13, color: '#888780', marginBottom: 20 }}>Was möchtest du verwalten?</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8F7F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
              <span style={{ fontSize: 16, opacity: 0.3, color: '#444441' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

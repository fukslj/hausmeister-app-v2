import { useNavigate, useParams, useLocation } from 'react-router-dom'

export default function Bestaetigung() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ background: '#F1EFE8', padding: '16px 24px', borderBottom: '0.5px solid #D3D1C7' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: 'white', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Defekt melden
          </div>
        </div>

        {/* Inhalt */}
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>

          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L19 7" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ fontSize: 20, fontWeight: 500, color: '#2C2C2A' }}>Meldung eingegangen</div>

          <div style={{ fontSize: 14, color: '#5F5E5A', lineHeight: 1.6, maxWidth: 280 }}>
            {state?.name ? `Vielen Dank, ${state.name}.` : 'Vielen Dank.'} Der Hausmeisterservice wurde informiert und kümmert sich darum.
          </div>

          <div style={{ width: '100%', background: '#F1EFE8', borderRadius: 10, padding: '14px 16px', textAlign: 'left' }}>
            {state?.beschreibung && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #D3D1C7' }}>
                <span style={{ fontSize: 12, color: '#888780' }}>Meldung</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#2C2C2A', maxWidth: 200, textAlign: 'right' }}>{state.beschreibung}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 12, color: '#888780' }}>Eingegangen</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#2C2C2A' }}>{new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/melden/${qrToken}`)}
            style={{ width: '100%', height: 48, borderRadius: 10, background: 'white', color: '#5F5E5A', fontSize: 14, fontWeight: 500, border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
            Weiteren Defekt melden
          </button>

          <div style={{ fontSize: 11, color: '#B4B2A9' }}>Sie können diese Seite jetzt schließen.</div>

        </div>
      </div>
    </div>
  )
}
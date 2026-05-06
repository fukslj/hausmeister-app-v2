import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function HausmeisterLogin() {
  const navigate = useNavigate()
  const [pin, setPin] = useState(['', '', '', ''])
  const [fehler, setFehler] = useState('')
  const [laden, setLaden] = useState(false)
  const inputs = useRef([])
  const istTouch = window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    if (!istTouch) inputs.current[0]?.focus()
  }, [])

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const neu = [...pin]
      if (neu[index]) { neu[index] = ''; setPin(neu) }
      else if (index > 0) { neu[index - 1] = ''; setPin(neu); inputs.current[index - 1]?.focus() }
    }
  }

  function handleInput(index, e) {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    e.target.value = ''
    if (!val) return
    const neu = [...pin]; neu[index] = val; setPin(neu)
    if (index < 3) setTimeout(() => inputs.current[index + 1]?.focus(), 0)
    else if (neu.every(d => d)) anmeldenMitPin(neu.join(''))
  }

  function pressNum(v) {
    if (v === 'del') {
      const letzterIndex = [...pin].map((d, i) => d ? i : -1).filter(i => i >= 0).pop() ?? -1
      if (letzterIndex >= 0) { const neu = [...pin]; neu[letzterIndex] = ''; setPin(neu) }
      return
    }
    const ersterLeer = pin.findIndex(d => !d)
    if (ersterLeer === -1) return
    const neu = [...pin]; neu[ersterLeer] = v; setPin(neu)
    if (ersterLeer === 3) anmeldenMitPin(neu.join(''))
  }

  async function anmeldenMitPin(pinWert) {
    setFehler('')
    setLaden(true)
    const { data, error } = await supabase.rpc('login_mit_pin', { pin_eingabe: pinWert })
    if (error || !data) {
      setFehler('Ungültige PIN')
      setPin(['', '', '', ''])
      inputs.current[0]?.focus()
      setLaden(false)
      return
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: data.email, password: pinWert })
    setLaden(false)
    if (loginError) { setFehler('Ungültige PIN'); setPin(['', '', '', '']); inputs.current[0]?.focus(); return }
    navigate('/hausmeister')
  }

  const pinVoll = pin.every(d => d)

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @media (max-width: 600px) {
          .hm-left { display: none !important; }
          .hm-right { flex: 1 !important; padding: 40px 24px !important; justify-content: flex-start !important; padding-top: 60px !important; }
        }
      `}</style>

      {/* Links */}
      <div className="hm-left" style={{ flex: 1, background: 'var(--hm-bg)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <span onClick={() => navigate('/')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>← Zurück</span>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: '#9FE1CB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px 0 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" stroke="#085041" strokeWidth="1.5"/>
              <path d="M3 18c0-3 2.5-5 5-5h1l1.5 2h3L15 13h1c2.5 0 5 2 5 5" stroke="#085041" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18.5" cy="14.5" r="3" stroke="#085041" strokeWidth="1.4"/>
              <path d="M18.5 13v1.5l1 1" stroke="#085041" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 500, color: '#04342C', marginBottom: 8 }}>Hausmeisterservice</div>
          <div style={{ fontSize: 14, color: '#0F6E56', lineHeight: 1.6 }}>PIN vom Superadmin eingeben und direkt loslegen — kein Passwort, keine E-Mail.</div>
        </div>
        <div style={{ fontSize: 12, color: '#1D9E75' }}>Nur für Mitarbeiter des Hausmeisterservice</div>
      </div>

      {/* Rechts */}
      <div className="hm-right" style={{ flex: 1, background: 'white', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span onClick={() => navigate('/')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer', marginBottom: 32, display: 'block' }}>← Zurück</span>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#1A1A18', marginBottom: 6 }}>PIN eingeben</div>
        <div style={{ fontSize: 13, color: '#888780', marginBottom: 36 }}>Ihre 4-stellige PIN wurde Ihnen mitgeteilt</div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
          {pin.map((digit, i) => (
            <input key={i} ref={el => inputs.current[i] = el}
              type="password" inputMode="numeric" maxLength={1}
              value={digit ? '•' : ''} readOnly={false}
              onKeyDown={e => handleKeyDown(i, e)}
              onInput={e => handleInput(i, e)}
              onFocus={() => { const next = pin.findIndex(d => !d); if (next !== -1 && next !== i) inputs.current[next]?.focus() }}
              style={{ width: 56, height: 64, borderRadius: 10, textAlign: 'center', fontSize: 28, fontWeight: 500, fontFamily: 'var(--font)', background: '#F8F7F2', color: '#04342C', border: digit ? '1.5px solid #1D9E75' : '0.5px solid #D3D1C7', outline: 'none', caretColor: 'transparent' }}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto 20px' }}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
            k === '' ? <div key={i} /> :
            <button key={i} onClick={() => pressNum(k)} style={{ height: 48, borderRadius: 10, background: '#F8F7F2', border: '0.5px solid #D3D1C7', fontSize: k === 'del' ? 14 : 18, fontWeight: 500, color: k === 'del' ? '#888780' : '#1A1A18', fontFamily: 'var(--font)' }}>
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>

        {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8, marginBottom: 12 }}>{fehler}</div>}

        <button disabled={!pinVoll || laden} onClick={() => anmeldenMitPin(pin.join(''))}
          style={{ height: 40, borderRadius: 10, background: '#0F6E56', color: '#E1F5EE', fontSize: 14, fontWeight: 500, border: 'none', opacity: (pinVoll && !laden) ? 1 : 0.4, cursor: (pinVoll && !laden) ? 'pointer' : 'not-allowed' }}>
          {laden ? 'Wird angemeldet…' : 'Anmelden →'}
        </button>
      </div>
    </div>
  )
}

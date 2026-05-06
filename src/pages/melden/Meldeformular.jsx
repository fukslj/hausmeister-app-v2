import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const MAX_FOTOS = 5

export default function Meldeformular() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [eingang, setEingang] = useState(null)
  const [laden, setLaden] = useState(true)
  const [name, setName] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [fotos, setFotos] = useState([])
  const [senden, setSenden] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => { ladeEingang() }, [qrToken])

  async function ladeEingang() {
    const { data } = await supabase
      .from('eingang')
      .select('*, objekt(strasse, hausnummer)')
      .eq('qr_token', qrToken)
      .eq('aktiv', true)
      .single()
    setEingang(data)
    setLaden(false)
  }

  function fotoHinzufuegen(e) {
    const files = Array.from(e.target.files)
    const neu = files.slice(0, MAX_FOTOS - fotos.length).map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }))
    setFotos(prev => [...prev, ...neu])
    e.target.value = ''
  }

  function fotoEntfernen(index) {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  async function absenden(e) {
    e.preventDefault()
    if (!name.trim()) { setFehler('Bitte geben Sie Ihren Namen ein'); return }
    setSenden(true)
    setFehler('')

    if (!eingang?.id) {
      setFehler('Kein Eingang gefunden')
      setSenden(false)
      return
    }

    const { data: meldungId, error } = await supabase
      .rpc('meldung_erstellen', {
        p_eingang_id: eingang.id,
        p_melder_name: name.trim(),
        p_beschreibung: beschreibung.trim() || null,
      })

    if (error) {
      setFehler('Fehler: ' + error.message + ' | Code: ' + error.code)
      setSenden(false)
      return
    }

    const meldung = { id: meldungId }

    for (const foto of fotos) {
      const ext = foto.file.name.split('.').pop()
      const pfad = `${meldung.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('meldung-fotos')
        .upload(pfad, foto.file)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('meldung-fotos')
          .getPublicUrl(pfad)
        await supabase.from('meldung_foto').insert({
          meldung_id: meldung.id,
          url: publicUrl,
          hochgeladen_von: 'mieter',
        })
      }
    }

    setSenden(false)
    navigate(`/melden/${qrToken}/bestaetigung`, { state: { name, beschreibung } })
  }

  if (laden) return <div style={{ padding: 40, fontFamily: 'var(--font)', textAlign: 'center', color: '#888780' }}>Laden…</div>

  if (!eingang) return (
    <div style={{ padding: 40, fontFamily: 'var(--font)', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A', marginBottom: 8 }}>Ungültiger QR-Code</div>
      <div style={{ fontSize: 13, color: '#888780' }}>Dieser Link ist nicht mehr gültig.</div>
    </div>
  )

  const inputStyle = {
    padding: '12px', borderRadius: 10, fontSize: 14,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ background: '#F1EFE8', padding: '16px 24px', borderBottom: '0.5px solid #D3D1C7' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: 'white', border: '0.5px solid #D3D1C7', color: '#5F5E5A', marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {eingang.objekt?.strasse} {eingang.objekt?.hausnummer} · Eingang {eingang.bezeichnung}
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#2C2C2A' }}>Defekt melden</div>
          <div style={{ fontSize: 13, color: '#5F5E5A', marginTop: 4 }}>Kurz beschreiben was nicht stimmt — der Hausmeister kümmert sich darum.</div>
        </div>

        <form onSubmit={absenden} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A' }}>Ihr Name</label>
            <input style={inputStyle} placeholder="z.B. Thomas" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A' }}>Was ist defekt? <span style={{ fontWeight: 400, color: '#888780' }}>optional</span></label>
            <textarea style={{ ...inputStyle, height: 96, resize: 'none' }} placeholder="z.B. Die Lampe im Treppenhaus ist ausgefallen…" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5F5E5A' }}>
              Fotos <span style={{ fontWeight: 400, color: '#888780' }}>optional · max. {MAX_FOTOS}</span>
            </label>

            {fotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 4 }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => fotoEntfernen(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {fotos.length < MAX_FOTOS && (
              <label style={{ width: '100%', height: 80, borderRadius: 10, border: '1px dashed #D3D1C7', background: '#F8F7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#2C2C2A" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="3" stroke="#2C2C2A" strokeWidth="1.5"/>
                  <path d="M3 9l4-4h3" stroke="#2C2C2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 12, color: '#888780' }}>Foto hinzufügen ({fotos.length}/{MAX_FOTOS})</span>
                <input type="file" accept="image/*" capture="environment" multiple onChange={fotoHinzufuegen} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {fehler && <div style={{ fontSize: 12, color: '#C0392B', padding: '8px 12px', background: '#FDECEB', borderRadius: 8 }}>{fehler}</div>}

          <button type="submit" disabled={senden} style={{ width: '100%', height: 52, borderRadius: 10, background: '#444441', color: '#F1EFE8', fontSize: 16, fontWeight: 500, border: 'none', cursor: senden ? 'not-allowed' : 'pointer', opacity: senden ? 0.6 : 1 }}>
            {senden ? 'Wird gesendet…' : 'Meldung absenden'}
          </button>

          <div style={{ fontSize: 11, color: '#B4B2A9', textAlign: 'center' }}>
            Ihre Meldung wird direkt an den Hausmeisterservice weitergeleitet.
          </div>
        </form>
      </div>
    </div>
  )
}

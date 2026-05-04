import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

export default function ObjektDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [objekt, setObjekt] = useState(null)
  const [eingaenge, setEingaenge] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [bezeichnung, setBezeichnung] = useState('')
  const [speichern, setSpeichern] = useState(false)
  const [qrOffen, setQrOffen] = useState(null)
  const [bearbeiten, setBearbeiten] = useState(false)
  const [objektEdit, setObjektEdit] = useState({})
  const [eingangEdit, setEingangEdit] = useState(null)
  const [eingangEditWert, setEingangEditWert] = useState('')
  const [loeschenBestaetigung, setLoeschenBestaetigung] = useState(false)

  useEffect(() => { ladeDaten() }, [id])

  async function ladeDaten() {
    setLaden(true)
    const { data: obj } = await supabase.from('objekt').select('*').eq('id', id).single()
    const { data: ein } = await supabase.from('eingang').select('*').eq('objekt_id', id).order('bezeichnung')
    setObjekt(obj)
    setObjektEdit(obj || {})
    setEingaenge(ein || [])
    setLaden(false)
  }

  async function eingangAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    await supabase.from('eingang').insert({ objekt_id: id, bezeichnung })
    setBezeichnung('')
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  async function objektSpeichern() {
    await supabase.from('objekt').update({
      strasse: objektEdit.strasse,
      hausnummer: objektEdit.hausnummer,
      plz: objektEdit.plz,
      ort: objektEdit.ort,
    }).eq('id', id)
    setBearbeiten(false)
    ladeDaten()
  }

  async function objektLoeschen() {
    await supabase.from('objekt').delete().eq('id', id)
    navigate('/admin/objekte')
  }

  async function eingangSpeichern(eingangId) {
    await supabase.from('eingang').update({ bezeichnung: eingangEditWert }).eq('id', eingangId)
    setEingangEdit(null)
    ladeDaten()
  }

  async function eingangLoeschen(eingangId) {
    await supabase.from('eingang').delete().eq('id', eingangId)
    ladeDaten()
  }

  function qrUrl(token) {
    return `${window.location.origin}/melden/${token}`
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  if (laden) return <div style={{ padding: 40, fontFamily: 'var(--font)', color: '#888780', textAlign: 'center' }}>Laden…</div>

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      {/* Topbar */}
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin/objekte')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Objekte</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{objekt?.strasse} {objekt?.hausnummer}</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Eingang
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Objekt-Info / Bearbeiten */}
        <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
          {bearbeiten ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                <input style={inputStyle} value={objektEdit.strasse || ''} onChange={e => setObjektEdit({...objektEdit, strasse: e.target.value})} placeholder="Straße" />
                <input style={inputStyle} value={objektEdit.hausnummer || ''} onChange={e => setObjektEdit({...objektEdit, hausnummer: e.target.value})} placeholder="Nr." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                <input style={inputStyle} value={objektEdit.plz || ''} onChange={e => setObjektEdit({...objektEdit, plz: e.target.value})} placeholder="PLZ" />
                <input style={inputStyle} value={objektEdit.ort || ''} onChange={e => setObjektEdit({...objektEdit, ort: e.target.value})} placeholder="Ort" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setBearbeiten(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                <button onClick={objektSpeichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Speichern</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#2C2C2A' }}>{objekt?.strasse} {objekt?.hausnummer}</div>
                <div style={{ fontSize: 13, color: '#888780', marginTop: 2 }}>{objekt?.plz} {objekt?.ort}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setBearbeiten(true)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Bearbeiten</button>
                <button onClick={() => setLoeschenBestaetigung(true)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
              </div>
            </div>
          )}
        </div>

        {/* Löschen-Bestätigung */}
        {loeschenBestaetigung && (
          <div style={{ background: '#FDECEB', border: '0.5px solid #F5C6C2', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#C0392B', marginBottom: 6 }}>Objekt wirklich löschen?</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 14 }}>Alle Eingänge und Meldungen werden ebenfalls gelöscht. Dies kann nicht rückgängig gemacht werden.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setLoeschenBestaetigung(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: 'white', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={objektLoeschen} style={{ flex: 1, height: 36, borderRadius: 8, background: '#C0392B', color: 'white', border: 'none', fontSize: 13, cursor: 'pointer' }}>Ja, löschen</button>
            </div>
          </div>
        )}

        {/* Neuer Eingang */}
        {formOffen && (
          <form onSubmit={eingangAnlegen} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>Neuer Eingang</div>
            <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="z.B. Links, Rechts, Mitte, A, B" value={bezeichnung} onChange={e => setBezeichnung(e.target.value)} required />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
              <button type="submit" disabled={speichern} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </form>
        )}

        {/* Eingänge */}
        <div style={{ fontSize: 13, fontWeight: 500, color: '#888780' }}>Eingänge</div>
        {eingaenge.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 13 }}>Noch keine Eingänge angelegt</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {eingaenge.map(ein => (
              <div key={ein.id} style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: '16px 20px' }}>

                {/* Eingang Header */}
                {eingangEdit === ein.id ? (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input style={{ ...inputStyle, marginBottom: 0 }} value={eingangEditWert} onChange={e => setEingangEditWert(e.target.value)} />
                    <button onClick={() => eingangSpeichern(ein.id)} style={{ height: 40, padding: '0 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>OK</button>
                    <button onClick={() => setEingangEdit(null)} style={{ height: 40, padding: '0 14px', borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{ein.bezeichnung}</div>
                      <div style={{ fontSize: 11, color: '#888780', marginTop: 2, fontFamily: 'monospace' }}>{ein.qr_token.slice(0, 16)}…</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEingangEdit(ein.id); setEingangEditWert(ein.bezeichnung) }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Umbenennen</button>
                      <button onClick={() => eingangLoeschen(ein.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, background: '#FDECEB', color: '#C0392B', border: '0.5px solid #F5C6C2', cursor: 'pointer' }}>Löschen</button>
                    </div>
                  </div>
                )}

                {/* QR */}
                <button
                  onClick={() => setQrOffen(qrOffen === ein.id ? null : ein.id)}
                  style={{ fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer', width: '100%' }}>
                  {qrOffen === ein.id ? 'QR-Code schließen' : 'QR-Code anzeigen'}
                </button>

                {qrOffen === ein.id && (
                  <div style={{ marginTop: 12, padding: 16, background: '#F8F7F2', borderRadius: 8, border: '0.5px solid #D3D1C7' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, background: 'white', padding: 16, borderRadius: 8 }}>
                      <QRCodeSVG value={qrUrl(ein.qr_token)} size={160} />
                    </div>
                    <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Meldeformular-Link:</div>
                    <div style={{ fontSize: 11, color: '#2C2C2A', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 10 }}>{qrUrl(ein.qr_token)}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => navigator.clipboard.writeText(qrUrl(ein.qr_token))} style={{ flex: 1, fontSize: 12, fontWeight: 500, padding: '6px 0', borderRadius: 8, background: '#F1EFE8', color: '#444441', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>Link kopieren</button>
                      <button onClick={() => window.print()} style={{ flex: 1, fontSize: 12, fontWeight: 500, padding: '6px 0', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>Drucken</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
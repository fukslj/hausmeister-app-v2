import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MAX_FOTOS = 5

export default function MeldungDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profil } = useAuth()
  const [meldung, setMeldung] = useState(null)
  const [fotos, setFotos] = useState([])
  const [notizen, setNotizen] = useState([])
  const [laden, setLaden] = useState(true)
  const [notiz, setNotiz] = useState('')
  const [neueFootos, setNeueFotos] = useState([])
  const [speichern, setSpeichern] = useState(false)
  const [erledigtBestaetigung, setErledigtBestaetigung] = useState(false)

  useEffect(() => { ladeMeldung() }, [id])

  async function ladeMeldung() {
    setLaden(true)
    const { data: m } = await supabase
      .from('meldung')
      .select('*, eingang(bezeichnung, objekt(strasse, hausnummer)), meldung_techniker(techniker_id, techniker(name))')
      .eq('id', id)
      .single()
    const { data: f } = await supabase
      .from('meldung_foto')
      .select('*')
      .eq('meldung_id', id)
      .order('erstellt_am')
    const { data: n } = await supabase
      .from('notiz')
      .select('*')
      .eq('meldung_id', id)
      .order('erstellt_am')
    setMeldung(m)
    setFotos(f || [])
    setNotizen(n || [])
    setLaden(false)
  }

  const istMeine = meldung?.meldung_techniker?.some(t => t.techniker_id === profil?.id)
  const istHausmeister = profil?.typ === 'hausmeister'
  const istAdmin = profil?.typ === 'superadmin'
  const istVerwaltung = profil?.typ === 'hausverwaltung'
  const kannAktionen = (istHausmeister || istAdmin) && meldung?.status !== 'erledigt' && meldung?.status !== 'archiviert'
  const kannFotos = kannAktionen || istVerwaltung

  async function uebernehmen() {
    await supabase.from('meldung_techniker').insert({ meldung_id: id, techniker_id: profil.id })
    await supabase.from('meldung').update({ status: 'in_arbeit' }).eq('id', id)
    await supabase.from('notiz').insert({ meldung_id: id, autor_typ: 'techniker', autor_id: profil.id, autor_name: profil.name, inhalt: `${profil.name} hat die Aufgabe übernommen` })
    ladeMeldung()
  }

  async function erledigen() {
    await supabase.from('meldung').update({ status: 'erledigt', erledigt_am: new Date().toISOString() }).eq('id', id)
    await supabase.from('notiz').insert({ meldung_id: id, autor_typ: 'techniker', autor_id: profil.id, autor_name: profil.name, inhalt: `${profil.name} hat die Aufgabe als erledigt markiert` })
    ladeMeldung()
  }

  async function archivieren() {
    await supabase.from('meldung').update({ status: 'archiviert' }).eq('id', id)
    await supabase.from('notiz').insert({ meldung_id: id, autor_typ: 'techniker', autor_id: profil.id, autor_name: profil.name, inhalt: `${profil.name} hat die Meldung archiviert` })
    navigate('/admin/meldungen')
  }

  function fotoHinzufuegen(e) {
    const files = Array.from(e.target.files)
    const verfuegbar = MAX_FOTOS - fotos.length - neueFootos.length
    const neu = files.slice(0, verfuegbar).map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setNeueFotos(prev => [...prev, ...neu])
    e.target.value = ''
  }

  async function notizSpeichern() {
    if (!notiz.trim() && neueFootos.length === 0) return
    setSpeichern(true)

    for (const foto of neueFootos) {
      const ext = foto.file.name.split('.').pop()
      const pfad = `${id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('meldung-fotos').upload(pfad, foto.file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('meldung-fotos').getPublicUrl(pfad)
        await supabase.from('meldung_foto').insert({
          meldung_id: id,
          url: publicUrl,
          hochgeladen_von: profil.name,
        })
      }
    }

    if (notiz.trim()) {
      await supabase.from('notiz').insert({
        meldung_id: id,
        autor_typ: istVerwaltung ? 'hausverwaltung' : 'techniker',
        autor_id: profil.id,
        autor_name: profil.name,
        inhalt: notiz.trim(),
      })
    }

    setNotiz('')
    setNeueFotos([])
    setSpeichern(false)
    ladeMeldung()
  }

  function statusBadge() {
    if (istMeine && meldung.status !== 'erledigt') return { text: 'Meine Aufgabe', bg: '#E1F5EE', color: '#085041' }
    if (meldung.status === 'offen') return { text: 'Offen', bg: '#FEF3CD', color: '#856404' }
    if (meldung.status === 'in_arbeit') return { text: 'In Arbeit', bg: '#E8F4FD', color: '#0C5460' }
    if (meldung.status === 'erledigt') return { text: 'Erledigt', bg: '#E8F5E9', color: '#2E7D32' }
    if (meldung.status === 'archiviert') return { text: 'Archiviert', bg: '#F1EFE8', color: '#888780' }
    return { text: meldung.status, bg: '#F1EFE8', color: '#5F5E5A' }
  }

  if (laden) return <div style={{ padding: 40, fontFamily: 'var(--font)', textAlign: 'center', color: '#888780' }}>Laden…</div>
  if (!meldung) return <div style={{ padding: 40, fontFamily: 'var(--font)', textAlign: 'center', color: '#888780' }}>Meldung nicht gefunden</div>

  const badge = statusBadge()
  const zurueckPfad = istHausmeister ? '/hausmeister' : istAdmin ? '/admin/meldungen' : '/hausverwaltung'
  const topColor = istHausmeister ? { bg: '#E1F5EE', border: '#5DCAA5', text: '#04342C', back: '#0F6E56' } : istAdmin ? { bg: '#F1EFE8', border: '#D3D1C7', text: '#2C2C2A', back: '#444441' } : { bg: '#EEEDFE', border: '#AFA9EC', text: '#26215C', back: '#534AB7' }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F8F7F2' }}>
      <div style={{ background: topColor.bg, padding: '14px 20px', borderBottom: `0.5px solid ${topColor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate(zurueckPfad)} style={{ fontSize: 12, color: topColor.back, cursor: 'pointer' }}>← Meldungen</span>
          <span style={{ color: '#D3D1C7', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: topColor.text }}>Meldung</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.text}</span>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hauptkarte */}
        <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#2C2C2A', marginBottom: 16 }}>
            {meldung.beschreibung || 'Keine Beschreibung'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '0.5px solid #D3D1C7', borderRadius: 8, overflow: 'hidden', marginBottom: fotos.length > 0 ? 14 : 0 }}>
            {[
              { label: 'Objekt', value: `${meldung.eingang?.objekt?.strasse} ${meldung.eingang?.objekt?.hausnummer} · ${meldung.eingang?.bezeichnung}` },
              { label: 'Gemeldet von', value: meldung.melder_name },
              { label: 'Eingegangen', value: new Date(meldung.erstellt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) },
              { label: 'Übernommen von', value: meldung.meldung_techniker?.map(t => t.techniker?.name).join(', ') || '—' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRight: i % 2 === 0 ? '0.5px solid #D3D1C7' : 'none', borderBottom: i < 2 ? '0.5px solid #D3D1C7' : 'none' }}>
                <div style={{ fontSize: 11, color: '#888780', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#2C2C2A' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {fotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {fotos.map((f) => (
                <img key={f.id} src={f.url} alt="" onClick={() => window.open(f.url, '_blank')}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} />
              ))}
            </div>
          )}
        </div>

        {/* Aktionsleiste */}
        {kannAktionen && (
          <div style={{ display: 'flex', gap: 10 }}>
            {!istMeine && (
              <button onClick={uebernehmen} style={{ flex: 1, height: 44, borderRadius: 10, background: '#0F6E56', color: '#E1F5EE', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Aufgabe übernehmen
              </button>
            )}
            {istMeine && !erledigtBestaetigung && (
              <button onClick={() => setErledigtBestaetigung(true)} style={{ flex: 1, height: 44, borderRadius: 10, background: '#E8F5E9', color: '#2E7D32', fontSize: 14, fontWeight: 500, border: '0.5px solid #A5D6A7', cursor: 'pointer' }}>
                Als erledigt markieren
              </button>
            )}
            {istMeine && erledigtBestaetigung && (
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <button onClick={() => setErledigtBestaetigung(false)} style={{ flex: 1, height: 44, borderRadius: 10, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>
                  Abbrechen
                </button>
                <button onClick={() => { erledigen(); setErledigtBestaetigung(false) }} style={{ flex: 1, height: 44, borderRadius: 10, background: '#2E7D32', color: 'white', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  ✓ Ja, erledigt
                </button>
              </div>
            )}
          </div>
        )}

        {/* Archivieren — nur Admin, nur erledigte Meldungen */}
        {istAdmin && meldung?.status === 'erledigt' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={archivieren} style={{ fontSize: 11, padding: '6px 14px', borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
              Archivieren
            </button>
          </div>
        )}

        {/* Notiz + Fotos hinzufügen */}
        {kannFotos && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A', marginBottom: 10 }}>
              {istVerwaltung ? 'Dokument / Foto hochladen' : 'Notiz & Fotos hinzufügen'}
            </div>

            {neueFootos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {neueFootos.map((f, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setNeueFotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={notiz}
              onChange={e => setNotiz(e.target.value)}
              placeholder="z.B. Ersatzlampe bestellt, Lieferung morgen…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A', border: '0.5px solid #D3D1C7', resize: 'none', height: 72, outline: 'none', marginBottom: 8 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              {fotos.length + neueFootos.length < MAX_FOTOS && (
                <label style={{ height: 36, padding: '0 14px', borderRadius: 8, background: '#F1EFE8', color: '#5F5E5A', fontSize: 12, border: '0.5px solid #D3D1C7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Foto ({fotos.length + neueFootos.length}/{MAX_FOTOS})
                  <input type="file" accept="image/*" capture="environment" multiple onChange={fotoHinzufuegen} style={{ display: 'none' }} />
                </label>
              )}
              <button onClick={notizSpeichern} disabled={speichern || (!notiz.trim() && neueFootos.length === 0)}
                style={{ flex: 1, height: 36, borderRadius: 8, background: '#0F6E56', color: '#E1F5EE', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', opacity: (!notiz.trim() && neueFootos.length === 0) || speichern ? 0.4 : 1 }}>
                {speichern ? 'Wird gespeichert…' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Verlauf */}
        <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #D3D1C7', fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}>Verlauf</div>
          <div style={{ padding: '4px 16px' }}>
            <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: notizen.length > 0 ? '0.5px solid #F1EFE8' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', flexShrink: 0, marginTop: 4 }} />
              <div>
                <div style={{ fontSize: 12, color: '#2C2C2A', fontWeight: 500 }}>Meldung eingegangen</div>
                <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{new Date(meldung.erstellt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</div>
              </div>
            </div>
            {notizen.map((n, i) => (
              <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < notizen.length - 1 ? '0.5px solid #F1EFE8' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#2C2C2A' }}>{n.inhalt}</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{n.autor_name} · {new Date(n.erstellt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
              </div>
            ))}
            {meldung.status === 'erledigt' && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32', flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#2E7D32', fontWeight: 500 }}>Erledigt</div>
                  <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{meldung.erledigt_am ? new Date(meldung.erledigt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : ''}</div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Techniker() {
  const navigate = useNavigate()
  const [techniker, setTechniker] = useState([])
  const [services, setServices] = useState([])
  const [objekte, setObjekte] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [neu, setNeu] = useState({ name: '', pin: '', rolle: 'techniker', user_id: '', service_id: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')
  const [schritt, setSchritt] = useState(1)
  const [bearbeitenId, setBearbeitenId] = useState(null)
  const [bearbeitenWert, setBearbeitenWert] = useState({})
  const [loeschenId, setLoeschenId] = useState(null)
  const [objektZuweisungId, setObjektZuweisungId] = useState(null)
  const [zugewieseneObjekte, setZugewieseneObjekte] = useState([])

  useEffect(() => { ladeTechniker(); ladeServices(); ladeObjekte() }, [])

  async function ladeServices() {
    const { data } = await supabase.from('hausmeisterservice').select('id, name').order('name')
    setServices(data || [])
  }

  async function ladeObjekte() {
    const { data } = await supabase.from('objekt').select('id, strasse, hausnummer').order('strasse')
    setObjekte(data || [])
  }

  async function ladeTechniker() {
    setLaden(true)
    const { data } = await supabase
      .from('techniker')
      .select('*, hausmeisterservice(name)')
      .order('name')
    setTechniker(data || [])
    setLaden(false)
  }

  async function ladeZugewieseneObjekte(technikerId) {
    const { data } = await supabase
      .from('techniker_objekt')
      .select('id, objekt_id')
      .eq('techniker_id', technikerId)
    setZugewieseneObjekte(data || [])
    setObjektZuweisungId(technikerId)
  }

  async function objektToggle(objektId) {
    const vorhanden = zugewieseneObjekte.find(z => z.objekt_id === objektId)
    if (vorhanden) {
      await supabase.from('techniker_objekt').delete().eq('id', vorhanden.id)
    } else {
      await supabase.from('techniker_objekt').insert({ techniker_id: objektZuweisungId, objekt_id: objektId })
    }
    ladeZugewieseneObjekte(objektZuweisungId)
  }

  async function technikerAnlegen(e) {
    e.preventDefault()
    if (neu.pin.length !== 4 || !/^\d{4}$/.test(neu.pin)) {
      setFehler('PIN muss genau 4 Ziffern sein')
      return
    }
    setSpeichern(true)
    setFehler('')

    const { error } = await supabase.from('techniker').insert({
      id: neu.user_id,
      service_id: neu.service_id,
      name: neu.name,
      pin_hash: neu.pin,
      rolle: neu.rolle,
    })

    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }

    setNeu({ name: '', pin: '', rolle: 'techniker', user_id: '', service_id: '' })
    setFormOffen(false)
    setSchritt(1)
    setSpeichern(false)
    ladeTechniker()
  }

  async function technikerSpeichern(id) {
    await supabase.from('techniker').update({
      name: bearbeitenWert.name,
      pin_hash: bearbeitenWert.pin_hash,
      rolle: bearbeitenWert.rolle,
      service_id: bearbeitenWert.service_id,
    }).eq('id', id)
    setBearbeitenId(null)
    ladeTechniker()
  }

  async function technikerLoeschen(id) {
    await supabase.from('techniker').delete().eq('id', id)
    setLoeschenId(null)
    ladeTechniker()
  }

  async function aktivToggle(t) {
    await supabase.from('techniker').update({ aktiv: !t.aktiv }).eq('id', t.id)
    ladeTechniker()
  }

  const inputStyle = {
    height: 40, padding: '0 12px', borderRadius: 8, fontSize: 13,
    fontFamily: 'var(--font)', background: '#F8F7F2', color: '#2C2C2A',
    border: '0.5px solid #D3D1C7', width: '100%', outline: 'none',
  }

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: '#F1EFE8' }}>
      <div style={{ background: '#F1EFE8', padding: '14px 20px', borderBottom: '0.5px solid #D3D1C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span onClick={() => navigate('/admin')} style={{ fontSize: 12, color: '#888780', cursor: 'pointer' }}>← Zurück</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Techniker</span>
        </div>
        <button onClick={() => { setFormOffen(true); setSchritt(1) }} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Neu
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>

        {/* Neuer Techniker */}
        {formOffen && (
          <div style={{ background: 'white', border: '0.5px solid #D3D1C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A', marginBottom: 4 }}>Neuer Techniker</div>

            {schritt === 1 && (
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 16, padding: '10px 12px', background: '#F8F7F2', borderRadius: 8, lineHeight: 1.6 }}>
                  <strong style={{ color: '#2C2C2A' }}>Schritt 1:</strong> Geh in Supabase → Authentication → Users → <strong style={{ color: '#2C2C2A' }}>Add user</strong>:<br/><br/>
                  • E-Mail: beliebig (z.B. name@hausmeister.app)<br/>
                  • Passwort: die gewünschte PIN (4 Ziffern)<br/>
                  • Auto Confirm User: ✓<br/><br/>
                  Danach die <strong style={{ color: '#2C2C2A' }}>UUID</strong> des neuen Users kopieren.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setFormOffen(false)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#F1EFE8', color: '#888780', border: '0.5px solid #D3D1C7', fontSize: 13, cursor: 'pointer' }}>Abbrechen</button>
                  <button onClick={() => setSchritt(2)} style={{ flex: 1, height: 36, borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', fontSize: 13, cursor: 'pointer' }}>Weiter →</button

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Fahrzeuge() {
  const navigate = useNavigate()
  const [fahrzeuge, setFahrzeuge] = useState([])
  const [buchungen, setBuchungen] = useState([])
  const [laden, setLaden] = useState(true)
  const [formOffen, setFormOffen] = useState(false)
  const [buchungFormOffen, setBuchungFormOffen] = useState(false)
  const [selectedFahrzeug, setSelectedFahrzeug] = useState(null)
  const [techniker, setTechniker] = useState([])
  const [neu, setNeu] = useState({ kennzeichen: '', bezeichnung: '', typ: 'pkw' })
  const [neuBuchung, setNeuBuchung] = useState({ techniker_id: '', von: '', bis: '', zweck: '' })
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => { ladeDaten() }, [])

  async function ladeDaten() {
    setLaden(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: t_admin } = await supabase.from('techniker').select('service_id').eq('id', user.id).single()
    
    const { data: f } = await supabase
      .from('fahrzeug')
      .select('*')
      .eq('service_id', t_admin.service_id)
      .order('bezeichnung')
    const { data: b } = await supabase
      .from('fahrzeug_buchung')
      .select('*, fahrzeug(bezeichnung, kennzeichen), techniker(name)')
      .gte('bis', new Date().toISOString())
      .order('von')
    const { data: t } = await supabase
      .from('techniker')
      .select('id, name')
      .eq('rolle', 'techniker')
      .order('name')
    setFahrzeuge(f || [])
    setBuchungen(b || [])
    setTechniker(t || [])
    setLaden(false)
  }

  async function fahrzeugAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: t_admin } = await supabase.from('techniker').select('service_id').eq('id', user.id).single()
    
    const { error } = await supabase.from('fahrzeug').insert({
      ...neu,
      service_id: t_admin.service_id,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeu({ kennzeichen: '', bezeichnung: '', typ: 'pkw' })
    setFormOffen(false)
    setSpeichern(false)
    ladeDaten()
  }

  async function buchungAnlegen(e) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')

    // Konfliktprüfung
    const { data: konflikt } = await supabase
      .from('fahrzeug_buchung')
      .select('id')
      .eq('fahrzeug_id', selectedFahrzeug.id)
      .lt('von', neuBuchung.bis)
      .gt('bis', neuBuchung.von)
      .limit(1)

    if (konflikt?.length > 0) {
      setFehler('Fahrzeug ist in diesem Zeitraum bereits gebucht')
      setSpeichern(false)
      return
    }

    const { error } = await supabase.from('fahrzeug_buchung').insert({
      fahrzeug_id: selectedFahrzeug.id,
      techniker_id: neuBuchung.techniker_id,
      von: neuBuchung.von,
      bis: neuBuchung.bis,
      zweck: neuBuchung.zweck || null,
    })
    if (error) { setFehler('Fehler: ' + error.message); setSpeichern(false); return }
    setNeuBuchung({ techniker_id: '', von: '', bis: '', zweck: '' })
    setBuchungFormOffen(false)
    setSelectedFahrzeug(null)
    setSpeichern(false)
    ladeDaten()
  }

  async function buchungLoeschen(id) {
    await supabase.from('fahrzeug_buchung').delete().eq('id', id)
    ladeDaten()
  }

  async function fahrzeugLoeschen(id) {
    await supabase.from('fahrzeug').delete().eq('id', id)
    ladeDaten()
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
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>Fahrzeuge</span>
        </div>
        <button onClick={() => setFormOffen(true)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8, background: '#444441', color: '#F1EFE8', border: 'none', cursor: 'pointer' }}>
          + Fahrzeug
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Neues Fahrzeug */}
        {formOffen && (

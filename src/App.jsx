import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Startseite from './pages/Startseite'
import HausverwaltungLogin from './pages/hausverwaltung/Login'
import HausmeisterLogin from './pages/hausmeister/Login'
import SuperadminLogin from './pages/admin/Login'
import HausverwaltungDashboard from './pages/hausverwaltung/Dashboard'
import HausmeisterDashboard from './pages/hausmeister/Dashboard'
import SuperadminDashboard from './pages/admin/Dashboard'
import MeldungDetail from './pages/MeldungDetail'
import Meldeformular from './pages/melden/Meldeformular'
import Bestaetigung from './pages/melden/Bestaetigung'
import Objekte from './pages/admin/Objekte'
import ObjektDetail from './pages/admin/ObjektDetail'
import Techniker from './pages/admin/Techniker'
import Hausverwaltungen from './pages/admin/Hausverwaltungen'
import Services from './pages/admin/Services'
import PasswortReset from './pages/PasswortReset'
import Meldungen from './pages/admin/Meldungen'
import Stempeluhr from './pages/hausmeister/Stempeluhr'

function GeschuetzteRoute({ children, erlaubteTypen }) {
  const { profil, laden } = useAuth()
  if (laden) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--neutral-400)', fontFamily: 'var(--font)' }}>Laden…</div>
  if (!profil) return <Navigate to="/" replace />
  if (erlaubteTypen && !erlaubteTypen.includes(profil.typ)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Startseite />} />
      <Route path="/login/hausverwaltung" element={<HausverwaltungLogin />} />
      <Route path="/login/hausmeister" element={<HausmeisterLogin />} />
      <Route path="/login/admin" element={<SuperadminLogin />} />
      <Route path="/melden/:qrToken" element={<Meldeformular />} />
      <Route path="/melden/:qrToken/bestaetigung" element={<Bestaetigung />} />
      
      <Route path="/hausverwaltung" element={
        <GeschuetzteRoute erlaubteTypen={['hausverwaltung']}>
          <HausverwaltungDashboard />
        </GeschuetzteRoute>
      } />

      <Route path="/hausmeister" element={
        <GeschuetzteRoute erlaubteTypen={['hausmeister']}>
          <HausmeisterDashboard />
        </GeschuetzteRoute>
      } />

      <Route path="/admin/*" element={
          <GeschuetzteRoute erlaubteTypen={['superadmin']}>
            <Routes>
              <Route index element={<SuperadminDashboard />} />
              <Route path="meldungen" element={<Meldungen />} />
              <Route path="objekte" element={<Objekte />} />
              <Route path="objekte/:id" element={<ObjektDetail />} />
              <Route path="techniker" element={<Techniker />} />
              <Route path="hausverwaltungen" element={<Hausverwaltungen />} />
              <Route path="service" element={<Services />} />
            </Routes>
          </GeschuetzteRoute>
      } />
      <Route path="/hausmeister/stempeluhr" element={
          <GeschuetzteRoute erlaubteTypen={['hausmeister']}>
          <Stempeluhr />
      </GeschuetzteRoute>
      } />
      <Route path="/meldung/:id" element={
        <GeschuetzteRoute erlaubteTypen={['hausverwaltung', 'hausmeister', 'superadmin']}>
          <MeldungDetail />
        </GeschuetzteRoute>
      } />
      <Route path="/passwort-reset" element={<PasswortReset />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

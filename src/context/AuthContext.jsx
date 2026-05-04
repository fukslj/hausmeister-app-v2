import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profil, setProfil] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) ladeProfil(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) ladeProfil(session.user.id)
      else setProfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function ladeProfil(userId) {
    // Zuerst in techniker suchen
    const { data: techniker } = await supabase
      .from('techniker')
      .select('id, name, rolle, service_id')
      .eq('id', userId)
      .maybeSingle()
  
    if (techniker) {
      setProfil({ ...techniker, typ: techniker.rolle === 'admin' ? 'superadmin' : 'hausmeister' })
      return
    }
  
    // Dann in hausverwaltung suchen
    const { data: verwaltung } = await supabase
      .from('hausverwaltung')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle()
  
    if (verwaltung) {
      setProfil({ ...verwaltung, typ: 'hausverwaltung' })
    }
  }

  async function abmelden() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profil, abmelden, laden: session === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
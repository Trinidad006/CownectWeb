import { getSupabaseClient } from '../config/supabaseClient'

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<{isAuthenticated: boolean, userId: string | null}>}
 */
export async function checkAuthentication() {
  try {
    const supabase = getSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { isAuthenticated: false, userId: null }
    }

    return { isAuthenticated: true, userId: user.id }
  } catch (error) {
    return { isAuthenticated: false, userId: null }
  }
}

/**
 * Obtiene el usuario actual con su perfil
 * @returns {Promise<User | null>}
 */
export async function getCurrentUser() {
  try {
    const supabase = getSupabaseClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    
    if (error || !authUser) {
      return null
    }

    const { data: profile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return {
      id: authUser.id,
      email: authUser.email || '',
      nombre: profile?.nombre,
      apellido: profile?.apellido,
      telefono: profile?.telefono,
    }
  } catch (error) {
    return null
  }
}


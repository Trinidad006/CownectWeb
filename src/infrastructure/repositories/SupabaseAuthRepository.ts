import { supabase } from '../config/supabase'
import { AuthRepository, RegisterData, LoginData } from '@/domain/repositories/AuthRepository'
import { User } from '@/domain/entities/User'

export class SupabaseAuthRepository implements AuthRepository {
  async register(data: RegisterData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Error al crear el usuario' }
      }

      // Crear perfil en la tabla de usuarios si existe
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
        })

      if (profileError) {
        console.error('Error al crear perfil:', profileError)
        // No retornamos error aquí porque el usuario ya fue creado en auth
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message || 'Error desconocido' }
    }
  }

  async login(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Error al iniciar sesión' }
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || data.email,
        nombre: profile?.nombre,
        apellido: profile?.apellido,
        telefono: profile?.telefono,
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: error.message || 'Error desconocido' }
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
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
}


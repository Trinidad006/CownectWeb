import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rovlcrdgjinpfudyoovg.supabase.co'
// Nota: Esta parece ser una clave de publicación, verifica que sea la anon key correcta
const supabaseAnonKey = 'sb_publishable_0OEAd3Jq5tEUvUV_S4n8Yg_Yk_SP8LJ'

// Cliente para usar en el cliente (browser)
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Faltan credenciales de Supabase')
    throw new Error('Configuración de Supabase incompleta')
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  
  console.log('Cliente Supabase creado:', { url: supabaseUrl, hasKey: !!supabaseAnonKey })
  
  return client
}


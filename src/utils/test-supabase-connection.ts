// Script para probar la conexión a Supabase
// Ejecutar en la consola del navegador: import('./utils/test-supabase-connection')

import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'

export async function testConnection() {
  console.log('Probando conexión a Supabase...')
  
  try {
    const supabase = getSupabaseClient()
    
    // Probar conexión básica
    const { data, error } = await supabase.from('usuarios').select('count').limit(1)
    
    if (error) {
      console.error('Error de conexión:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexión exitosa a Supabase')
    return { success: true }
  } catch (err: any) {
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}


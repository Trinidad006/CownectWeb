// Script para explorar la estructura de la base de datos
// Ejecutar con: npx ts-node src/scripts/explore-db.ts

import { supabase } from '../infrastructure/config/supabase'

async function exploreDatabase() {
  console.log('Explorando base de datos...\n')

  // Intentar obtener información de tablas comunes
  const tables = ['usuarios', 'animales', 'vacunaciones', 'pesos', 'tratamientos', 'explotaciones']

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (!error && data !== null) {
        console.log(`✓ Tabla "${table}" existe`)
        if (data.length > 0) {
          console.log(`  Columnas: ${Object.keys(data[0]).join(', ')}`)
        }
      } else {
        console.log(`✗ Tabla "${table}" no existe o hay error:`, error?.message)
      }
    } catch (err: any) {
      console.log(`✗ Error al acceder a "${table}":`, err.message)
    }
  }
}

exploreDatabase()


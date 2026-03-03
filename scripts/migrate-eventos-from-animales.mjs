/**
 * Migración: genera eventos en eventos_animal a partir de datos actuales en animales.
 * - NACIMIENTO: si el animal tiene fecha_nacimiento (y opcionalmente madre_id).
 * - MUERTE/ROBO/DESCARTE: si activo === false, según estado o razon_inactivo.
 *
 * Uso: node scripts/migrate-eventos-from-animales.mjs [--dry-run]
 * Requiere .env.local con FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local')
    const env = readFileSync(envPath, 'utf8')
    env.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    })
  } catch (e) {
    console.error('No se encontró .env.local')
    process.exit(1)
  }
}

const MOTIVOS_MUERTE = ['NATURAL', 'ENFERMEDAD', 'ACCIDENTE', 'SACRIFICIO', 'OTRO']
const MOTIVOS_DESCARTE = ['BAJA_PRODUCCION', 'EDAD', 'ENFERMEDAD_CRONICA', 'OTRO']

function mapRazonToMotivo(razon, tipoEvento) {
  if (!razon || !razon.trim()) return 'OTRO'
  const r = razon.toLowerCase()
  if (tipoEvento === 'MUERTE') {
    if (r.includes('natural')) return 'NATURAL'
    if (r.includes('enfermedad') || r.includes('enfermedad')) return 'ENFERMEDAD'
    if (r.includes('accidente')) return 'ACCIDENTE'
    if (r.includes('sacrificio')) return 'SACRIFICIO'
  }
  if (tipoEvento === 'DESCARTE') {
    if (r.includes('producción') || r.includes('produccion')) return 'BAJA_PRODUCCION'
    if (r.includes('edad')) return 'EDAD'
    if (r.includes('crónica') || r.includes('cronica') || r.includes('enfermedad')) return 'ENFERMEDAD_CRONICA'
  }
  return 'OTRO'
}

async function main() {
  loadEnv()
  const admin = await import('firebase-admin')
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local')
    process.exit(1)
  }

  if (admin.apps?.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  const db = admin.firestore()
  const colAnimales = db.collection('animales')
  const colEventos = db.collection('eventos_animal')
  const now = new Date().toISOString()

  const snapshot = await colAnimales.get()
  let creados = 0
  let omitidos = 0
  let errores = 0

  for (const doc of snapshot.docs) {
    const id = doc.id
    const data = doc.data()
    const usuarioId = data.usuario_id
    if (!usuarioId) {
      console.warn(`[omitir] ${id}: sin usuario_id`)
      omitidos++
      continue
    }

    try {
      const batch = []

      // 1) Evento NACIMIENTO si tiene fecha_nacimiento
      if (data.fecha_nacimiento) {
        const eventoNacimiento = {
          animal_id: id,
          tipo_evento: 'NACIMIENTO',
          fecha_evento: data.fecha_nacimiento,
          usuario_id: usuarioId,
          madre_id: data.madre_id || null,
          observaciones: 'Migrado desde animales (fecha_nacimiento).',
          created_at: now,
        }
        batch.push({ tipo: 'NACIMIENTO', payload: eventoNacimiento })
      }

      // 2) Evento de cierre (MUERTE, ROBO, DESCARTE) si activo === false
      if (data.activo === false) {
        const estado = (data.estado || '').toLowerCase()
        const razon = (data.razon_inactivo || '').trim()
        const fechaCierre = data.fecha_inactivo || data.updated_at || data.created_at || now

        let tipoCierre = 'DESCARTE'
        if (estado.includes('muerto') || estado === 'muerto') tipoCierre = 'MUERTE'
        else if (estado.includes('robado') || estado === 'robo') tipoCierre = 'ROBO'
        else if (estado.includes('venta') || estado === 'vendido') tipoCierre = 'VENTA'

        const motivoId =
          tipoCierre === 'MUERTE'
            ? mapRazonToMotivo(razon, 'MUERTE')
            : tipoCierre === 'DESCARTE'
              ? mapRazonToMotivo(razon, 'DESCARTE')
              : tipoCierre === 'VENTA'
                ? 'VENTA_NORMAL'
                : 'ROBO_PARCIAL'

        const eventoCierre = {
          animal_id: id,
          tipo_evento: tipoCierre,
          fecha_evento: fechaCierre,
          motivo_id: motivoId,
          usuario_id: usuarioId,
          observaciones: razon ? `Migrado: ${razon}` : 'Migrado desde animales (activo=false).',
          created_at: now,
        }
        batch.push({ tipo: tipoCierre, payload: eventoCierre })
      }

      if (batch.length === 0) {
        omitidos++
        continue
      }

      if (!DRY_RUN) {
        for (const { payload } of batch) {
          await colEventos.add(payload)
          creados++
        }
      } else {
        console.log(`[dry-run] ${id}: crear ${batch.map((b) => b.tipo).join(', ')}`)
        creados += batch.length
      }
    } catch (err) {
      console.error(`[error] ${id}:`, err.message)
      errores++
    }
  }

  console.log('---')
  if (DRY_RUN) console.log('(modo dry-run: no se escribió en Firestore)')
  console.log(`Eventos que se habrían creado / creados: ${creados}`)
  console.log(`Animales omitidos (sin eventos a generar): ${omitidos}`)
  if (errores) console.log(`Errores: ${errores}`)
  process.exit(errores > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

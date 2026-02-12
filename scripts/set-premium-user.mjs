/**
 * Script para asignar plan premium a un usuario por email.
 * Uso: node scripts/set-premium-user.mjs mufasaelrey13@gmail.com
 *
 * Requiere Firebase Admin. Añade en .env.local:
 * FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar .env.local
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

const email = process.argv[2] || 'mufasaelrey13@gmail.com'

async function main() {
  const admin = await import('firebase-admin')
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local')
    console.error('Ve a Firebase Console → Configuración → Cuentas de servicio → Generar clave')
    process.exit(1)
  }

  if (admin.apps?.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  const auth = admin.auth()
  const db = admin.firestore()

  try {
    const user = await auth.getUserByEmail(email)
    const uid = user.uid
    await db.collection('usuarios').doc(uid).set(
      {
        plan: 'premium',
        suscripcion_activa: true,
        suscripcion_fecha: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    )
    console.log(`✓ Plan premium asignado a ${email} (uid: ${uid})`)
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`Usuario con email ${email} no encontrado en Firebase Auth`)
    } else {
      console.error('Error:', err.message)
    }
    process.exit(1)
  }
  process.exit(0)
}

main()

/**
 * Firebase Admin SDK - solo para servidor (API routes).
 * Bypasea reglas de Firestore. Usado por las rutas de PayPal.
 *
 * Añade en .env.local (desde Firebase Console → Configuración → Cuentas de servicio
 * → Generar nueva clave privada):
 * - FIREBASE_PROJECT_ID (o usa NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (copia el "private_key" del JSON, con \n como saltos de línea reales)
 */

import type { Firestore } from 'firebase-admin/firestore'

let adminDb: Firestore | null = null

function initAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin solo en servidor')
  }
  const admin = require('firebase-admin')
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local'
    )
  }
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }
  return admin.firestore() as Firestore
}

export function getFirebaseAdminDb(): Firestore {
  if (!adminDb) adminDb = initAdmin()
  return adminDb
}

export function hasAdminCredentials(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  return !!(projectId && clientEmail && privateKey)
}

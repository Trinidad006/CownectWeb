/**
 * Firebase Admin SDK - solo para servidor (API routes).
 *
 * Opción A — archivo JSON (recomendado):
 *   FIREBASE_SERVICE_ACCOUNT_PATH=ruta/relativa/al/proyecto/serviceAccount.json
 *
 * Opción B — variables sueltas:
 *   FIREBASE_PROJECT_ID (o NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL,
 *   FIREBASE_PRIVATE_KEY (con \n como saltos de línea en .env)
 */

import type { Firestore } from 'firebase-admin/firestore'

let adminDb: Firestore | null = null

function initAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin solo en servidor')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin') as typeof import('firebase-admin')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')

  if (admin.apps.length > 0) {
    return admin.firestore() as Firestore
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()

  if (saPath) {
    const fullPath = path.resolve(process.cwd(), saPath)
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Firebase Admin: no existe el archivo de cuenta de servicio: ${fullPath}`
      )
    }
    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    return admin.firestore() as Firestore
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Configura Firebase Admin: FIREBASE_SERVICE_ACCOUNT_PATH (JSON) o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
    )
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
  return admin.firestore() as Firestore
}

export function getFirebaseAdminDb(): Firestore {
  if (!adminDb) adminDb = initAdmin()
  return adminDb
}

/** Auth Admin (verifyIdToken). Requiere la misma inicialización que Firestore. */
export function getFirebaseAdminAuth(): import('firebase-admin/auth').Auth {
  getFirebaseAdminDb()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin') as typeof import('firebase-admin')
  return admin.auth()
}

export function hasAdminCredentials(): boolean {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  if (saPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs')
      const fullPath = path.resolve(process.cwd(), saPath)
      return fs.existsSync(fullPath)
    } catch {
      return false
    }
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  return !!(projectId && clientEmail && privateKey)
}

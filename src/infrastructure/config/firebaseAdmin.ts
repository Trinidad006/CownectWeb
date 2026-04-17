/**
 * Firebase Admin SDK - solo para servidor (API routes).
 *
 * Orden de lectura (la primera que aplique):
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON — JSON completo en una variable (útil en Vercel).
 * 2) FIREBASE_SERVICE_ACCOUNT_PATH — ruta al archivo JSON (relativa al proyecto o absoluta).
 * 3) GOOGLE_APPLICATION_CREDENTIALS — estándar de Google; ruta al JSON.
 * 4) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 */

import type { Firestore } from 'firebase-admin/firestore'

let adminDb: Firestore | null = null

function resolveCredentialPath(p: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  const t = p.trim()
  if (path.isAbsolute(t)) return t
  return path.resolve(process.cwd(), t)
}

function initAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin solo en servidor')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin') as typeof import('firebase-admin')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')

  if (admin.apps.length > 0) {
    return admin.firestore() as Firestore
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (saJson) {
    try {
      const serviceAccount = JSON.parse(saJson)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      return admin.firestore() as Firestore
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido')
    }
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  if (saPath) {
    const fullPath = resolveCredentialPath(saPath)
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

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (gac) {
    const fullPath = resolveCredentialPath(gac)
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Firebase Admin: GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe: ${fullPath}`
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
      'Configura Firebase Admin: FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
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
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim())
      return true
    } catch {
      return false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  if (saPath) {
    try {
      return fs.existsSync(resolveCredentialPath(saPath))
    } catch {
      return false
    }
  }

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (gac) {
    try {
      return fs.existsSync(resolveCredentialPath(gac))
    } catch {
      return false
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  return !!(projectId && clientEmail && privateKey)
}

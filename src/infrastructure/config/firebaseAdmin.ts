/**
 * Firebase Admin SDK - solo para servidor (API routes).
 * Bypasea reglas de Firestore. Usado en PayPal, trabajadores (custom token), etc.
 *
 * Añade en .env.local (desde Firebase Console → Configuración → Cuentas de servicio
 * → Generar nueva clave privada):
 * - FIREBASE_PROJECT_ID (o usa NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (copia el "private_key" del JSON, con \n como saltos de línea reales)
 */

import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import fs from 'node:fs'
import path from 'node:path'

let adminDb: Firestore | null = null

function ensureAdminApp() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin solo en servidor')
  }
  const admin = require('firebase-admin')
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if ((!projectId || !clientEmail || !privateKey) && serviceAccountPath) {
    const absPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.join(process.cwd(), serviceAccountPath)
    const raw = fs.readFileSync(absPath, 'utf8')
    const json = JSON.parse(raw) as {
      project_id?: string
      client_email?: string
      private_key?: string
    }
    projectId = projectId || json.project_id
    clientEmail = clientEmail || json.client_email
    privateKey = privateKey || (json.private_key ? json.private_key.replace(/\\n/g, '\n') : undefined)
  }

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
}

export function getFirebaseAdminDb(): Firestore {
  ensureAdminApp()
  if (!adminDb) {
    const admin = require('firebase-admin')
    adminDb = admin.firestore() as Firestore
  }
  return adminDb
}

export function getFirebaseAdminAuth(): Auth {
  ensureAdminApp()
  const admin = require('firebase-admin')
  return admin.auth() as Auth
}

export function hasAdminCredentials(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (projectId && clientEmail && privateKey) return true
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH
}

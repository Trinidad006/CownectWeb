/**
 * Asigna plan premium a un usuario por email.
 * POST /api/admin/set-user-premium
 * Body: { "email": "mufasaelrey13@gmail.com" }
 *
 * Requiere Firebase Admin (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) o reglas permisivas.
 */

import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = body.email || 'mufasaelrey13@gmail.com'

    const userData = {
      plan: 'premium',
      suscripcion_activa: true,
      suscripcion_fecha: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (hasAdminCredentials()) {
      getFirebaseAdminDb() // inicializa app
      const admin = await import('firebase-admin')
      const user = await admin.auth().getUserByEmail(email)
      const db = getFirebaseAdminDb()
      await db.collection('usuarios').doc(user.uid).set(userData, { merge: true })
      return NextResponse.json({
        success: true,
        message: `Plan premium asignado a ${email} (uid: ${user.uid})`,
      })
    }

    // Fallback: cliente SDK (requiere reglas que permitan query/update)
    const db = getFirebaseDb()
    const q = query(collection(db, 'usuarios'), where('email', '==', email))
    const snap = await getDocs(q)
    if (snap.empty) {
      return NextResponse.json(
        { error: `Usuario con email ${email} no encontrado` },
        { status: 404 }
      )
    }
    const userDoc = snap.docs[0]
    await setDoc(doc(db, 'usuarios', userDoc.id), userData, { merge: true })
    return NextResponse.json({
      success: true,
      message: `Plan premium asignado a ${email} (uid: ${userDoc.id})`,
    })
  } catch (error: unknown) {
    console.error('set-user-premium:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al asignar premium' },
      { status: 500 }
    )
  }
}

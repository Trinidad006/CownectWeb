/**
 * PIN kiosko (4 dígitos) — en API routes usar Firebase Admin (bypasea reglas de Firestore).
 */
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

const USUARIOS = 'usuarios'

export async function pinKioskoEnUso(pin: string): Promise<boolean> {
  if (hasAdminCredentials()) {
    const db = getFirebaseAdminDb()
    const snap = await db.collection(USUARIOS).where('pin_kiosko', '==', pin).limit(1).get()
    return !snap.empty
  }
  const db = getFirebaseDb()
  const q = query(collection(db, USUARIOS), where('pin_kiosko', '==', pin), limit(1))
  const snap = await getDocs(q)
  return !snap.empty
}

export async function generarPinKioskoUnico(): Promise<string> {
  for (let i = 0; i < 120; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    if (!(await pinKioskoEnUso(pin))) return pin
  }
  throw new Error('No se pudo generar un PIN único. Intenta de nuevo.')
}

/** Resuelve el correo del empleado por PIN único (solo rol TRABAJADOR). */
export async function obtenerEmailPorPinKiosko(pin: string): Promise<{
  email: string | null
  error?: 'no_encontrado' | 'ambiguo'
}> {
  if (hasAdminCredentials()) {
    const db = getFirebaseAdminDb()
    const snap = await db.collection(USUARIOS).where('pin_kiosko', '==', pin).limit(25).get()
    const workers = snap.docs.filter((d) => d.data().rol === 'TRABAJADOR')
    if (workers.length === 0) return { email: null, error: 'no_encontrado' }
    if (workers.length > 1) return { email: null, error: 'ambiguo' }
    const email = workers[0].data().email
    return { email: typeof email === 'string' ? email : null, error: email ? undefined : 'no_encontrado' }
  }
  const db = getFirebaseDb()
  const q = query(collection(db, USUARIOS), where('pin_kiosko', '==', pin), limit(25))
  const snap = await getDocs(q)
  const workers = snap.docs.filter((d) => d.data().rol === 'TRABAJADOR')
  if (workers.length === 0) return { email: null, error: 'no_encontrado' }
  if (workers.length > 1) return { email: null, error: 'ambiguo' }
  const email = workers[0].data().email
  return { email: typeof email === 'string' ? email : null, error: email ? undefined : 'no_encontrado' }
}

/** Valida combinación correo + PIN (compatibilidad). */
export async function validarEmailPinKiosko(email: string, pin: string): Promise<boolean> {
  if (hasAdminCredentials()) {
    const db = getFirebaseAdminDb()
    const snap = await db
      .collection(USUARIOS)
      .where('email', '==', email)
      .where('pin_kiosko', '==', pin)
      .limit(1)
      .get()
    if (snap.empty) return false
    return snap.docs[0].data().rol === 'TRABAJADOR'
  }
  const db = getFirebaseDb()
  const q = query(
    collection(db, USUARIOS),
    where('email', '==', email),
    where('pin_kiosko', '==', pin),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return false
  return snap.docs[0].data().rol === 'TRABAJADOR'
}

import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseDb, getFirebaseAuth } from '@/infrastructure/config/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json()

    if (!email || !pin) {
      return NextResponse.json({ error: 'Email y PIN son requeridos' }, { status: 400 })
    }

    const db = getFirebaseDb()
    const q = query(
      collection(db, 'usuarios'), 
      where('email', '==', email), 
      where('pin_kiosko', '==', pin)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return NextResponse.json({ error: 'PIN o correo incorrecto' }, { status: 401 })
    }

    const userData = snapshot.docs[0].data()
    
    // Autenticamos programáticamente con la contraseña temporal
    const auth = getFirebaseAuth()
    const tempPassword = `Cownect${pin}`
    
    const { user } = await signInWithEmailAndPassword(auth, email, tempPassword)

    return NextResponse.json({ 
      user: { id: user.uid, email: user.email, rol: userData.rol },
      message: 'Inicio de sesión exitoso' 
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: 'Error en la autenticación por PIN' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

type PublicRancher = {
  id: string
  nombre?: string
  apellido?: string
  rancho?: string
  rancho_pais?: string
  rancho_ciudad?: string
  descripcion_publica?: string
  tipos_ganado?: string[]
}

export async function GET() {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: 'Configuración de Firebase Admin requerida en el servidor.' },
      { status: 503 }
    )
  }

  try {
    const firestore = getFirebaseAdminDb()
    const snapshot = await firestore.collection('usuarios').where('perfil_publico', '==', true).get()
    const items: PublicRancher[] = snapshot.docs.map((d) => {
      const u = d.data() as Record<string, any>
      return {
        id: d.id,
        nombre: u.nombre,
        apellido: u.apellido,
        rancho: u.rancho,
        rancho_pais: u.rancho_pais,
        rancho_ciudad: u.rancho_ciudad,
        descripcion_publica: u.descripcion_publica,
        tipos_ganado: Array.isArray(u.tipos_ganado) ? u.tipos_ganado : [],
      }
    })
    items.sort((a, b) => (a.rancho || '').localeCompare(b.rancho || ''))
    return NextResponse.json({ items }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudieron cargar los ranchos públicos.' },
      { status: 500 }
    )
  }
}

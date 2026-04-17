import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: 'Configuración de Firebase Admin requerida en el servidor.' },
      { status: 503 }
    )
  }

  try {
    const id = params.id?.trim()
    if (!id) {
      return NextResponse.json({ error: 'ID de rancho inválido.' }, { status: 400 })
    }

    const db = getFirebaseAdminDb()
    const usuarioSnap = await db.collection('usuarios').doc(id).get()
    if (!usuarioSnap.exists) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })
    }

    const u = usuarioSnap.data() as Record<string, any>
    const perfil = {
      id,
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      rancho: u.rancho || '',
      rancho_pais: u.rancho_pais || '',
      rancho_ciudad: u.rancho_ciudad || '',
      descripcion_publica: u.descripcion_publica || '',
      tipos_ganado: Array.isArray(u.tipos_ganado) ? u.tipos_ganado : [],
      perfil_publico: u.perfil_publico === true,
    }

    const animalesSnap = await db.collection('animales').where('usuario_id', '==', id).get()
    const animalesEnVenta = animalesSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }))
      .filter((a) => a.en_venta === true && a.activo !== false)
      .map((a) => ({
        id: a.id as string,
        nombre: a.nombre || '',
        numero_identificacion: a.numero_identificacion || '',
        especie: a.especie || '',
        raza: a.raza || '',
        sexo: a.sexo || '',
        estado: a.estado || '',
        foto: a.foto || '',
      }))

    return NextResponse.json({ perfil, animalesEnVenta }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo cargar el perfil del rancho.' },
      { status: 500 }
    )
  }
}

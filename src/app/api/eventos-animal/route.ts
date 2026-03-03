import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { EventoTemporalValidator } from '@/domain/validators/EventoTemporalValidator'
import { FirebaseAdminEventoAnimalRepository } from '@/infrastructure/repositories/FirebaseAdminEventoAnimalRepository'
import { TIPOS_EVENTO, MOTIVOS_POR_TIPO, type TipoEvento } from '@/domain/entities/EventoAnimal'

type Body = {
  userId: string
  animal_id: string
  tipo_evento: TipoEvento
  fecha_evento: string
  motivo_id?: string
  observaciones?: string
  madre_id?: string
  cria_id?: string
}

function isValidTipoEvento(tipo: string): tipo is TipoEvento {
  return TIPOS_EVENTO.includes(tipo as TipoEvento)
}

function isValidMotivoForTipo(tipo: TipoEvento, motivoId: string | undefined): boolean {
  if (!motivoId) return true
  const motivos = MOTIVOS_POR_TIPO[tipo]
  return motivos.includes(motivoId)
}

/**
 * GET: Lista eventos de un animal.
 * Query: ?animal_id=xxx&userId=xxx&orden=asc|desc (default desc)
 */
export async function GET(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Configuración de Firebase Admin requerida.' }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const animal_id = searchParams.get('animal_id')
    const userId = searchParams.get('userId')
    const orden = (searchParams.get('orden') || 'desc') as 'asc' | 'desc'
    if (!animal_id || !userId) {
      return NextResponse.json({ error: 'Faltan query params: animal_id, userId.' }, { status: 400 })
    }
    const repo = new FirebaseAdminEventoAnimalRepository()
    const eventos = await repo.getByAnimalId(animal_id, userId, orden)
    return NextResponse.json(eventos)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al listar eventos.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST: Registra un nuevo evento en la línea de vida del animal.
 * Body: { userId, animal_id, tipo_evento, fecha_evento, motivo_id?, observaciones?, madre_id?, cria_id? }
 * Valida integridad temporal (no eventos tras MUERTE/VENTA/ROBO; PARTO tras SERVICIO; etc.).
 */
export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: 'Configuración de Firebase Admin requerida (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as Body
    const { userId, animal_id, tipo_evento, fecha_evento, motivo_id, observaciones, madre_id, cria_id } = body

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'Falta userId en el cuerpo de la petición.' }, { status: 400 })
    }
    if (!animal_id || typeof animal_id !== 'string' || !animal_id.trim()) {
      return NextResponse.json({ error: 'Falta animal_id.' }, { status: 400 })
    }
    if (!tipo_evento || !isValidTipoEvento(tipo_evento)) {
      return NextResponse.json(
        { error: `tipo_evento debe ser uno de: ${TIPOS_EVENTO.join(', ')}.` },
        { status: 400 }
      )
    }
    if (!fecha_evento || typeof fecha_evento !== 'string') {
      return NextResponse.json({ error: 'Falta fecha_evento (ISO 8601).' }, { status: 400 })
    }
    if (motivo_id && !isValidMotivoForTipo(tipo_evento, motivo_id)) {
      return NextResponse.json(
        { error: `motivo_id no válido para tipo_evento ${tipo_evento}.` },
        { status: 400 }
      )
    }
    if (tipo_evento === 'NACIMIENTO' && !madre_id) {
      return NextResponse.json({ error: 'En evento NACIMIENTO madre_id es obligatorio.' }, { status: 400 })
    }

    const db = getFirebaseAdminDb()

    // Verificar que el animal existe y pertenece al usuario
    const animalSnap = await db.collection('animales').doc(animal_id).get()
    if (!animalSnap.exists) {
      return NextResponse.json({ error: 'Animal no encontrado.' }, { status: 404 })
    }
    const animalData = animalSnap.data()
    if (animalData?.usuario_id !== userId.trim()) {
      return NextResponse.json({ error: 'No tienes permiso para registrar eventos de este animal.' }, { status: 403 })
    }

    const repo = new FirebaseAdminEventoAnimalRepository()
    const eventosExistentes = await repo.getByAnimalId(animal_id, userId.trim(), 'asc')

    const nuevoEvento = {
      animal_id: animal_id.trim(),
      tipo_evento,
      fecha_evento: fecha_evento.trim(),
      motivo_id,
      usuario_id: userId.trim(),
      observaciones,
      madre_id,
      cria_id,
    }

    const validator = new EventoTemporalValidator(repo)
    const validacion = await validator.validarAntesDeRegistrar(nuevoEvento, eventosExistentes)
    if (!validacion.valido) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const creado = await repo.create(nuevoEvento)
    return NextResponse.json(creado, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar el evento.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

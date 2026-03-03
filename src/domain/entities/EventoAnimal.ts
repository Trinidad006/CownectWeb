/**
 * Catálogo cerrado de tipos de evento en la línea de vida del animal.
 * El estado actual del animal se deriva del último evento relevante.
 */
import type { ExamenOvarico } from '../value-objects/ExamenOvarico'
export const TIPOS_EVENTO = [
  'NACIMIENTO',
  'CELO',
  'SERVICIO',
  'DIAGNOSTICO_GESTACION',
  'PARTO',
  'ABORTO',
  'DESTETE',
  'MUERTE',
  'VENTA',
  'ROBO',
  'DESCARTE',
] as const

export type TipoEvento = (typeof TIPOS_EVENTO)[number]

/** Eventos que "cierran" la vida del animal: tras ellos no se permiten más eventos. */
export const EVENTOS_CIERRE_VIDA: TipoEvento[] = ['MUERTE', 'VENTA', 'ROBO', 'DESCARTE']

/** Eventos reproductivos para hembras (celo, gestación, parto, destete). */
export const EVENTOS_REPRODUCTIVOS: TipoEvento[] = [
  'CELO',
  'SERVICIO',
  'DIAGNOSTICO_GESTACION',
  'PARTO',
  'ABORTO',
  'DESTETE',
]

/**
 * Catálogo cerrado de motivos por tipo de evento.
 * Clave = tipo_evento, valor = motivo_id permitidos.
 */
export const MOTIVOS_POR_TIPO: Record<TipoEvento, readonly string[]> = {
  NACIMIENTO: ['NORMAL', 'GEMELAR', 'DISTOCIA', 'OTRO'],
  CELO: ['DETECTADO', 'OBSERVADO', 'OTRO'],
  SERVICIO: ['MONTA_NATURAL', 'INSEMINACION', 'OTRO'],
  DIAGNOSTICO_GESTACION: ['POSITIVO', 'NEGATIVO'],
  PARTO: ['NORMAL', 'DISTOCIA', 'GEMELAR', 'NATIMORTO', 'OTRO'],
  ABORTO: ['NATURAL', 'INFECCION', 'TRAUMATICO', 'OTRO'],
  DESTETE: ['EDAD', 'PESO', 'MANUAL', 'OTRO'],
  MUERTE: ['NATURAL', 'ENFERMEDAD', 'ACCIDENTE', 'SACRIFICIO', 'OTRO'],
  VENTA: ['VENTA_NORMAL', 'SUBASTA', 'OTRO'],
  ROBO: ['ROBO_PARCIAL', 'ROBO_TOTAL', 'OTRO'],
  DESCARTE: ['BAJA_PRODUCCION', 'EDAD', 'ENFERMEDAD_CRONICA', 'OTRO'],
}

export interface EventoAnimal {
  id?: string
  animal_id: string
  tipo_evento: TipoEvento
  fecha_evento: string // ISO 8601
  motivo_id?: string // Del catálogo según tipo_evento
  usuario_id: string
  observaciones?: string
  /** Obligatorio en NACIMIENTO (ID de la madre). */
  madre_id?: string
  /** En PARTO/ABORTO: ID del animal cría si ya existe en el sistema. */
  cria_id?: string
  created_at?: string
  // --- Payload reproductivo (eventos CELO / SERVICIO) ---
  /** CELO: signos observados (texto libre). */
  signos_celo?: string
  /** CELO: examen ovárico (folículos, cuerpo lúteo, método). */
  examen_ovarico?: ExamenOvarico
  /** SERVICIO: tipo de servicio (IA o monta natural). */
  tipo_servicio?: 'INSEMINACION' | 'MONTA_NATURAL'
  /** SERVICIO: ID del toro o código de pajilla. */
  toro_id?: string
  /** SERVICIO: ID o código de pajilla (inseminación). */
  pajilla_id?: string
}

/** Resultado de diagnóstico de gestación para derivar estado reproductivo. */
export type ResultadoDiagnosticoGestacion = 'POSITIVO' | 'NEGATIVO'

/**
 * Value Object para examen ovárico (palpación/ultrasonido).
 * Conteo folicular y presencia de cuerpo lúteo.
 */
export type MetodoExamenOvarico = 'palpacion' | 'ultrasonido'

export interface ExamenOvarico {
  /** Número de folículos detectados */
  conteo_folicular: number
  /** Presencia de cuerpo lúteo */
  cuerpo_luteo_presente: boolean
  /** Método de detección */
  metodo: MetodoExamenOvarico
}

const CONTEO_FOLICULAR_MIN = 0
const CONTEO_FOLICULAR_MAX = 50

export function crearExamenOvarico(
  conteoFolicular: number,
  cuerpoLuteoPresente: boolean,
  metodo: MetodoExamenOvarico
): ExamenOvarico {
  if (
    typeof conteoFolicular !== 'number' ||
    conteoFolicular < CONTEO_FOLICULAR_MIN ||
    conteoFolicular > CONTEO_FOLICULAR_MAX
  ) {
    throw new Error(
      `El conteo folicular debe ser un número entre ${CONTEO_FOLICULAR_MIN} y ${CONTEO_FOLICULAR_MAX}.`
    )
  }
  if (metodo !== 'palpacion' && metodo !== 'ultrasonido') {
    throw new Error('Método de examen debe ser "palpacion" o "ultrasonido".')
  }
  return {
    conteo_folicular: Math.floor(conteoFolicular),
    cuerpo_luteo_presente: !!cuerpoLuteoPresente,
    metodo,
  }
}

export function esExamenOvaricoValido(obj: unknown): obj is ExamenOvarico {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.conteo_folicular === 'number' &&
    o.conteo_folicular >= CONTEO_FOLICULAR_MIN &&
    o.conteo_folicular <= CONTEO_FOLICULAR_MAX &&
    typeof o.cuerpo_luteo_presente === 'boolean' &&
    (o.metodo === 'palpacion' || o.metodo === 'ultrasonido')
  )
}



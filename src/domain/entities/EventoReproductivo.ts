import type { EventoAnimal, TipoEvento } from './EventoAnimal'
import { EVENTOS_REPRODUCTIVOS } from './EventoAnimal'

/** Tipo de evento que es reproductivo. */
export type TipoEventoReproductivo = (typeof EVENTOS_REPRODUCTIVOS)[number]

/**
 * Entidad de dominio: evento reproductivo (celo, servicio, diagnóstico de preñez, parto, aborto).
 * Es un EventoAnimal con tipo_evento restringido a EVENTOS_REPRODUCTIVOS.
 * Mantiene trazabilidad cronológica exigida por el PGN (Padrón Ganadero Nacional).
 */
export type EventoReproductivo = EventoAnimal & {
  tipo_evento: TipoEventoReproductivo
}

export function esEventoReproductivo(e: EventoAnimal): e is EventoReproductivo {
  return (EVENTOS_REPRODUCTIVOS as readonly TipoEvento[]).includes(e.tipo_evento)
}

export type BuyRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

export interface BuyRequest {
  /** Firestore document id */
  id: string
  /** Usuario que envía la solicitud */
  fromUserId: string
  /** Usuario dueño del rancho / receptor de la solicitud */
  toUserId: string
  /** IDs de animales involucrados (opcional, puede ser una solicitud genérica) */
  animalIds?: string[]
  /** Mensaje inicial que describe qué quiere comprar */
  mensajeInicial: string
  /** Estado actual del request */
  estado: BuyRequestStatus
  /** ID del deal on‑chain asociado (si ya existe) */
  dealIdOnchain?: string
  /** Timestamps ISO 8601 */
  createdAt: string
  updatedAt: string
}


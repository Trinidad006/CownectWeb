export interface ChatMessage {
  /** Firestore document id */
  id: string
  /** Chat al que pertenece (uno por buy request) */
  chatId: string
  /** Usuario que envía el mensaje */
  authorId: string
  /** Texto del mensaje */
  texto: string
  /** URLs de adjuntos (fotos, PDFs, etc.) almacenados off‑chain */
  attachmentUrls?: string[]
  /** Timestamp ISO 8601 */
  createdAt: string
}


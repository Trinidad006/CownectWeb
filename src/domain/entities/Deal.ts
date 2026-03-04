export type DealState = 'pending' | 'paid' | 'completed' | 'cancelled'

export interface Deal {
  /** ID del deal on‑chain (por ejemplo, dealId en el smart contract) */
  dealIdOnchain: string
  /** IDs de usuarios en nuestra base de datos */
  buyerId: string
  sellerId: string
  /** Buy request asociada a este deal */
  buyRequestId: string
  /** Monto acordado y moneda (ej. USDC) */
  price: number
  currency: string
  /** Estado sincronizado con la blockchain */
  state: DealState
  /** Timestamps ISO 8601 */
  createdAt: string
  updatedAt: string
}


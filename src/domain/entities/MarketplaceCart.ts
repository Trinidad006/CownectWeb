import type { LoteMarketplace, GanadoEnLote } from './LoteMarketplace'

/**
 * Item en el carrito: puede ser un lote completo o un ganado individual.
 */
export interface CartItem {
  id: string
  tipo: 'lote' | 'ganado'
  lote?: LoteMarketplace
  ganado?: GanadoEnLote
  precioUsd: number
  cantidad: number
}

export interface ContratoInteligente {
  id: string
  ganadoId: string
  loteId: string
  direccionContrato?: string
  red?: string
  estado?: 'pendiente' | 'activo' | 'liquidado'
}

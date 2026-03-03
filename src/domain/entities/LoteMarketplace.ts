/**
 * Lote de ganado listado en el Marketplace.
 * Puede estar certificado por lote (hash o ID de certificación).
 */
export interface GanadoEnLote {
  id: string
  siniiga: string
  nombre?: string
  raza?: string
  peso_kg?: number
  sexo?: 'M' | 'H'
  contratoInteligenteId?: string
  fotoUrl?: string
  descripcion?: string
}

export interface LoteMarketplace {
  id: string
  nombre: string
  descripcion?: string
  certificadoBlockchainId: string
  ganados: GanadoEnLote[]
  precioTotalUsd: number
  vendedorNombre?: string
  vendedorId?: string
  vendorPostalCode?: string
  imagenUrl?: string
  ubicacion?: string
  detalles?: string
  proposito?: string
  certificadoSanitario?: boolean
  vendedorOro?: boolean
  esNuevo?: boolean
  videoUrl?: string
  coords?: {
    lat: number
    lng: number
  }
  ratingAverage?: number
  ratingCount?: number
  reviewsSample?: {
    buyerName: string
    comment: string
    rating: number
  }[]
  createdAt?: string
}

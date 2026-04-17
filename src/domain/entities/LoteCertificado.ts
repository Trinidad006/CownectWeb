/**
 * Lote definido por el ganadero para agrupar animales y emitir un certificado on-chain único al lote.
 * El ID on-chain usa el prefijo `lote:{id}` en el contrato AnimalCertificates.
 */
export interface LoteCertificado {
  id: string
  usuario_id: string
  rancho_id?: string | null
  nombre: string
  animal_ids: string[]
  created_at?: string
  updated_at?: string
  certificate_id_onchain?: string
  tx_hash?: string | null
  metadata_uri?: string | null
}

export interface AnimalCertificate {
  id: string
  animal_id: string
  usuario_id: string
  owner_wallet: string | null
  certificate_id_onchain: string
  cownect_certificate_id?: number
  metadata_uri: string
  tx_hash?: string | null
  created_at: string
}


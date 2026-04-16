export interface Rancho {
  id?: string
  usuario_id: string
  nombre: string
  pais?: string
  ciudad?: string
  direccion?: string
  descripcion?: string
  hectareas?: number
  tipos_ganado?: string[]
  certificado_cownect?: boolean
  activo?: boolean
  created_at?: string
  updated_at?: string
}

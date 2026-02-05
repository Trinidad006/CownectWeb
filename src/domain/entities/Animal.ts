export interface Animal {
  id?: string
  usuario_id: string
  nombre?: string
  numero_identificacion?: string
  especie?: string
  raza?: string
  fecha_nacimiento?: string
  sexo?: 'M' | 'H'
  estado?: string
  en_venta?: boolean
  precio_venta?: number
  created_at?: string
  updated_at?: string
}


export interface User {
  id: string
  email: string
  nombre?: string
  apellido?: string
  telefono?: string
  rancho?: string
  rancho_hectareas?: number
  rancho_pais?: string
  rancho_ciudad?: string
  rancho_direccion?: string
  rancho_descripcion?: string
  moneda?: string
  foto_perfil?: string // URL de la imagen de perfil
  plan?: 'gratuito' | 'premium'
  suscripcion_activa?: boolean
  suscripcion_fecha?: string
  almacenamiento_usado_bytes?: number
  almacenamiento_limite_bytes?: number
  created_at?: string
  updated_at?: string
}


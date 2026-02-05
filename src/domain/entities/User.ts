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
  created_at?: string
  updated_at?: string
}


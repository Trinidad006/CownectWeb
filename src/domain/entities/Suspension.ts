export interface Suspension {
  id?: string
  usuario_id: string // Usuario suspendido
  motivo: string // Motivo de la suspensión
  fecha_inicio: string // Fecha de inicio de la suspensión
  fecha_fin?: string // Fecha de fin (si es temporal)
  permanente: boolean // Si es permanente o temporal
  reportes_relacionados: string[] // IDs de los reportes que causaron la suspensión
  estado: 'activa' | 'finalizada' | 'apelada' // Estado de la suspensión
  apelacion?: {
    mensaje?: string
    fecha?: string
    revisada?: boolean
  }
  created_at?: string
  updated_at?: string
}


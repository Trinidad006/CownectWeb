export interface Reporte {
  id?: string
  reportador_id: string // Usuario que hace el reporte
  reportado_id: string // Usuario reportado
  animal_id?: string // Animal relacionado (opcional, para reportes de publicaciones)
  motivo: string // Motivo del reporte
  detalles?: string // Detalles adicionales
  estado: 'pendiente' | 'aceptado' | 'rechazado' // Estado del reporte
  revisado_por?: string // ID del administrador que revisó
  fecha_revision?: string // Fecha de revisión
  created_at?: string
  updated_at?: string
}


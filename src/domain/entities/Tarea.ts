export type TareaEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA'

export interface Tarea {
  id?: string
  usuario_id: string
  rancho_id?: string
  titulo: string
  descripcion?: string
  asignado_a?: string
  estado?: TareaEstado
  fecha_vencimiento?: string
  created_at?: string
  updated_at?: string
}

export type RegistroClinicoEstado = 'ACTIVO' | 'RESUELTO' | 'CRONICO'

export interface RegistroClinico {
  id?: string
  usuario_id: string
  rancho_id?: string
  animal_id?: string
  fecha_registro: string
  enfermedad: string
  diagnostico?: string
  tratamiento?: string
  veterinario?: string
  estado?: RegistroClinicoEstado
  observaciones?: string
  created_at?: string
  updated_at?: string
}

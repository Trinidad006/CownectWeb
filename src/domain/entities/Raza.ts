export interface Raza {
  id?: string
  nombre: string
  aptitud: 'Lechera' | 'Cárnica' | 'Doble Propósito'
  especie: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)'
  clima_ideal: 'Templado' | 'Tropical' | 'Tropical/Adaptado' | 'Variado'
  composicion?: string // Para razas sintéticas
  origen?: string // País/región de origen
  descripcion?: string
  activa?: boolean
  created_at?: string
  updated_at?: string
}

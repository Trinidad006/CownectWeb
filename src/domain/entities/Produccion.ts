export type ProduccionTipo = 'LECHE' | 'CARNE'
export type ProduccionUnidad = 'LITROS' | 'KG'

export interface Produccion {
  id?: string
  usuario_id: string
  rancho_id?: string
  animal_id?: string
  tipo: ProduccionTipo
  cantidad: number
  unidad: ProduccionUnidad
  fecha_registro: string
  observaciones?: string
  created_at?: string
  updated_at?: string
}

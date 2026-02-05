export interface Compra {
  id?: string
  animal_id: string
  comprador_id: string
  vendedor_id: string
  precio: number
  estado: 'en_proceso' | 'completada' | 'cancelada'
  fecha_compra: string
  fecha_completada?: string
  fecha_cancelada?: string
  created_at?: string
  updated_at?: string
}


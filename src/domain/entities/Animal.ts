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
  estado_venta?: 'en_venta' | 'proceso_venta' | 'vendido'
  // Documentos requeridos para venta
  documento_guia_transito?: string // URL de la imagen
  documento_factura_venta?: string // URL de la imagen
  documento_certificado_movilizacion?: string // URL de la imagen (SINIIGA)
  documento_certificado_zoosanitario?: string // URL de la imagen
  documento_patente_fierro?: string // URL de la imagen
  documentos_completos?: boolean // true si tiene todos los documentos
  foto?: string // URL de la imagen del animal
  madre_id?: string // ID de la madre (para crías)
  created_at?: string
  updated_at?: string
}


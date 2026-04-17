export interface Animal {
  id?: string
  usuario_id: string
  nombre?: string
  numero_identificacion?: string
  especie?: string
  raza_id?: string // ID referencia a la colección 'razas'
  raza?: string // Nombre de raza (para compatibilidad)
  fecha_nacimiento?: string
  sexo?: 'M' | 'H'
  estado?: string
  // Documentos requeridos para venta
  documento_guia_transito?: string // URL de la imagen
  documento_factura_venta?: string // URL de la imagen
  documento_certificado_movilizacion?: string // URL de la imagen (SINIIGA)
  documento_certificado_zoosanitario?: string // URL de la imagen
  documento_patente_fierro?: string // URL de la imagen
  documentos_completos?: boolean // true si tiene todos los documentos
  estado_documentacion?: 'completa' | 'incompleta' // Estado de la documentación
  // Validación/revisión interna (solo administradores la establecen).
  // Si true, el animal queda habilitado para generar certificado on-chain y/o venta.
  revisado_para_venta?: boolean
  foto?: string // URL de la imagen del animal
  madre_id?: string // ID de la madre (para crías)
  observaciones?: string // Notas del animal (varias separadas por " · ")
  rancho_id?: string
  activo?: boolean // true si el animal está activo, false si está inactivo (muerto, robado, eliminado)
  razon_inactivo?: string // Razón por la cual el animal fue marcado como inactivo (opcional)
  /** Alias usado en algunas pantallas de archivo histórico */
  razon_estado?: string
  fecha_inactivo?: string // Fecha en que se marcó como inactivo
  /** Cría del hato o comprado (gestión / certificados) */
  origen?: 'cria' | 'comprado' | string
  estado_reproductivo?: string
  ultimo_celo?: string
  dias_gestacion?: number
  created_at?: string
  updated_at?: string
}


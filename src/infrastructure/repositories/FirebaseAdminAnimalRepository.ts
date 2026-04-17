/**
 * Implementación de AnimalRepository con Firebase Admin SDK.
 * Solo getById para uso en API routes (estado reproductivo, etc.).
 */

import { getFirebaseAdminDb } from '../config/firebaseAdmin'
import { AnimalRepository } from '@/domain/repositories/AnimalRepository'
import { Animal } from '@/domain/entities/Animal'

const ANIMALES_COLLECTION = 'animales'

function toAnimal(id: string, data: Record<string, unknown>): Animal {
  return {
    id,
    usuario_id: data.usuario_id as string,
    nombre: data.nombre as string,
    numero_identificacion: data.numero_identificacion as string,
    especie: data.especie as string,
    raza: data.raza as string,
    fecha_nacimiento: data.fecha_nacimiento as string,
    sexo: data.sexo as 'M' | 'H',
    estado: data.estado as string,
    documento_guia_transito: data.documento_guia_transito as string,
    documento_factura_venta: data.documento_factura_venta as string,
    documento_certificado_movilizacion: data.documento_certificado_movilizacion as string,
    documento_certificado_zoosanitario: data.documento_certificado_zoosanitario as string,
    documento_patente_fierro: data.documento_patente_fierro as string,
    documentos_completos: (data.documentos_completos as boolean) ?? false,
    estado_documentacion: data.estado_documentacion as 'completa' | 'incompleta',
    foto: data.foto as string,
    madre_id: data.madre_id as string,
    observaciones: data.observaciones as string,
    activo: data.activo !== undefined ? (data.activo as boolean) : true,
    razon_inactivo: data.razon_inactivo as string,
    fecha_inactivo: data.fecha_inactivo as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

export class FirebaseAdminAnimalRepository implements AnimalRepository {
  async getById(id: string, userId: string): Promise<Animal | null> {
    const db = getFirebaseAdminDb()
    const ref = db.collection(ANIMALES_COLLECTION).doc(id)
    const snap = await ref.get()
    if (!snap.exists) return null
    const data = snap.data()
    if (!data || data.usuario_id !== userId) return null
    return toAnimal(snap.id, data)
  }

  async getAll(): Promise<Animal[]> {
    throw new Error('FirebaseAdminAnimalRepository.getAll no implementado. Use solo getById en API.')
  }
  async create(): Promise<Animal> {
    throw new Error('FirebaseAdminAnimalRepository.create no implementado.')
  }
  async update(): Promise<Animal> {
    throw new Error('FirebaseAdminAnimalRepository.update no implementado.')
  }
  async delete(): Promise<void> {
    throw new Error('FirebaseAdminAnimalRepository.delete no implementado.')
  }
  async findByNumeroIdentificacion(): Promise<Animal | null> {
    throw new Error('FirebaseAdminAnimalRepository.findByNumeroIdentificacion no implementado.')
  }
  async save(): Promise<void> {
    throw new Error('FirebaseAdminAnimalRepository.save no implementado.')
  }
  async findById(): Promise<{ siniiga: string; nombre: string; raza: string; estado: string } | null> {
    throw new Error('FirebaseAdminAnimalRepository.findById no implementado.')
  }
  async updateStatus(): Promise<void> {
    throw new Error('FirebaseAdminAnimalRepository.updateStatus no implementado.')
  }
}



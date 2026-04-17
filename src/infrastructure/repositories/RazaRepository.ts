import { Raza } from '@/domain/entities/Raza'
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  QueryConstraint,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'

export class RazaRepository {
  private collectionName = 'razas'

  /**
   * Obtener todas las razas activas
   */
  async getAllRazas(): Promise<Raza[]> {
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, this.collectionName),
        where('activa', '==', true)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Raza[]
    } catch (error) {
      console.error('Error al obtener razas:', error)
      throw error
    }
  }

  /**
   * Obtener razas filtradas por aptitud
   */
  async getRazasByAptitud(aptitud: 'Lechera' | 'Cárnica' | 'Doble Propósito'): Promise<Raza[]> {
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, this.collectionName),
        where('aptitud', '==', aptitud),
        where('activa', '==', true)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Raza[]
    } catch (error) {
      console.error(`Error al obtener razas por aptitud ${aptitud}:`, error)
      throw error
    }
  }

  /**
   * Obtener razas filtradas por especie
   */
  async getRazasByEspecie(especie: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)'): Promise<Raza[]> {
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, this.collectionName),
        where('especie', '==', especie),
        where('activa', '==', true)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Raza[]
    } catch (error) {
      console.error(`Error al obtener razas por especie ${especie}:`, error)
      throw error
    }
  }

  /**
   * Obtener una raza por ID
   */
  async getRazaById(id: string): Promise<Raza | null> {
    try {
      const db = getFirebaseDb()
      const docRef = doc(db, this.collectionName, id)
      const snapshot = await getDocs(
        query(collection(db, this.collectionName), where('__name__', '==', id))
      )
      
      if (snapshot.empty) {
        return null
      }

      const docData = snapshot.docs[0].data()
      return {
        id: snapshot.docs[0].id,
        ...docData,
      } as Raza
    } catch (error) {
      console.error('Error al obtener raza por ID:', error)
      throw error
    }
  }

  /**
   * Obtener razas por clima ideal (útil para recomendaciones)
   */
  async getRazasByClima(clima: 'Templado' | 'Tropical' | 'Tropical/Adaptado' | 'Variado'): Promise<Raza[]> {
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, this.collectionName),
        where('clima_ideal', '==', clima),
        where('activa', '==', true)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Raza[]
    } catch (error) {
      console.error(`Error al obtener razas por clima ${clima}:`, error)
      throw error
    }
  }

  /**
   * Crear una nueva raza (solo admin)
   */
  async createRaza(raza: Omit<Raza, 'id' | 'created_at' | 'updated_at'>): Promise<Raza> {
    try {
      const db = getFirebaseDb()
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...raza,
        activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      return {
        id: docRef.id,
        ...raza,
        activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Raza
    } catch (error) {
      console.error('Error al crear raza:', error)
      throw error
    }
  }

  /**
   * Actualizar una raza (solo admin)
   */
  async updateRaza(id: string, updates: Partial<Raza>): Promise<void> {
    try {
      const db = getFirebaseDb()
      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error al actualizar raza:', error)
      throw error
    }
  }

  /**
   * Desactivar una raza (soft delete)
   */
  async deactivateRaza(id: string): Promise<void> {
    try {
      await this.updateRaza(id, { activa: false })
    } catch (error) {
      console.error('Error al desactivar raza:', error)
      throw error
    }
  }

  /**
   * Obtener sugerencia de razas recomendadas para un usuario
   * Basado en su ubicación/clima
   */
  async getRecommendedRazas(
    aptitud?: 'Lechera' | 'Cárnica' | 'Doble Propósito',
    clima?: string
  ): Promise<Raza[]> {
    try {
      const db = getFirebaseDb()
      let constraints: QueryConstraint[] = [where('activa', '==', true)]

      if (aptitud) {
        constraints.push(where('aptitud', '==', aptitud))
      }

      if (clima) {
        // Buscar razas que se adapten al clima
        constraints.push(where('clima_ideal', 'in', [clima, 'Variado', 'Tropical/Adaptado']))
      }

      const q = query(collection(db, this.collectionName), ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Raza[]
    } catch (error) {
      console.error('Error al obtener razas recomendadas:', error)
      throw error
    }
  }
}

// Exportar instancia singleton
export const razaRepository = new RazaRepository()

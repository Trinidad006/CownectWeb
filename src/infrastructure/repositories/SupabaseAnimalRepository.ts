import { getSupabaseClient } from '../config/supabaseClient'
import { AnimalRepository } from '@/domain/repositories/AnimalRepository'
import { Animal } from '@/domain/entities/Animal'

export class SupabaseAnimalRepository implements AnimalRepository {
  async getAll(userId: string): Promise<Animal[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('animales')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getById(id: string, userId: string): Promise<Animal | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('animales')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', userId)
      .single()

    if (error) return null
    return data
  }

  async create(animal: Animal): Promise<Animal> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('animales')
      .insert(animal)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, animal: Partial<Animal>): Promise<Animal> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('animales')
      .update(animal)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('animales')
      .delete()
      .eq('id', id)
      .eq('usuario_id', userId)

    if (error) throw error
  }

  async getForSale(): Promise<Animal[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('animales')
      .select('*, usuarios:usuario_id(nombre, apellido, telefono)')
      .eq('en_venta', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async markForSale(id: string, price: number, userId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('animales')
      .update({ en_venta: true, precio_venta: price })
      .eq('id', id)
      .eq('usuario_id', userId)

    if (error) throw error
  }
}


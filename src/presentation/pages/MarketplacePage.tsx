'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'

function MarketplaceContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<any[]>([])
  const [myAnimales, setMyAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [showMarkForSale, setShowMarkForSale] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [price, setPrice] = useState('')

  useEffect(() => {
    loadAnimalesForSale()
    loadMyAnimales()
  }, [])

  const loadAnimalesForSale = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: animalesData, error: animalesError } = await supabase
        .from('animales')
        .select('*')
        .eq('en_venta', true)
        .order('created_at', { ascending: false })

      if (animalesError) throw animalesError

      // Obtener información de usuarios para cada animal
      const animalesConUsuarios = await Promise.all(
        (animalesData || []).map(async (animal) => {
          const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('nombre, apellido, telefono, email')
            .eq('id', animal.usuario_id)
            .single()

          return {
            ...animal,
            usuario: usuarioData || null,
          }
        })
      )

      setAnimales(animalesConUsuarios)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMyAnimales = async () => {
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('animales')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('en_venta', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyAnimales(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleMarkForSale = async () => {
    if (!selectedAnimal || !price || !user) {
      alert('Por favor ingrese un precio')
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('animales')
        .update({ en_venta: true, precio_venta: parseFloat(price) })
        .eq('id', selectedAnimal.id)
        .eq('usuario_id', user.id)

      if (error) throw error

      setShowMarkForSale(false)
      setSelectedAnimal(null)
      setPrice('')
      loadAnimalesForSale()
      loadMyAnimales()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="text-white text-xl relative z-10">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <BackButton href="/dashboard" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Marketplace Ganadero</h2>
          </div>
        </div>

        {/* Mis animales para vender */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-black mb-4">Mis Animales Disponibles para Venta</h3>
          {myAnimales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAnimales.map((animal) => (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  <button
                    onClick={() => {
                      setSelectedAnimal(animal)
                      setShowMarkForSale(true)
                    }}
                    className="w-full mt-4 bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                  >
                    Poner en Venta
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-lg">No tienes animales disponibles para vender</p>
          )}
        </div>

        {/* Animales en venta */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-black mb-4">Animales en Venta</h3>
          {animales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animales.map((animal: any) => (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                  <p className="text-2xl font-bold text-cownect-green mb-2">${animal.precio_venta?.toLocaleString() || '0'}</p>
                  {animal.usuario && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-gray-700 mb-1"><strong>Vendedor:</strong> {animal.usuario.nombre} {animal.usuario.apellido}</p>
                      <p className="text-gray-700 mb-1"><strong>Teléfono:</strong> {animal.usuario.telefono || 'N/A'}</p>
                      <p className="text-gray-700"><strong>Email:</strong> {animal.usuario.email || 'N/A'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-lg">No hay animales en venta en este momento</p>
          )}
        </div>

        {/* Modal para poner en venta */}
        {showMarkForSale && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-black mb-4">Poner en Venta</h3>
              <p className="text-gray-700 mb-4"><strong>Animal:</strong> {selectedAnimal.nombre || 'Sin nombre'}</p>
              <div className="mb-4">
                <label className="block text-base font-bold text-black mb-2">Precio (COP)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  placeholder="Ej: 1000000"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleMarkForSale}
                  className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowMarkForSale(false)
                    setSelectedAnimal(null)
                    setPrice('')
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <MarketplaceContent />
    </ProtectedRoute>
  )
}


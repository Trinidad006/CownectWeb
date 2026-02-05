'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { PAISES_MONEDAS, getMonedaByPais, formatPrecio } from '@/utils/paisesMonedas'
import Select from '../components/ui/Select'

const animalRepository = new FirebaseAnimalRepository()

function AnimalesContent() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [showMarkForSale, setShowMarkForSale] = useState(false)
  const [selectedAnimalForSale, setSelectedAnimalForSale] = useState<Animal | null>(null)
  const [price, setPrice] = useState('')
  const [ranchoData, setRanchoData] = useState({
    rancho: '',
    rancho_hectareas: '',
    rancho_pais: '',
    rancho_ciudad: '',
    rancho_direccion: '',
  })
  const [formData, setFormData] = useState({
    nombre: '',
    numero_identificacion: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: 'M' as 'M' | 'H',
    estado: '',
  })

  useEffect(() => {
    loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    if (!user?.id) return
    try {
      const data = await animalRepository.getAll(user.id)
      setAnimales(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    try {
      if (editingAnimal?.id) {
        await animalRepository.update(editingAnimal.id, formData)
      } else {
        await animalRepository.create({
          ...formData,
          usuario_id: user.id,
        })
      }
      setShowForm(false)
      setEditingAnimal(null)
      setFormData({
        nombre: '',
        numero_identificacion: '',
        especie: '',
        raza: '',
        fecha_nacimiento: '',
        sexo: 'M',
        estado: '',
      })
      loadAnimales()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal)
    setFormData({
      nombre: animal.nombre || '',
      numero_identificacion: animal.numero_identificacion || '',
      especie: animal.especie || '',
      raza: animal.raza || '',
      fecha_nacimiento: animal.fecha_nacimiento || '',
      sexo: animal.sexo || 'M',
      estado: animal.estado || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este animal?') || !user?.id) return
    try {
      await animalRepository.delete(id, user.id)
      loadAnimales()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleMarkForSale = async () => {
    if (!selectedAnimalForSale?.id || !price || !user?.id) {
      alert('Por favor ingrese un precio')
      return
    }
    if (!ranchoData.rancho.trim()) {
      alert('Por favor ingrese el nombre del rancho de origen')
      return
    }
    try {
      await animalRepository.markForSale(selectedAnimalForSale.id, parseFloat(price), user.id)
      const info = ranchoData.rancho_pais ? getMonedaByPais(ranchoData.rancho_pais) : null
      await firestoreService.updateUsuario(user.id, {
        rancho: ranchoData.rancho.trim(),
        rancho_hectareas: ranchoData.rancho_hectareas ? parseFloat(ranchoData.rancho_hectareas) : undefined,
        rancho_pais: ranchoData.rancho_pais || undefined,
        rancho_ciudad: ranchoData.rancho_ciudad || undefined,
        rancho_direccion: ranchoData.rancho_direccion || undefined,
        moneda: info?.moneda,
      })
      await checkAuth()
      setShowMarkForSale(false)
      setSelectedAnimalForSale(null)
      setPrice('')
      setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '' })
      loadAnimales()
      alert('Animal puesto en venta exitosamente')
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
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Gestión de Animales</h2>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditingAnimal(null)
                setFormData({
                  nombre: '',
                  numero_identificacion: '',
                  especie: '',
                  raza: '',
                  fecha_nacimiento: '',
                  sexo: 'M',
                  estado: '',
                })
              }}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              {showForm ? 'Cancelar' : '+ Registrar Animal'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-4">{editingAnimal ? 'Editar Animal' : 'Nuevo Animal'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Número de Identificación</label>
                  <input
                    type="text"
                    value={formData.numero_identificacion}
                    onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Especie</label>
                  <input
                    type="text"
                    value={formData.especie}
                    onChange={(e) => setFormData({ ...formData, especie: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Raza</label>
                  <input
                    type="text"
                    value={formData.raza}
                    onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as 'M' | 'H' })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Estado</label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="Ej: Activo, Enfermo, etc."
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-black text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all"
              >
                {editingAnimal ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {animales.map((animal) => (
              <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h3>
                <p className="text-gray-700 mb-1"><strong>ID:</strong> {animal.numero_identificacion || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                <p className="text-gray-700 mb-1"><strong>Estado:</strong> {animal.estado || 'N/A'}</p>
                {animal.en_venta && (
                  <p className="text-lg font-bold text-cownect-green mb-2">
                    En Venta: {formatPrecio(animal.precio_venta ?? 0, user?.rancho_pais)}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {!animal.en_venta && (
                    <button
                      onClick={() => {
                        setSelectedAnimalForSale(animal)
                        setRanchoData({
                          rancho: user?.rancho || '',
                          rancho_hectareas: user?.rancho_hectareas?.toString() || '',
                          rancho_pais: user?.rancho_pais || '',
                          rancho_ciudad: user?.rancho_ciudad || '',
                          rancho_direccion: user?.rancho_direccion || '',
                        })
                        setShowMarkForSale(true)
                      }}
                      className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600 transition-all"
                    >
                      Poner en Venta
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(animal)}
                      className="flex-1 bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => animal.id && handleDelete(animal.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {animales.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No hay animales registrados</p>
            </div>
          )}

          {showMarkForSale && selectedAnimalForSale && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold text-black mb-4">Poner en Venta</h3>
                <p className="text-gray-700 mb-4"><strong>Animal:</strong> {selectedAnimalForSale.nombre || 'Sin nombre'}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Nombre del Rancho *</label>
                    <input
                      type="text"
                      value={ranchoData.rancho}
                      onChange={(e) => setRanchoData({ ...ranchoData, rancho: e.target.value })}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      placeholder="Ej: Rancho La Esperanza"
                      required
                    />
                  </div>
                  <Select
                    label="País"
                    name="rancho_pais"
                    value={ranchoData.rancho_pais}
                    onChange={(e) => setRanchoData({ ...ranchoData, rancho_pais: e.target.value })}
                    options={PAISES_MONEDAS.map((p) => ({ value: p.codigo, label: `${p.nombre} (${p.moneda})` }))}
                    placeholder="Seleccione país"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-bold text-black mb-2">Ciudad/Región</label>
                      <input
                        type="text"
                        value={ranchoData.rancho_ciudad}
                        onChange={(e) => setRanchoData({ ...ranchoData, rancho_ciudad: e.target.value })}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                        placeholder="Ej: Villavicencio"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-black mb-2">Hectáreas</label>
                      <input
                        type="number"
                        value={ranchoData.rancho_hectareas}
                        onChange={(e) => setRanchoData({ ...ranchoData, rancho_hectareas: e.target.value })}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                        placeholder="Ej: 150"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Precio</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      placeholder="Ej: 1000000"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleMarkForSale}
                    className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
                  >
                    Confirmar
                  </button>
                  <button
                  onClick={() => {
                    setShowMarkForSale(false)
                    setSelectedAnimalForSale(null)
                    setPrice('')
                    setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '' })
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
    </div>
  )
}

export default function AnimalesPage() {
  return (
    <ProtectedRoute>
      <AnimalesContent />
    </ProtectedRoute>
  )
}

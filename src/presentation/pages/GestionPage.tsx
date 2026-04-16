'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import Sidebar from '../components/layouts/Sidebar'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { getDriveImageUrl } from '@/utils/driveImage'
import { AnimalValidator, ESTADOS_HEMBRA, ESTADOS_MACHO } from '@/domain/validators/AnimalValidator'
import BackButton from '../components/ui/BackButton'
import PesosChart from '../components/gestion/PesosChart'

const animalRepository = new FirebaseAnimalRepository()

function GestionContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [pesos, setPesos] = useState<any[]>([])
  const [vacunaciones, setVacunaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [totalAnimalesRegistrados, setTotalAnimalesRegistrados] = useState(0)
  const [busquedaArete, setBusquedaArete] = useState('')
  const [showFormAnimal, setShowFormAnimal] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null)
  const [razonEliminacion, setRazonEliminacion] = useState('')
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [animalEstadoCambiar, setAnimalEstadoCambiar] = useState<Animal | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [razonEstado, setRazonEstado] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLimitError, setIsLimitError] = useState(false)

  const ESTATUS_OPCIONES = ['Activo', 'Muerto', 'Robado'] as const
  const [formData, setFormData] = useState({
    nombre: '',
    numero_identificacion: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: 'M' as 'M' | 'H',
    estado: '',
    estatus: 'Activo' as 'Activo' | 'Muerto' | 'Robado',
    origen: 'comprado' as 'cria' | 'comprado',
    madre_id: '',
    observaciones: [''] as string[],
    documento_guia_transito: '',
    documento_factura_venta: '',
    documento_certificado_movilizacion: '',
    documento_certificado_zoosanitario: '',
    documento_patente_fierro: '',
    foto: '',
  })
  const [vacunaAlRegistrar, setVacunaAlRegistrar] = useState({ agregar: false, tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '' })

  const [pesoForm, setPesoForm] = useState({ peso: '', fecha_registro: new Date().toISOString().split('T')[0], observaciones: '' })
  const [vacunaForm, setVacunaForm] = useState({ tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '', observaciones: '' })

  useEffect(() => {
    loadData()
  }, [user?.id])

  useEffect(() => {
    if (selectedAnimal?.id && user?.id) {
      loadPesosYVacunaciones(selectedAnimal.id)
    } else {
      setPesos([])
      setVacunaciones([])
    }
  }, [selectedAnimal?.id, user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const data = await animalRepository.getAll(user.id)
      setTotalAnimalesRegistrados(data.length)
      const filtrados = data.filter((a) => a.activo !== false)
      setAnimales(filtrados)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPesosYVacunaciones = async (animalId: string) => {
    try {
      const [p, v] = await Promise.all([
        firestoreService.getPesosByAnimal(animalId),
        firestoreService.getVacunacionesByAnimal(animalId),
      ])
      setPesos(p)
      setVacunaciones(v)
    } catch (e) {
      console.error(e)
    }
  }

  const animalesFiltrados = useMemo(() => {
    if (!busquedaArete.trim()) return animales
    const term = busquedaArete.toLowerCase().trim()
    return animales.filter((a) => (a.numero_identificacion || '').toLowerCase().includes(term))
  }, [animales, busquedaArete])

  const verificarDocumentosCompletos = (animal: Animal): boolean => AnimalValidator.validarDocumentosCompletos(animal)

  const handleSubmitAnimal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      const numeroNorm = formData.numero_identificacion?.trim().toUpperCase() || ''
      const estadoParaValidar = formData.estatus === 'Activo' ? formData.estado : formData.estatus
      const animalTemporal: Animal = {
        usuario_id: user.id,
        nombre: formData.nombre || undefined,
        numero_identificacion: numeroNorm || undefined,
        especie: formData.especie || undefined,
        raza: formData.raza || undefined,
        fecha_nacimiento: formData.fecha_nacimiento || undefined,
        sexo: formData.sexo,
        estado: estadoParaValidar || undefined,
      }
      const validacion = AnimalValidator.validarAnimalCompleto(animalTemporal, !!editingAnimal?.id)
      if (!validacion.valido) {
        setErrorMessage(validacion.errores.join('. '))
        setShowErrorModal(true)
        return
      }

      const animalData: Partial<Animal> = {
        ...formData,
        observaciones: formData.observaciones.filter((o) => o.trim() !== '').join(' · '),
        numero_identificacion: numeroNorm,
        usuario_id: user.id,
        rancho_id: user.rancho_actual_id || 'default',
        activo: formData.estatus === 'Activo',
      }

      let animalId = editingAnimal?.id
      if (editingAnimal?.id) {
        await animalRepository.update(editingAnimal.id, animalData)
        setSuccessMessage('Animal actualizado con éxito')
      } else {
        const nuevo = await animalRepository.create(animalData as Animal)
        animalId = nuevo?.id
        setSuccessMessage('Animal registrado con éxito')

        if (nuevo?.id && vacunaAlRegistrar.agregar) {
          await firestoreService.addVacunacion({
            animal_id: nuevo.id,
            usuario_id: user.id,
            tipo_vacuna: vacunaAlRegistrar.tipo_vacuna,
            fecha_aplicacion: vacunaAlRegistrar.fecha_aplicacion,
            proxima_dosis: vacunaAlRegistrar.proxima_dosis || undefined,
            observaciones: 'Registrada automáticamente al dar de alta al animal',
          })
        }
      }

      setShowFormAnimal(false)
      setShowSuccessModal(true)
      loadData()
      if (animalId) {
        const updated = await animalRepository.getById(animalId)
        if (updated) setSelectedAnimal(updated)
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al guardar el animal')
      setShowErrorModal(true)
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
      sexo: animal.sexo as 'M' | 'H',
      estado: animal.estado || '',
      estatus: animal.activo === false ? (animal.estado as any) || 'Muerto' : 'Activo',
      origen: animal.origen as any || 'comprado',
      madre_id: animal.madre_id || '',
      observaciones: animal.observaciones ? animal.observaciones.split(' · ') : [''],
      documento_guia_transito: animal.documento_guia_transito || '',
      documento_factura_venta: animal.documento_factura_venta || '',
      documento_certificado_movilizacion: animal.documento_certificado_movilizacion || '',
      documento_certificado_zoosanitario: animal.documento_certificado_zoosanitario || '',
      documento_patente_fierro: animal.documento_patente_fierro || '',
      foto: animal.foto || '',
    })
    setShowFormAnimal(true)
  }

  const confirmDelete = async () => {
    if (!animalToDelete) return
    try {
      await animalRepository.update(animalToDelete.id, {
        activo: false,
        razon_inactivo: razonEliminacion,
        fecha_inactivo: new Date().toISOString(),
      })
      setShowDeleteModal(false)
      setAnimalToDelete(null)
      setRazonEliminacion('')
      setSuccessMessage('Animal marcado como inactivo')
      setShowSuccessModal(true)
      loadData()
      setSelectedAnimal(null)
    } catch (error) {
      setErrorMessage('No se pudo desactivar el animal')
      setShowErrorModal(true)
    }
  }

  const handleAddPeso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal || !user?.id) return
    try {
      await firestoreService.addPeso({
        animal_id: selectedAnimal.id,
        usuario_id: user.id,
        peso: Number(pesoForm.peso),
        fecha_registro: pesoForm.fecha_registro,
        observaciones: pesoForm.observaciones,
      })
      setPesoForm({ peso: '', fecha_registro: new Date().toISOString().split('T')[0], observaciones: '' })
      loadPesosYVacunaciones(selectedAnimal.id)
    } catch (e) {
      setErrorMessage('Error al guardar peso')
      setShowErrorModal(true)
    }
  }

  const handleAddVacuna = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal || !user?.id) return
    try {
      await firestoreService.addVacunacion({
        animal_id: selectedAnimal.id,
        usuario_id: user.id,
        tipo_vacuna: vacunaForm.tipo_vacuna,
        fecha_aplicacion: vacunaForm.fecha_aplicacion,
        proxima_dosis: vacunaForm.proxima_dosis || undefined,
        observaciones: vacunaForm.observaciones,
      })
      setVacunaForm({ tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '', observaciones: '' })
      loadPesosYVacunaciones(selectedAnimal.id)
    } catch (e) {
      setErrorMessage('Error al guardar vacuna')
      setShowErrorModal(true)
    }
  }

  const ultimoPeso = pesos.length > 0 ? pesos[0] : null
  const chartData = useMemo(() => pesos.map((p) => ({ peso: p.peso, fecha_registro: p.fecha_registro })), [pesos])

  if (loading) return <div className="p-8 text-center text-white">Cargando...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard" inline />
            </div>

            <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-cownect-green/20">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
                  <p className="text-gray-600 mt-1">Control total de sus animales, pesos y salud</p>
                </div>
                <button
                  onClick={() => {
                    setShowFormAnimal(true)
                    setEditingAnimal(null)
                    setFormData({ nombre: '', numero_identificacion: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'M', estado: '', estatus: 'Activo', origen: 'comprado', madre_id: '', observaciones: [''], documento_guia_transito: '', documento_factura_venta: '', documento_certificado_movilizacion: '', documento_certificado_zoosanitario: '', documento_patente_fierro: '', foto: '' })
                    setVacunaAlRegistrar({ agregar: false, tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '' })
                  }}
                  className="bg-cownect-green text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                  + Agregar Animal
                </button>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar por arete..."
                  value={busquedaArete}
                  onChange={(e) => setBusquedaArete(e.target.value)}
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lista de animales */}
                <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {animalesFiltrados.map((animal) => (
                    <div
                      key={animal.id}
                      onClick={() => setSelectedAnimal(animal)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedAnimal?.id === animal.id ? 'border-cownect-green bg-cownect-green/5' : 'border-gray-50 bg-white hover:border-cownect-green/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${animal.sexo === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                          {animal.sexo}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{animal.numero_identificacion || 'S/N'}</p>
                          <p className="text-xs text-gray-400 uppercase font-bold">{animal.nombre || animal.raza}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detalle del animal */}
                <div className="lg:col-span-7">
                  {selectedAnimal ? (
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 animate-fadeIn">
                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                        <div className="flex gap-4">
                          {selectedAnimal.foto && (
                            <img src={getDriveImageUrl(selectedAnimal.foto)} className="w-20 h-20 rounded-2xl object-cover" alt="Animal" />
                          )}
                          <div>
                            <h2 className="text-2xl font-bold">{selectedAnimal.numero_identificacion}</h2>
                            <p className="text-gray-500 font-bold uppercase text-xs">{selectedAnimal.nombre || 'Sin nombre'}</p>
                          </div>
                        </div>
                        <button onClick={() => handleEdit(selectedAnimal)} className="text-cownect-green font-bold text-sm hover:underline">Editar Datos</button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                          <p className="text-[10px] font-bold text-gray-300 uppercase">Raza</p>
                          <p className="font-bold text-gray-900">{selectedAnimal.raza || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                          <p className="text-[10px] font-bold text-gray-300 uppercase">Estado</p>
                          <p className="font-bold text-gray-900">{selectedAnimal.estado || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                          <p className="text-[10px] font-bold text-gray-300 uppercase">Peso</p>
                          <p className="font-bold text-gray-900">{ultimoPeso ? `${ultimoPeso.peso}kg` : '—'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                          <p className="text-[10px] font-bold text-gray-300 uppercase">Origen</p>
                          <p className="font-bold text-gray-900">{selectedAnimal.origen || 'N/A'}</p>
                        </div>
                      </div>

                      <PesosChart pesos={chartData} />

                      <div className="flex gap-3 mt-6">
                        <button onClick={() => router.push(`/dashboard/documentacion?id=${selectedAnimal.id}`)} className="flex-1 bg-cownect-green text-white py-3 rounded-xl font-bold text-sm">Documentación</button>
                        <button onClick={() => { setAnimalToDelete(selectedAnimal); setShowDeleteModal(true) }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm">Marcar Inactivo</button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase text-xs">Selecciona un animal para ver detalles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tarjeta Nuevo/Editar Animal (ORIGINAL) */}
      {showFormAnimal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" onClick={() => setShowFormAnimal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-cownect-green/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-black">{editingAnimal ? 'Editar Animal' : 'Nuevo Animal'}</h3>
              <button onClick={() => setShowFormAnimal(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmitAnimal} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Nombre</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Arete / Número de Identificación (SINIIGA)</label>
                  <input type="text" value={formData.numero_identificacion} onChange={(e) => setFormData({ ...formData, numero_identificacion: AnimalValidator.formatNumeroIdentificacionSINIIGA(e.target.value) })} placeholder="MEX-123456-12345" className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green font-mono" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Especie</label>
                  <input type="text" value={formData.especie} onChange={(e) => setFormData({ ...formData, especie: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Raza</label>
                  <select value={formData.raza} onChange={(e) => setFormData({ ...formData, raza: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    <option value="">Seleccione raza</option>
                    <option value="Holstein">Holstein</option>
                    <option value="Angus">Angus</option>
                    <option value="Hereford">Hereford</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Nacimiento</label>
                  <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Sexo</label>
                  <select value={formData.sexo} onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    <option value="">Seleccione</option>
                    {formData.sexo === 'H' ? ESTADOS_HEMBRA.map(e => <option key={e} value={e}>{e}</option>) : ESTADOS_MACHO.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Origen</label>
                  <select value={formData.origen} onChange={(e) => setFormData({ ...formData, origen: e.target.value as any })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    <option value="comprado">Comprado</option>
                    <option value="cria">Cría</option>
                  </select>
                </div>
              </div>

              {/* Observaciones dinámicas */}
              <div className="mt-4">
                <label className="block text-base font-bold text-black mb-2">Observaciones</label>
                {formData.observaciones.map((obs, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" value={obs} onChange={(e) => { const next = [...formData.observaciones]; next[idx] = e.target.value; setFormData({...formData, observaciones: next}) }} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg" />
                    <button type="button" onClick={() => setFormData({...formData, observaciones: formData.observaciones.filter((_, i) => i !== idx)})} className="text-red-500 font-bold">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({...formData, observaciones: [...formData.observaciones, '']})} className="text-cownect-green font-bold text-sm">+ Agregar Observación</button>
              </div>

              {!editingAnimal && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <label className="flex items-center gap-2 font-bold mb-4">
                    <input type="checkbox" checked={vacunaAlRegistrar.agregar} onChange={e => setVacunaAlRegistrar({...vacunaAlRegistrar, agregar: e.target.checked})} />
                    ¿Registrar vacuna inicial?
                  </label>
                  {vacunaAlRegistrar.agregar && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                      <input type="text" value={vacunaAlRegistrar.tipo_vacuna} onChange={e => setVacunaAlRegistrar({...vacunaAlRegistrar, tipo_vacuna: e.target.value})} placeholder="Tipo vacuna" className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
                      <input type="date" value={vacunaAlRegistrar.fecha_aplicacion} onChange={e => setVacunaAlRegistrar({...vacunaAlRegistrar, fecha_aplicacion: e.target.value})} className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8">
                <button type="submit" className="w-full bg-cownect-green text-white py-4 rounded-xl font-bold text-xl hover:bg-opacity-90 transition-all shadow-lg">
                  {editingAnimal ? 'Actualizar Animal' : 'Guardar Animal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alertas */}
      {showSuccessModal && (
        <div className="fixed bottom-8 right-8 bg-cownect-green text-white px-8 py-4 rounded-xl shadow-2xl z-[10000] animate-slideIn">
          <p className="font-bold">{successMessage}</p>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button onClick={() => setShowErrorModal(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GestionPage() {
  return (
    <ProtectedRoute>
      <GestionContent />
    </ProtectedRoute>
  )
}

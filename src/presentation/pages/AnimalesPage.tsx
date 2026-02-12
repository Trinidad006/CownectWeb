'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { PAISES_MONEDAS, getMonedaByPais, formatPrecio } from '@/utils/paisesMonedas'
import { getDriveImageUrl } from '@/utils/driveImage'
import { AnimalValidator } from '@/domain/validators/AnimalValidator'
import Select from '../components/ui/Select'
import ImageUpload from '../components/ui/ImageUpload'
import BackButton from '../components/ui/BackButton'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null)
  const [fotoAnimal, setFotoAnimal] = useState<string>('')
  const [showCriaModal, setShowCriaModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLimitError, setIsLimitError] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAnimal, setFiltroAnimal] = useState('')
  const [criaFormData, setCriaFormData] = useState({
    nombre: '',
    numero_identificacion: '',
    especie: '',
    raza: '',
    fecha_nacimiento: new Date().toISOString().split('T')[0],
    sexo: 'M' as 'M' | 'H',
    madre_id: '',
  })
  const [formData, setFormData] = useState({
    nombre: '',
    numero_identificacion: '',
    especie: '',
    raza: '',
    fecha_nacimiento: '',
    sexo: 'M' as 'M' | 'H',
    estado: '',
    documento_guia_transito: '',
    documento_factura_venta: '',
    documento_certificado_movilizacion: '',
    documento_certificado_zoosanitario: '',
    documento_patente_fierro: '',
    foto: '',
  })

  useEffect(() => {
    loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    if (!user?.id) return
    try {
      const data = await animalRepository.getAll(user.id)
      // Filtrar animales vendidos
      const animalesFiltrados = data.filter(animal => animal.estado_venta !== 'vendido')
      setAnimales(animalesFiltrados)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar animales según búsqueda y filtro
  const animalesFiltrados = useMemo(() => {
    let filtrados = animales

    // Filtro por animal específico (si se necesita)
    if (filtroAnimal) {
      filtrados = filtrados.filter((animal) => animal.id === filtroAnimal)
    }

    // Búsqueda por texto
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim()
      filtrados = filtrados.filter((animal) => {
        const nombre = (animal.nombre || '').toLowerCase()
        const numeroIdentificacion = (animal.numero_identificacion || '').toLowerCase()
        const especie = (animal.especie || '').toLowerCase()
        const raza = (animal.raza || '').toLowerCase()
        const estado = (animal.estado || '').toLowerCase()
        const sexo = animal.sexo === 'M' ? 'macho' : 'hembra'

        return (
          nombre.includes(busquedaLower) ||
          numeroIdentificacion.includes(busquedaLower) ||
          especie.includes(busquedaLower) ||
          raza.includes(busquedaLower) ||
          estado.includes(busquedaLower) ||
          sexo.includes(busquedaLower)
        )
      })
    }

    return filtrados
  }, [animales, busqueda, filtroAnimal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    
    try {
      // Verificar límite de animales solo al crear (no al editar)
      if (!editingAnimal?.id) {
        const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
        const animalesCount = animales.filter(animal => animal.estado_venta !== 'vendido').length
        
        if (animalesCount >= 250 && !isPremium) {
          setIsLimitError(true)
          setErrorMessage('Has alcanzado el límite de 250 animales registrados. Para registrar más animales, únete al plan Premium.')
          setShowErrorModal(true)
          return
        }
      }

      // Normalizar número de identificación (mayúsculas y trim)
      const numeroIdentificacionNormalizado = formData.numero_identificacion 
        ? formData.numero_identificacion.trim().toUpperCase() 
        : ''

      // Crear objeto animal temporal para validación
      const animalTemporal: Animal = {
        ...formData,
        numero_identificacion: numeroIdentificacionNormalizado || undefined,
        usuario_id: user.id,
      } as Animal

      // Validar animal completo usando el validador centralizado
      const validacionCompleta = AnimalValidator.validarAnimalCompleto(animalTemporal, !!editingAnimal?.id)
      
      if (!validacionCompleta.valido) {
        setErrorMessage(validacionCompleta.errores.join('. '))
        setShowErrorModal(true)
        return
      }

      // Verificar duplicados de número de identificación
      if (numeroIdentificacionNormalizado) {
        const animalExistente = await animalRepository.findByNumeroIdentificacion(
          numeroIdentificacionNormalizado,
          user.id,
          editingAnimal?.id
        )
        
        if (animalExistente) {
          setErrorMessage('Ya existe un animal con este número de identificación')
          setShowErrorModal(true)
          return
        }
      }
      // Calcular si los documentos están completos
      const documentosCompletos = verificarDocumentosCompletos(formData as Animal)
      
      const animalData = {
        ...formData,
        numero_identificacion: numeroIdentificacionNormalizado || undefined,
        documentos_completos: documentosCompletos,
      }
      
      if (editingAnimal?.id) {
        await animalRepository.update(editingAnimal.id, animalData)
      } else {
        await animalRepository.create({
          ...animalData,
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
        documento_guia_transito: '',
        documento_factura_venta: '',
        documento_certificado_movilizacion: '',
        documento_certificado_zoosanitario: '',
        documento_patente_fierro: '',
        foto: '',
      })
      loadAnimales()
      setSuccessMessage(editingAnimal ? 'Animal actualizado exitosamente' : 'Animal registrado exitosamente')
      setShowSuccessModal(true)
      setIsLimitError(false)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setIsLimitError(false)
      setShowErrorModal(true)
    }
  }

  const handleRegistrarCria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    
    try {
      // Verificar límite de animales
      const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
      const animalesCount = animales.filter(animal => animal.estado_venta !== 'vendido').length
      
      if (animalesCount >= 250 && !isPremium) {
        setIsLimitError(true)
        setErrorMessage('Has alcanzado el límite de 250 animales registrados. Para registrar más animales, únete al plan Premium.')
        setShowErrorModal(true)
        return
      }

      // Normalizar número de identificación (mayúsculas y trim)
      const numeroIdentificacionNormalizado = criaFormData.numero_identificacion 
        ? criaFormData.numero_identificacion.trim().toUpperCase() 
        : ''

      // Crear objeto animal temporal para validación
      const criaTemporal: Animal = {
        ...criaFormData,
        numero_identificacion: numeroIdentificacionNormalizado || undefined,
        estado: 'Cría',
        usuario_id: user.id,
        madre_id: criaFormData.madre_id,
      } as Animal

      // Validar cría completa usando el validador centralizado
      const validacionCompleta = AnimalValidator.validarAnimalCompleto(criaTemporal, false)
      
      if (!validacionCompleta.valido) {
        setErrorMessage(validacionCompleta.errores.join('. '))
        setShowErrorModal(true)
        return
      }

      // Verificar duplicados de número de identificación
      if (numeroIdentificacionNormalizado) {
        const animalExistente = await animalRepository.findByNumeroIdentificacion(
          numeroIdentificacionNormalizado,
          user.id
        )
        
        if (animalExistente) {
          setErrorMessage('Ya existe un animal con este número de identificación')
          setShowErrorModal(true)
          return
        }
      }

      // Buscar la madre
      const madre = animales.find(a => a.id === criaFormData.madre_id)
      
      // Validar madre
      const validacionMadre = AnimalValidator.validarMadre(madre, true)
      if (!validacionMadre.valido) {
        setErrorMessage(validacionMadre.error || 'Error al validar la madre')
        setIsLimitError(false)
        setShowErrorModal(true)
        return
      }
      
      // Crear la cría
      await animalRepository.create({
        ...criaFormData,
        numero_identificacion: numeroIdentificacionNormalizado || undefined,
        estado: 'Cría',
        usuario_id: user.id,
        madre_id: criaFormData.madre_id,
      })
      
      setShowCriaModal(false)
      setCriaFormData({
        nombre: '',
        numero_identificacion: '',
        especie: '',
        raza: '',
        fecha_nacimiento: new Date().toISOString().split('T')[0],
        sexo: 'M' as 'M' | 'H',
        madre_id: '',
      })
      loadAnimales()
      setSuccessMessage('Cría registrada exitosamente')
      setShowSuccessModal(true)
      setIsLimitError(false)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setIsLimitError(false)
      setShowErrorModal(true)
    }
  }

  const handleCambiarEstadoVaca = async (animal: Animal, nuevoEstado: 'Vaca Ordeña' | 'Vaca Seca') => {
    if (!animal.id || !user?.id) return
    
    try {
      await animalRepository.update(animal.id, {
        estado: nuevoEstado,
      })
      loadAnimales()
      setSuccessMessage(`Estado actualizado a ${nuevoEstado}`)
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const handleCambiarEstado = async (animal: Animal, nuevoEstado: string) => {
    if (!animal.id || !user?.id) return
    
    try {
      await animalRepository.update(animal.id, {
        estado: nuevoEstado,
      })
      loadAnimales()
      setSuccessMessage(`Estado actualizado a ${nuevoEstado}`)
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
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
      sexo: animal.sexo || 'M',
      estado: animal.estado || '',
      documento_guia_transito: animal.documento_guia_transito || '',
      documento_factura_venta: animal.documento_factura_venta || '',
      documento_certificado_movilizacion: animal.documento_certificado_movilizacion || '',
      documento_certificado_zoosanitario: animal.documento_certificado_zoosanitario || '',
      documento_patente_fierro: animal.documento_patente_fierro || '',
      foto: animal.foto || '',
    })
    setShowForm(true)
  }

  // Usar el validador del dominio
  const verificarDocumentosCompletos = (animal: Animal): boolean => {
    return AnimalValidator.validarDocumentosCompletos(animal)
  }

  const handleDelete = (animal: Animal) => {
    setAnimalToDelete(animal)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!animalToDelete?.id || !user?.id) return
    try {
      await animalRepository.delete(animalToDelete.id, user.id)
      setShowDeleteModal(false)
      setAnimalToDelete(null)
      loadAnimales()
      setSuccessMessage('Animal eliminado exitosamente')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const handleMarkForSale = async () => {
    if (!selectedAnimalForSale?.id || !price || !user?.id) {
      setErrorMessage('Por favor ingrese un precio')
      setShowErrorModal(true)
      return
    }
    if (!ranchoData.rancho.trim()) {
      setErrorMessage('Por favor ingrese el nombre del rancho de origen')
      setShowErrorModal(true)
      return
    }
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { getFirebaseDb } = await import('@/infrastructure/config/firebase')
      const db = getFirebaseDb()
      
      // Actualizar animal con precio, estado y foto
      // Si se subió nueva foto, usarla; si no, mantener la que ya tiene el animal
      const updateData: any = {
        en_venta: true,
        precio_venta: parseFloat(price),
        estado_venta: 'en_venta',
        vistas: 0,
        updated_at: new Date().toISOString(),
      }
      // Usar foto nueva si se subió, o mantener la existente del animal
      updateData.foto = fotoAnimal || selectedAnimalForSale.foto || ''
      
      await updateDoc(doc(db, 'animales', selectedAnimalForSale.id as string), updateData)
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
      setFotoAnimal('')
      setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '' })
      loadAnimales()
      setSuccessMessage('Animal puesto en venta exitosamente')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
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
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-contentFadeIn">
        <div className="bg-white rounded-lg shadow-2xl p-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/dashboard" inline />
          </div>
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Gestión de Animales</h2>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Buscador */}
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Buscar Animales</label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, ID, especie, raza, estado o sexo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green focus:ring-2 focus:ring-cownect-green focus:ring-opacity-20 transition-all bg-white text-black"
                  />
                </div>
                
                {/* Filtro por animal */}
                <div className="lg:w-72">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Filtrar por Animal</label>
                  <select
                    value={filtroAnimal}
                    onChange={(e) => setFiltroAnimal(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green focus:ring-2 focus:ring-cownect-green focus:ring-opacity-20 transition-all bg-white text-black cursor-pointer"
                  >
                    <option value="">Todos los animales</option>
                    {animales.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.nombre || animal.numero_identificacion || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Mostrar resultados del filtro */}
              {(filtroAnimal || busqueda) && (
                <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                  <p className="text-base text-gray-600">
                    Mostrando <strong className="text-black">{animalesFiltrados.length}</strong> de <strong className="text-black">{animales.length}</strong> animales
                  </p>
                  <button
                    onClick={() => {
                      setFiltroAnimal('')
                      setBusqueda('')
                    }}
                    className="text-cownect-green hover:text-cownect-dark-green font-semibold underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 flex gap-3 flex-wrap">
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
                  documento_guia_transito: '',
                  documento_factura_venta: '',
                  documento_certificado_movilizacion: '',
                  documento_certificado_zoosanitario: '',
                  documento_patente_fierro: '',
                  foto: '',
                })
              }}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              {showForm ? 'Cancelar' : '+ Registrar Animal'}
            </button>
            <button
              onClick={() => {
                setShowCriaModal(true)
                setCriaFormData({
                  nombre: '',
                  numero_identificacion: '',
                  especie: '',
                  raza: '',
                  fecha_nacimiento: new Date().toISOString().split('T')[0],
                  sexo: 'M' as 'M' | 'H',
                  madre_id: '',
                })
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all"
            >
              + Registrar Cría
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
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                  <p className="mt-1 text-sm text-gray-600">No se pueden registrar fechas futuras</p>
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
                  <label className="block text-base font-bold text-black mb-2">Estado / Etapa Productiva</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="">Seleccione un estado</option>
                    <optgroup label="Etapas Productivas - Hembras">
                      <option value="Cría">Cría (Hembra)</option>
                      <option value="Becerra">Becerra</option>
                      <option value="Destetado">Destetado</option>
                      <option value="Vaca Ordeña">Vaca Ordeña</option>
                      <option value="Vaca Seca">Vaca Seca</option>
                    </optgroup>
                    <optgroup label="Etapas Productivas - Machos">
                      <option value="Becerro">Becerro</option>
                      <option value="Novillo">Novillo</option>
                      <option value="Toro de Engorda">Toro de Engorda</option>
                      <option value="Toro Reproductor">Toro Reproductor</option>
                    </optgroup>
                    <optgroup label="Estatus del Sistema">
                      <option value="Activo">Activo</option>
                      <option value="Muerto">Muerto</option>
                      <option value="Robado">Robado</option>
                    </optgroup>
                  </select>
                  <p className="mt-1 text-sm text-gray-600">Seleccione la etapa productiva o estatus del animal</p>
                </div>
              </div>

              {/* Sección de Documentos para Venta */}
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <h4 className="text-xl font-bold text-black mb-4">Documentos Requeridos para Venta</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Todos los documentos son obligatorios para poder vender el animal. Suba imágenes de cada documento.
                </p>
                <div className="space-y-4">
                  <ImageUpload
                    label="1. Guía de Tránsito"
                    value={formData.documento_guia_transito}
                    onChange={(url) => setFormData({ ...formData, documento_guia_transito: url })}
                    required
                  />
                  <ImageUpload
                    label="2. Factura de Venta"
                    value={formData.documento_factura_venta}
                    onChange={(url) => setFormData({ ...formData, documento_factura_venta: url })}
                    required
                  />
                  <ImageUpload
                    label="3. Certificado de Movilización (SINIIGA)"
                    value={formData.documento_certificado_movilizacion}
                    onChange={(url) => setFormData({ ...formData, documento_certificado_movilizacion: url })}
                    required
                  />
                  <ImageUpload
                    label="4. Certificado Zoosanitario"
                    value={formData.documento_certificado_zoosanitario}
                    onChange={(url) => setFormData({ ...formData, documento_certificado_zoosanitario: url })}
                    required
                  />
                  <ImageUpload
                    label="5. Patente de Fierro"
                    value={formData.documento_patente_fierro}
                    onChange={(url) => setFormData({ ...formData, documento_patente_fierro: url })}
                    required
                  />
                  <ImageUpload
                    label="6. Foto del Animal"
                    value={formData.foto}
                    onChange={(url) => setFormData({ ...formData, foto: url })}
                    required
                  />
                </div>
                
                {/* Indicador de documentos completos */}
                {verificarDocumentosCompletos(formData as Animal) && (
                  <div className="mt-4 bg-green-50 border-2 border-green-400 rounded-lg p-4">
                    <p className="text-green-700 font-bold text-lg flex items-center gap-2">
                      <span>✓</span>
                      <span>Documentos Completos - Listo para Venta</span>
                    </p>
                  </div>
                )}
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
            {animalesFiltrados.map((animal) => (
              <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                {animal.foto ? (
                  <div className={`mb-4 rounded-lg overflow-hidden ${animal.en_venta ? 'border-2 border-cownect-green' : 'border border-gray-300'}`}>
                    <img 
                      src={getDriveImageUrl(animal.foto)} 
                      alt={animal.nombre || 'Animal'} 
                      className="w-full h-40 object-cover"
                      onLoad={() => {
                        if (process.env.NODE_ENV === 'development') {
                          console.log(`✓ Foto cargada para ${animal.nombre}:`, animal.foto)
                        }
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        const originalUrl = animal.foto
                        const convertedUrl = getDriveImageUrl(animal.foto)
                        
                        if (process.env.NODE_ENV === 'development') {
                          console.error(`✗ Error cargando foto de ${animal.nombre}:`, {
                            original: originalUrl,
                            converted: convertedUrl,
                            currentSrc: target.src
                          })
                        }
                        
                        // Si falla la URL convertida, intentar con la original directamente
                        if (target.src !== originalUrl && originalUrl) {
                          target.src = originalUrl
                        } else if (target.src === originalUrl && originalUrl) {
                          // Si también falla la original, intentar formato directo thumbnail
                          const fileIdMatch = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || originalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
                          if (fileIdMatch && fileIdMatch[1]) {
                            const directThumbnail = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`
                            if (process.env.NODE_ENV === 'development') {
                              console.log(`Intentando URL directa thumbnail: ${directThumbnail}`)
                            }
                            target.src = directThumbnail
                          }
                        }
                      }}
                    />
                  </div>
                ) : animal.en_venta ? (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-yellow-400 bg-yellow-50 p-3">
                    <p className="text-yellow-800 text-sm font-semibold text-center">
                      ⚠ Este animal no tiene foto. Edítalo para añadir una foto.
                    </p>
                  </div>
                ) : null}
                <h3 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h3>
                <p className="text-gray-700 mb-1"><strong>ID:</strong> {animal.numero_identificacion || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                
                {/* Etiqueta de Estado/Etapa Productiva */}
                {animal.estado && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Estado / Etapa Productiva</p>
                    <div className={`inline-block rounded-lg px-3 py-1.5 border-2 ${
                      animal.estado === 'Cría' || animal.estado === 'Becerro' || animal.estado === 'Becerra'
                        ? 'bg-blue-50 border-blue-400'
                        : animal.estado === 'Destetado' || animal.estado === 'Novillo'
                        ? 'bg-purple-50 border-purple-400'
                        : animal.estado === 'Toro de Engorda' || animal.estado === 'Toro Reproductor'
                        ? 'bg-orange-50 border-orange-400'
                        : animal.estado === 'Vaca Ordeña'
                        ? 'bg-green-50 border-green-400'
                        : animal.estado === 'Vaca Seca'
                        ? 'bg-yellow-50 border-yellow-400'
                        : animal.estado === 'Activo'
                        ? 'bg-gray-50 border-gray-400'
                        : animal.estado === 'Muerto'
                        ? 'bg-red-50 border-red-400'
                        : animal.estado === 'Robado'
                        ? 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-400'
                    }`}>
                      <p className={`font-bold text-sm ${
                        animal.estado === 'Cría' || animal.estado === 'Becerro' || animal.estado === 'Becerra'
                          ? 'text-blue-700'
                          : animal.estado === 'Destetado' || animal.estado === 'Novillo'
                          ? 'text-purple-700'
                          : animal.estado === 'Toro de Engorda' || animal.estado === 'Toro Reproductor'
                          ? 'text-orange-700'
                          : animal.estado === 'Vaca Ordeña'
                          ? 'text-green-700'
                          : animal.estado === 'Vaca Seca'
                          ? 'text-yellow-700'
                          : animal.estado === 'Activo'
                          ? 'text-gray-700'
                          : animal.estado === 'Muerto'
                          ? 'text-red-700'
                          : animal.estado === 'Robado'
                          ? 'text-red-800'
                          : 'text-gray-700'
                      }`}>
                        {animal.estado}
                      </p>
                    </div>
                  </div>
                )}
                
                {animal.madre_id && (
                  <p className="text-gray-600 mb-1 text-sm">
                    <strong>Madre:</strong> {animales.find(a => a.id === animal.madre_id)?.nombre || 'N/A'}
                  </p>
                )}
                {/* Botones rápidos para control de vacas */}
                {animal.sexo === 'H' && (animal.estado === 'Vaca Ordeña' || animal.estado === 'Vaca Seca') && (
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => handleCambiarEstadoVaca(animal, 'Vaca Ordeña')}
                      disabled={animal.estado === 'Vaca Ordeña'}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        animal.estado === 'Vaca Ordeña'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      Ordeña
                    </button>
                    <button
                      onClick={() => handleCambiarEstadoVaca(animal, 'Vaca Seca')}
                      disabled={animal.estado === 'Vaca Seca'}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        animal.estado === 'Vaca Seca'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      } disabled:opacity-50`}
                    >
                      Seca
                    </button>
                  </div>
                )}
                {animal.en_venta && (
                  <>
                    <p className="text-lg font-bold text-cownect-green mb-2">
                      En Venta: {formatPrecio(animal.precio_venta ?? 0, user?.rancho_pais)}
                    </p>
                    {/* Estado de venta */}
                    {animal.estado_venta === 'en_venta' && (
                      <div className="mb-2 bg-blue-50 border border-blue-400 rounded-lg px-3 py-2">
                        <p className="text-blue-700 font-semibold text-sm">
                          En Venta
                        </p>
                      </div>
                    )}
                    {animal.estado_venta === 'proceso_venta' && (
                      <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                        <p className="text-green-700 font-semibold text-sm">
                          Proceso de Venta
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Indicador de documentos */}
                {verificarDocumentosCompletos(animal) ? (
                  <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                    <p className="text-green-700 font-semibold text-sm">
                      Documentos Listos
                    </p>
                  </div>
                ) : (
                  <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                    <p className="text-green-700 font-semibold text-sm">
                      Documentación en Proceso
                    </p>
                  </div>
                )}

                {/* Botones para cambiar estado según etapa productiva */}
                <div className="mb-3 space-y-2">
                  {/* Para crías - botón para marcar como Destetado */}
                  {(animal.estado === 'Cría' || animal.estado === 'Becerro' || animal.estado === 'Becerra') && (
                    <button
                      onClick={() => handleCambiarEstado(animal, 'Destetado')}
                      className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 transition-all border-2 border-purple-400"
                    >
                      → Marcar como Destetado
                    </button>
                  )}
                  
                  {/* Para destetados machos - opciones de crecimiento */}
                  {animal.sexo === 'M' && animal.estado === 'Destetado' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Novillo')}
                        className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 transition-all border-2 border-purple-400"
                      >
                        → Novillo
                      </button>
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Toro de Engorda')}
                        className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg font-bold text-sm hover:bg-orange-200 transition-all border-2 border-orange-400"
                      >
                        → Toro Engorda
                      </button>
                    </div>
                  )}
                  
                  {/* Para destetados hembras - opciones de crecimiento */}
                  {animal.sexo === 'H' && animal.estado === 'Destetado' && (
                    <button
                      onClick={() => handleCambiarEstado(animal, 'Becerra')}
                      className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 transition-all border-2 border-blue-400"
                    >
                      → Marcar como Becerra
                    </button>
                  )}
                  
                  {/* Para novillos - opción de toro */}
                  {animal.sexo === 'M' && animal.estado === 'Novillo' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Toro de Engorda')}
                        className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg font-bold text-sm hover:bg-orange-200 transition-all border-2 border-orange-400"
                      >
                        → Toro Engorda
                      </button>
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Toro Reproductor')}
                        className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg font-bold text-sm hover:bg-orange-200 transition-all border-2 border-orange-400"
                      >
                        → Toro Reproductor
                      </button>
                    </div>
                  )}
                  
                  {/* Botones para marcar como Muerto o Robado */}
                  {animal.estado !== 'Muerto' && animal.estado !== 'Robado' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-300">
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Muerto')}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm hover:bg-red-200 transition-all border-2 border-red-400"
                      >
                        Marcar como Muerto
                      </button>
                      <button
                        onClick={() => handleCambiarEstado(animal, 'Robado')}
                        className="flex-1 bg-red-200 text-red-800 py-2 rounded-lg font-bold text-sm hover:bg-red-300 transition-all border-2 border-red-500"
                      >
                        Marcar como Robado
                      </button>
                    </div>
                  )}
                  
                  {/* Botón para reactivar si está muerto o robado */}
                  {(animal.estado === 'Muerto' || animal.estado === 'Robado') && (
                    <button
                      onClick={() => handleCambiarEstado(animal, 'Activo')}
                      className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm hover:bg-green-200 transition-all border-2 border-green-400"
                    >
                      → Reactivar (Marcar como Activo)
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {/* Botones de control de vacas - siempre visibles para hembras */}
                  {animal.sexo === 'H' && (
                    <div className="mb-2 flex gap-2">
                      <button
                        onClick={() => handleCambiarEstadoVaca(animal, 'Vaca Ordeña')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                          animal.estado === 'Vaca Ordeña'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {animal.estado === 'Vaca Ordeña' ? '✓ Ordeña' : '→ Ordeña'}
                      </button>
                      <button
                        onClick={() => handleCambiarEstadoVaca(animal, 'Vaca Seca')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                          animal.estado === 'Vaca Seca'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {animal.estado === 'Vaca Seca' ? '✓ Seca' : '→ Seca'}
                      </button>
                    </div>
                  )}
                  {!animal.en_venta && (
                    <button
                      onClick={() => {
                        setSelectedAnimalForSale(animal)
                        setFotoAnimal(animal.foto || '')
                        setRanchoData({
                          rancho: user?.rancho || '',
                          rancho_hectareas: user?.rancho_hectareas?.toString() || '',
                          rancho_pais: user?.rancho_pais || '',
                          rancho_ciudad: user?.rancho_ciudad || '',
                          rancho_direccion: user?.rancho_direccion || '',
                        })
                        setShowMarkForSale(true)
                      }}
                      className="w-full bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-cownect-dark-green transition-all"
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
                      onClick={() => handleDelete(animal)}
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

          {animales.length > 0 && animalesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No se encontraron animales con los filtros aplicados</p>
            </div>
          )}

          {showMarkForSale && selectedAnimalForSale && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
                <div className="flex items-center gap-3 mb-4">
                  <BackButton
                    onClick={() => {
                      setShowMarkForSale(false)
                      setSelectedAnimalForSale(null)
                      setPrice('')
                      setFotoAnimal('')
                      setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '' })
                    }}
                    inline
                  />
                  <h3 className="text-2xl font-bold text-black">Poner en Venta</h3>
                </div>
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
                    <label className="block text-base font-bold text-black mb-2">Precio *</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      placeholder="Ej: 1000000"
                      required
                    />
                  </div>
                  <div>
                    <ImageUpload
                      label="Foto del Animal"
                      value={fotoAnimal}
                      onChange={setFotoAnimal}
                      maxSizeMB={5}
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
                    setFotoAnimal('')
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

      {/* Modal para Registrar Cría */}
      {showCriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton
                onClick={() => {
                  setShowCriaModal(false)
                  setCriaFormData({
                    nombre: '',
                    numero_identificacion: '',
                    especie: '',
                    raza: '',
                    fecha_nacimiento: new Date().toISOString().split('T')[0],
                    sexo: 'M' as 'M' | 'H',
                    madre_id: '',
                  })
                }}
                inline
              />
              <h3 className="text-xl font-bold text-black">Registrar Cría</h3>
            </div>
            <form onSubmit={handleRegistrarCria} className="space-y-4">
              <div>
                <label className="block text-base font-bold text-black mb-2">Madre *</label>
                <select
                  value={criaFormData.madre_id}
                  onChange={(e) => setCriaFormData({ ...criaFormData, madre_id: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                  required
                >
                  <option value="">Seleccione la madre</option>
                  {animales
                    .filter(a => a.sexo === 'H' && a.estado_venta !== 'vendido' && a.estado?.toLowerCase() !== 'muerto' && a.estado?.toLowerCase() !== 'robado')
                    .map((madre) => (
                      <option key={madre.id} value={madre.id}>
                        {madre.nombre || madre.numero_identificacion || 'Sin nombre'} - {madre.estado || 'N/A'}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-600">Solo se muestran hembras disponibles</p>
              </div>
              <div>
                <label className="block text-base font-bold text-black mb-2">Nombre</label>
                <input
                  type="text"
                  value={criaFormData.nombre}
                  onChange={(e) => setCriaFormData({ ...criaFormData, nombre: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                />
              </div>
              <div>
                <label className="block text-base font-bold text-black mb-2">Número de Identificación</label>
                <input
                  type="text"
                  value={criaFormData.numero_identificacion}
                  onChange={(e) => setCriaFormData({ ...criaFormData, numero_identificacion: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Especie</label>
                  <input
                    type="text"
                    value={criaFormData.especie}
                    onChange={(e) => setCriaFormData({ ...criaFormData, especie: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Raza</label>
                  <input
                    type="text"
                    value={criaFormData.raza}
                    onChange={(e) => setCriaFormData({ ...criaFormData, raza: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={criaFormData.fecha_nacimiento}
                    onChange={(e) => setCriaFormData({ ...criaFormData, fecha_nacimiento: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Sexo</label>
                  <select
                    value={criaFormData.sexo}
                    onChange={(e) => setCriaFormData({ ...criaFormData, sexo: e.target.value as 'M' | 'H' })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-opacity-90 transition-all"
                >
                  Registrar Cría
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCriaModal(false)
                    setCriaFormData({
                      nombre: '',
                      numero_identificacion: '',
                      especie: '',
                      raza: '',
                      fecha_nacimiento: new Date().toISOString().split('T')[0],
                      sexo: 'M' as 'M' | 'H',
                      madre_id: '',
                    })
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && animalToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scaleIn relative">
            <div className="flex items-center gap-3 mb-4">
              <BackButton
                onClick={() => { setShowDeleteModal(false); setAnimalToDelete(null) }}
                inline
              />
              <h3 className="text-2xl font-bold text-black">Confirmar Eliminación</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Animal:</strong> {animalToDelete.nombre || animalToDelete.numero_identificacion || 'Animal'}
              </p>
              <p className="text-gray-800 font-semibold">
                ¿Está seguro de eliminar este animal? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-all"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setAnimalToDelete(null)
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }} inline />
              <h3 className="text-xl font-bold text-cownect-green">Éxito</h3>
            </div>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }}
                className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-opacity-90 transition-all"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }} inline />
              <h3 className="text-xl font-bold text-red-600">Error</h3>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              {isLimitError ? (
                <>
                  <button
                    onClick={() => { setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }}
                    className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => { router.push('/choose-plan'); setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }}
                    className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-cownect-dark-green transition-all"
                  >
                    Ver Planes Premium
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }}
                  className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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


'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { getDriveImageUrl } from '@/utils/driveImage'
import { AnimalValidator, ESTADOS_HEMBRA, ESTADOS_MACHO } from '@/domain/validators/AnimalValidator'
import BackButton from '../components/ui/BackButton'
import PesosChart from '../components/gestion/PesosChart'

const animalRepository = new FirebaseAnimalRepository()

function GestionContent() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const puedeEditar = !user?.es_sesion_trabajador
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
      // Para el límite del plan, contamos todos los animales del usuario (activos + inactivos)
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
    if (user.es_sesion_trabajador && editingAnimal?.id) {
      setErrorMessage('Los trabajadores no pueden modificar animales ya registrados.')
      setShowErrorModal(true)
      return
    }

    try {
      if (!editingAnimal?.id) {
        const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
        const count = totalAnimalesRegistrados
        if (count >= 250 && !isPremium) {
          setIsLimitError(true)
          setErrorMessage('Has alcanzado el límite de 250 animales. Únete al plan Premium.')
          setShowErrorModal(true)
          return
        }
      }

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

      // Validaciones de vacuna opcional al registrar
      if (!editingAnimal?.id && vacunaAlRegistrar.agregar) {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        if (vacunaAlRegistrar.fecha_aplicacion) {
          const fechaVacuna = new Date(vacunaAlRegistrar.fecha_aplicacion)
          fechaVacuna.setHours(0, 0, 0, 0)

          // No puede ser antes de la fecha de nacimiento
          if (formData.fecha_nacimiento) {
            const nacimiento = new Date(formData.fecha_nacimiento)
            nacimiento.setHours(0, 0, 0, 0)
            if (fechaVacuna < nacimiento) {
              setErrorMessage('La fecha de la vacuna no puede ser anterior a la fecha de nacimiento del animal.')
              setShowErrorModal(true)
              return
            }
          }

          // No puede ser en el futuro
          if (fechaVacuna > hoy) {
            setErrorMessage('La fecha en que se aplicó la vacuna no puede estar en el futuro.')
            setShowErrorModal(true)
            return
          }
        }

        if (vacunaAlRegistrar.proxima_dosis) {
          const proxima = new Date(vacunaAlRegistrar.proxima_dosis)
          proxima.setHours(0, 0, 0, 0)

          // Próxima dosis no puede ser en el pasado
          if (proxima < hoy) {
            setErrorMessage('La próxima dosis no puede estar en el pasado.')
            setShowErrorModal(true)
            return
          }

          if (vacunaAlRegistrar.fecha_aplicacion) {
            const fechaVacuna = new Date(vacunaAlRegistrar.fecha_aplicacion)
            fechaVacuna.setHours(0, 0, 0, 0)
            // Próxima dosis debe ser igual o posterior a la fecha de aplicación
            if (proxima < fechaVacuna) {
              setErrorMessage('La próxima dosis debe ser igual o posterior a la fecha en que se aplicó la vacuna.')
              setShowErrorModal(true)
              return
            }
          }
        }
      }

      if (numeroNorm) {
        const existente = await animalRepository.findByNumeroIdentificacion(numeroNorm, user.id, editingAnimal?.id)
        if (existente) {
          setErrorMessage('Ya existe un animal con este arete/número de identificación')
          setShowErrorModal(true)
          return
        }
      }

      const docs = verificarDocumentosCompletos({
        documento_guia_transito: formData.documento_guia_transito || undefined,
        documento_factura_venta: formData.documento_factura_venta || undefined,
        documento_certificado_movilizacion: formData.documento_certificado_movilizacion || undefined,
        documento_certificado_zoosanitario: formData.documento_certificado_zoosanitario || undefined,
        documento_patente_fierro: formData.documento_patente_fierro || undefined,
        foto: formData.foto || undefined,
      } as Animal)
      const estadoGuardar = formData.estatus === 'Activo' ? formData.estado : formData.estatus
      const observacionesTexto = formData.observaciones.filter((o) => o.trim()).join(' · ') || undefined
      const animalData: any = { ...formData, estado: estadoGuardar, numero_identificacion: numeroNorm || undefined, documentos_completos: docs }
      animalData.observaciones = observacionesTexto
      delete animalData.estatus
      if (formData.origen === 'cria' && formData.madre_id) {
        animalData.madre_id = formData.madre_id
        const madre = animales.find((a) => a.id === formData.madre_id)
        const validacionMadre = AnimalValidator.validarMadre(madre ?? null, true)
        if (!validacionMadre.valido) {
          setErrorMessage(validacionMadre.error || 'Error al validar la madre')
          setShowErrorModal(true)
          return
        }
      } else {
        // No debe enviarse madre_id a Firestore si no es cría
        delete animalData.madre_id
      }
      const validacionSexo = AnimalValidator.validarSexoConEstado(formData.sexo, formData.estado)
      if (!validacionSexo.valido) {
        setErrorMessage(validacionSexo.error || 'Estado no coincide con el sexo del animal')
        setShowErrorModal(true)
        return
      }
      delete animalData.origen

      let newAnimalId: string | undefined
      if (editingAnimal?.id) {
        await animalRepository.update(editingAnimal.id, animalData)
      } else {
        const created = await animalRepository.create({ ...animalData, usuario_id: user.id })
        newAnimalId = created.id
        if (newAnimalId && vacunaAlRegistrar.agregar && vacunaAlRegistrar.tipo_vacuna.trim()) {
          await firestoreService.addVacunacion({
            animal_id: newAnimalId,
            usuario_id: user.id,
            tipo_vacuna: vacunaAlRegistrar.tipo_vacuna.trim(),
            fecha_aplicacion: vacunaAlRegistrar.fecha_aplicacion,
            proxima_dosis: vacunaAlRegistrar.proxima_dosis || undefined,
          })
        }
      }
      setShowFormAnimal(false)
      setEditingAnimal(null)
      setFormData({ nombre: '', numero_identificacion: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'M', estado: '', estatus: 'Activo', origen: 'comprado', madre_id: '', observaciones: [''], documento_guia_transito: '', documento_factura_venta: '', documento_certificado_movilizacion: '', documento_certificado_zoosanitario: '', documento_patente_fierro: '', foto: '' })
      setVacunaAlRegistrar({ agregar: false, tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '' })
      loadData()
      if (selectedAnimal?.id === editingAnimal?.id) setSelectedAnimal(null)
      setSuccessMessage(editingAnimal ? 'Animal actualizado' : 'Animal registrado')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const handleAddPeso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal?.id || !user?.id) return
    try {
      await firestoreService.addPeso({
        animal_id: selectedAnimal.id,
        usuario_id: user.id,
        peso: parseFloat(pesoForm.peso),
        fecha_registro: pesoForm.fecha_registro,
        observaciones: pesoForm.observaciones || undefined,
      })
      setPesoForm({ peso: '', fecha_registro: new Date().toISOString().split('T')[0], observaciones: '' })
      loadPesosYVacunaciones(selectedAnimal.id)
      setSuccessMessage('Peso registrado')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const handleAddVacuna = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal?.id || !user?.id) return
    try {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      if (vacunaForm.fecha_aplicacion) {
        const fechaVacuna = new Date(vacunaForm.fecha_aplicacion)
        fechaVacuna.setHours(0, 0, 0, 0)

        // No puede ser anterior a la fecha de nacimiento
        if (selectedAnimal.fecha_nacimiento) {
          const nacimiento = new Date(selectedAnimal.fecha_nacimiento)
          nacimiento.setHours(0, 0, 0, 0)
          if (fechaVacuna < nacimiento) {
            setErrorMessage('La fecha de la vacuna no puede ser anterior a la fecha de nacimiento del animal.')
            setShowErrorModal(true)
            return
          }
        }

        // No puede ser en el futuro
        if (fechaVacuna > hoy) {
          setErrorMessage('La fecha en que se aplicó la vacuna no puede estar en el futuro.')
          setShowErrorModal(true)
          return
        }
      }

      if (vacunaForm.proxima_dosis) {
        const proxima = new Date(vacunaForm.proxima_dosis)
        proxima.setHours(0, 0, 0, 0)

        // Próxima dosis no puede estar en el pasado
        if (proxima < hoy) {
          setErrorMessage('La próxima dosis no puede estar en el pasado.')
          setShowErrorModal(true)
          return
        }

        if (vacunaForm.fecha_aplicacion) {
          const fechaVacuna = new Date(vacunaForm.fecha_aplicacion)
          fechaVacuna.setHours(0, 0, 0, 0)
          if (proxima < fechaVacuna) {
            setErrorMessage('La próxima dosis debe ser igual o posterior a la fecha en que se aplicó la vacuna.')
            setShowErrorModal(true)
            return
          }
        }
      }

      await firestoreService.addVacunacion({
        animal_id: selectedAnimal.id,
        usuario_id: user.id,
        tipo_vacuna: vacunaForm.tipo_vacuna,
        fecha_aplicacion: vacunaForm.fecha_aplicacion,
        proxima_dosis: vacunaForm.proxima_dosis || undefined,
        observaciones: vacunaForm.observaciones || undefined,
      })
      setVacunaForm({ tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '', observaciones: '' })
      loadPesosYVacunaciones(selectedAnimal.id)
      setSuccessMessage('Vacunación registrada')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const handleCambiarEstado = async (animal: Animal, nuevoEstado: string) => {
    if (!animal.id || !user?.id) return
    if (nuevoEstado === 'Muerto' || nuevoEstado === 'Robado') {
      setAnimalEstadoCambiar(animal)
      setNuevoEstado(nuevoEstado)
      setRazonEstado('')
      setShowEstadoModal(true)
      return
    }
    if (nuevoEstado === 'Activo') {
      try {
        await animalRepository.update(animal.id, { estado: nuevoEstado, activo: true, razon_inactivo: undefined, fecha_inactivo: undefined, updated_at: new Date().toISOString() })
        loadData()
        setSelectedAnimal(null)
        setSuccessMessage('Animal reactivado')
        setShowSuccessModal(true)
      } catch (e: any) {
        setErrorMessage(e.message)
        setShowErrorModal(true)
      }
      return
    }
    try {
      await animalRepository.update(animal.id, { estado: nuevoEstado, updated_at: new Date().toISOString() })
      loadData()
      if (selectedAnimal?.id === animal.id) setSelectedAnimal(null)
      setSuccessMessage(`Estado: ${nuevoEstado}`)
      setShowSuccessModal(true)
    } catch (e: any) {
      setErrorMessage(e.message)
      setShowErrorModal(true)
    }
  }

  const confirmarCambioEstado = async () => {
    if (!animalEstadoCambiar?.id || !user?.id) return
    try {
      await animalRepository.update(animalEstadoCambiar.id, { estado: nuevoEstado, activo: false, razon_inactivo: razonEstado.trim() || undefined, fecha_inactivo: new Date().toISOString(), updated_at: new Date().toISOString() })
      setShowEstadoModal(false)
      setAnimalEstadoCambiar(null)
      setNuevoEstado('')
      setRazonEstado('')
      loadData()
      setSelectedAnimal(null)
      setSuccessMessage(`Animal marcado como ${nuevoEstado}`)
      setShowSuccessModal(true)
    } catch (e: any) {
      setErrorMessage(e.message)
      setShowErrorModal(true)
    }
  }

  const confirmDelete = async () => {
    if (!animalToDelete?.id || !user?.id) return
    try {
      await animalRepository.update(animalToDelete.id, { activo: false, razon_inactivo: razonEliminacion.trim() || undefined, fecha_inactivo: new Date().toISOString(), updated_at: new Date().toISOString() })
      setShowDeleteModal(false)
      setAnimalToDelete(null)
      setRazonEliminacion('')
      loadData()
      setSelectedAnimal(null)
      setSuccessMessage('Animal marcado como inactivo')
      setShowSuccessModal(true)
    } catch (e: any) {
      setErrorMessage(e.message)
      setShowErrorModal(true)
    }
  }

  const handleEdit = (animal: Animal) => {
    if (!puedeEditar) return
    setEditingAnimal(animal)
    const esEstatus = animal.estado === 'Activo' || animal.estado === 'Muerto' || animal.estado === 'Robado'
    const obsArray = animal.observaciones ? animal.observaciones.split(' · ').filter(Boolean) : ['']
    setFormData({
      nombre: animal.nombre || '',
      numero_identificacion: AnimalValidator.formatNumeroIdentificacionSINIIGA(animal.numero_identificacion || ''),
      especie: animal.especie || '',
      raza: animal.raza || '',
      fecha_nacimiento: animal.fecha_nacimiento || '',
      sexo: animal.sexo || 'M',
      estado: esEstatus ? '' : (animal.estado || ''),
      estatus: esEstatus ? (animal.estado as 'Activo' | 'Muerto' | 'Robado') : 'Activo',
      origen: animal.madre_id ? 'cria' : 'comprado',
      madre_id: animal.madre_id || '',
      observaciones: obsArray.length > 0 ? obsArray : [''],
      documento_guia_transito: animal.documento_guia_transito || '',
      documento_factura_venta: animal.documento_factura_venta || '',
      documento_certificado_movilizacion: animal.documento_certificado_movilizacion || '',
      documento_certificado_zoosanitario: animal.documento_certificado_zoosanitario || '',
      documento_patente_fierro: animal.documento_patente_fierro || '',
      foto: animal.foto || '',
    })
    setShowFormAnimal(true)
  }

  const ultimoPeso = pesos.length > 0 ? pesos[0] : null
  const chartData = useMemo(() => pesos.map((p) => ({ peso: p.peso, fecha_registro: p.fecha_registro })), [pesos])

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="text-white text-xl relative z-10">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-contentFadeIn">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/30">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/dashboard" inline />
          </div>

          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Gestión de Animales</h2>
            {!puedeEditar && (
              <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm mb-4 max-w-xl mx-auto text-center">
                Sesión de trabajador: puedes ver datos y registrar pesos, vacunas y animales nuevos. No puedes editar ni dar de baja animales existentes.
              </p>
            )}
            <div className="flex gap-4 mt-2">
              {puedeEditar && (
                <button onClick={() => router.push('/dashboard/animales/inactivos')} className="bg-gray-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-700 transition-all">
                  Ver Animales Inactivos
                </button>
              )}
            </div>
          </div>

          {/* Buscador por arete */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">Buscar por Arete / Número de Identificación</label>
            <input
              type="text"
              placeholder="Escriba el arete para filtrar..."
              value={busquedaArete}
              onChange={(e) => setBusquedaArete(e.target.value)}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green bg-white text-black"
            />
          </div>

          <div className="mb-6 flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowFormAnimal(true)
                setEditingAnimal(null)
                setFormData({ nombre: '', numero_identificacion: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'M', estado: '', estatus: 'Activo', origen: 'comprado', madre_id: '', observaciones: [''], documento_guia_transito: '', documento_factura_venta: '', documento_certificado_movilizacion: '', documento_certificado_zoosanitario: '', documento_patente_fierro: '', foto: '' })
                setVacunaAlRegistrar({ agregar: false, tipo_vacuna: '', fecha_aplicacion: new Date().toISOString().split('T')[0], proxima_dosis: '' })
              }}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              + Agregar Animal
            </button>
          </div>

          {/* Modal tarjeta Nuevo/Editar Animal */}
          {showFormAnimal && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn"
              onClick={() => { setShowFormAnimal(false); setEditingAnimal(null) }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-animal-title"
            >
              <div
                className="bg-white rounded-2xl shadow-2xl border-2 border-cownect-green/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                  <h3 id="form-animal-title" className="text-xl font-bold text-black">{editingAnimal ? 'Editar Animal' : 'Nuevo Animal'}</h3>
                  <BackButton onClick={() => { setShowFormAnimal(false); setEditingAnimal(null) }} inline />
                </div>
                <form onSubmit={handleSubmitAnimal} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Arete / Número de Identificación (SINIIGA)</label>
                  <input
                    name="siniiga"
                    type="text"
                    value={formData.numero_identificacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_identificacion: AnimalValidator.formatNumeroIdentificacionSINIIGA(e.target.value),
                      })
                    }
                    placeholder="MEX-123456-12345"
                    maxLength={16}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Especie</label>
                  <input type="text" value={formData.especie} onChange={(e) => setFormData({ ...formData, especie: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Raza</label>
                  <select
                    name="raza"
                    value={formData.raza}
                    onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="">Seleccione una raza</option>
                    <option value="Holstein">Holstein</option>
                    <option value="Angus">Angus</option>
                    <option value="Hereford">Hereford</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Nacimiento</label>
                  <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} max={new Date().toISOString().split('T')[0]} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => {
                      const newSexo = e.target.value as 'M' | 'H'
                      const estadosDelOtro = newSexo === 'H' ? (ESTADOS_MACHO as readonly string[]) : (ESTADOS_HEMBRA as readonly string[])
                      const estadoActualInvalido = formData.estado && estadosDelOtro.includes(formData.estado)
                      setFormData({
                        ...formData,
                        sexo: newSexo,
                        estado: estadoActualInvalido ? '' : formData.estado,
                      })
                    }}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Estado / Etapa Productiva</label>
                  <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" disabled={formData.estatus !== 'Activo'}>
                    <option value="">Seleccione</option>
                    {formData.sexo === 'H' ? (
                      ESTADOS_HEMBRA.map((est) => <option key={est} value={est}>{est}</option>)
                    ) : (
                      ESTADOS_MACHO.map((est) => <option key={est} value={est}>{est}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Estatus</label>
                  <select value={formData.estatus} onChange={(e) => setFormData({ ...formData, estatus: e.target.value as 'Activo' | 'Muerto' | 'Robado' })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    {ESTATUS_OPCIONES.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Origen</label>
                  <select value={formData.origen} onChange={(e) => setFormData({ ...formData, origen: e.target.value as 'cria' | 'comprado', madre_id: e.target.value === 'comprado' ? '' : formData.madre_id })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green">
                    <option value="comprado">Comprado u otro</option>
                    <option value="cria">Cría (nacido aquí)</option>
                  </select>
                </div>
                {formData.origen === 'cria' && (
                  <div className="md:col-span-2">
                    <label className="block text-base font-bold text-black mb-2">Madre</label>
                    <select value={formData.madre_id} onChange={(e) => setFormData({ ...formData, madre_id: e.target.value })} className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" required={formData.origen === 'cria'}>
                      <option value="">Seleccione la madre</option>
                      {animales.filter((a) => a.sexo === 'H' && a.activo !== false).map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre || m.numero_identificacion || 'Sin nombre'}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-base font-bold text-black mb-2">Observaciones</label>
                  <div className="space-y-2">
                    {formData.observaciones.map((obs, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" value={obs} onChange={(e) => { const next = [...formData.observaciones]; next[idx] = e.target.value; setFormData({ ...formData, observaciones: next }) }} placeholder="Observación" className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green" />
                        {formData.observaciones.length > 1 && (
                          <button type="button" onClick={() => setFormData({ ...formData, observaciones: formData.observaciones.filter((_, i) => i !== idx) })} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">Quitar</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, observaciones: [...formData.observaciones, ''] })} className="text-cownect-green font-semibold hover:underline mt-1">
                      + Agregar otra observación
                    </button>
                  </div>
                </div>
              </div>
              {!editingAnimal && (
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <p className="font-bold text-black mb-3">Vacuna reciente (opcional)</p>
                  <label className="flex items-center gap-2 mb-3">
                    <input type="checkbox" checked={vacunaAlRegistrar.agregar} onChange={(e) => setVacunaAlRegistrar({ ...vacunaAlRegistrar, agregar: e.target.checked })} />
                    <span>Agregar vacuna al registrar</span>
                  </label>
                  {vacunaAlRegistrar.agregar && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de vacuna</label>
                        <input type="text" value={vacunaAlRegistrar.tipo_vacuna} onChange={(e) => setVacunaAlRegistrar({ ...vacunaAlRegistrar, tipo_vacuna: e.target.value })} placeholder="Ej. Brucelosis, Fiebre aftosa..." className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha en que se aplicó la vacuna</label>
                        <input
                          type="date"
                          value={vacunaAlRegistrar.fecha_aplicacion}
                          onChange={(e) => setVacunaAlRegistrar({ ...vacunaAlRegistrar, fecha_aplicacion: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                          min={formData.fecha_nacimiento || undefined}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Próxima dosis (cuándo toca revacunar — opcional)</label>
                        <input
                          type="date"
                          value={vacunaAlRegistrar.proxima_dosis}
                          onChange={(e) => setVacunaAlRegistrar({ ...vacunaAlRegistrar, proxima_dosis: e.target.value })}
                          min={vacunaAlRegistrar.fecha_aplicacion || new Date().toISOString().split('T')[0]}
                          className="w-full max-w-xs px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">Documentación</p>
                  <p className="text-green-700 text-sm">La documentación se gestiona desde la sección Documentación. Use el botón en la tarjeta del animal.</p>
                </div>
              </div>
              <button type="submit" className="mt-4 bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all">
                {editingAnimal ? 'Actualizar' : 'Guardar'}
              </button>
                </form>
              </div>
            </div>
          )}

          {/* Vista: lista de animales o detalle */}
          {!selectedAnimal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animalesFiltrados.map((animal) => (
                <div
                  key={animal.id}
                  onClick={() => setSelectedAnimal(animal)}
                  className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-cownect-green hover:shadow-lg cursor-pointer transition-all"
                >
                  {animal.foto ? (
                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-300">
                      <img src={getDriveImageUrl(animal.foto)} alt={animal.nombre || 'Animal'} className="w-full h-40 object-cover" onError={(e) => { const t = e.target as HTMLImageElement; if (animal.foto) t.src = animal.foto }} />
                    </div>
                  ) : (
                    <div className="mb-4 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Sin foto</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-black">{animal.nombre || 'Sin nombre'}</h3>
                  <p className="text-gray-700 font-mono font-semibold">Arete: {animal.numero_identificacion || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">{animal.especie} · {animal.raza}</p>
                  {animal.estado && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-green-50 border border-green-400 text-green-700 font-semibold text-sm">{animal.estado}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Vista detalle: dos tarjetas */
            <div className="space-y-6">
              <button onClick={() => setSelectedAnimal(null)} className="text-cownect-green hover:underline font-semibold flex items-center gap-2">
                ← Volver a la lista
              </button>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tarjeta izquierda: info, estadísticas, gráfica */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex gap-4 mb-6">
                    {selectedAnimal.foto ? (
                      <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-300">
                        <img src={getDriveImageUrl(selectedAnimal.foto)} alt={selectedAnimal.nombre || 'Animal'} className="w-full h-full object-cover" onError={(e) => { const t = e.target as HTMLImageElement; if (selectedAnimal.foto) t.src = selectedAnimal.foto }} />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-black">{selectedAnimal.nombre || 'Sin nombre'}</h3>
                      <p className="text-lg font-mono font-semibold text-gray-700">Arete: {selectedAnimal.numero_identificacion || 'N/A'}</p>
                      <p className="text-gray-600">{selectedAnimal.especie} · {selectedAnimal.raza}</p>
                      <p className="text-gray-600">{selectedAnimal.sexo === 'M' ? 'Macho' : 'Hembra'} · {selectedAnimal.estado || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">Último peso</p>
                      <p className="text-2xl font-bold text-cownect-green">{ultimoPeso ? `${ultimoPeso.peso} kg` : '—'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">Vacunaciones</p>
                      <p className="text-2xl font-bold text-blue-600">{vacunaciones.length}</p>
                    </div>
                  </div>
                  <PesosChart pesos={chartData} />

                  {/* Vacunas registradas */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-bold text-black mb-3">Vacunas registradas</h4>
                    {vacunaciones.length === 0 ? (
                      <p className="text-gray-500 text-sm">Sin vacunaciones registradas</p>
                    ) : (
                      <ul className="space-y-2">
                        {vacunaciones.map((v) => (
                          <li key={v.id || v.fecha_aplicacion + v.tipo_vacuna} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                            <span className="font-semibold text-gray-800">{v.tipo_vacuna || 'Vacuna'}</span>
                            <span className="text-gray-600"> · {v.fecha_aplicacion || '—'}</span>
                            {v.proxima_dosis && <span className="text-gray-500"> · Próx. dosis: {v.proxima_dosis}</span>}
                            {v.observaciones && <p className="text-gray-600 mt-1">{v.observaciones}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>

                {/* Tarjeta derecha: agregar datos */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-6 border-2 border-cownect-green/50 shadow-lg">
                  <h4 className="text-lg font-bold text-black mb-4">Agregar Datos</h4>
                  <div className="space-y-6">
                    <form onSubmit={handleAddPeso} className="border-b border-gray-200 pb-4">
                      <p className="font-semibold text-gray-700 mb-2">Registrar Peso</p>
                      <input
                        name="peso"
                        type="number"
                        step="0.1"
                        value={pesoForm.peso}
                        onChange={(e) => setPesoForm({ ...pesoForm, peso: e.target.value })}
                        placeholder="kg"
                        required
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2"
                      />
                      <input type="date" value={pesoForm.fecha_registro} onChange={(e) => setPesoForm({ ...pesoForm, fecha_registro: e.target.value })} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2" />
                      <input type="text" value={pesoForm.observaciones} onChange={(e) => setPesoForm({ ...pesoForm, observaciones: e.target.value })} placeholder="Observaciones" className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2" />
                      <button type="submit" className="w-full bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-opacity-90">Guardar Peso</button>
                    </form>
                    <form onSubmit={handleAddVacuna} className="border-b border-gray-200 pb-4">
                      <p className="font-semibold text-gray-700 mb-2">Registrar Vacunación</p>
                      <input type="text" value={vacunaForm.tipo_vacuna} onChange={(e) => setVacunaForm({ ...vacunaForm, tipo_vacuna: e.target.value })} placeholder="Tipo de vacuna" required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2" />
                      <label className="block text-xs text-gray-500 mb-0.5">Fecha en que se aplicó la vacuna</label>
                      <input
                        type="date"
                        value={vacunaForm.fecha_aplicacion}
                        onChange={(e) => setVacunaForm({ ...vacunaForm, fecha_aplicacion: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        min={selectedAnimal.fecha_nacimiento || undefined}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2"
                      />
                      <label className="block text-xs text-gray-500 mb-0.5">Próxima dosis (cuándo toca revacunar — opcional)</label>
                      <input
                        type="date"
                        value={vacunaForm.proxima_dosis}
                        onChange={(e) => setVacunaForm({ ...vacunaForm, proxima_dosis: e.target.value })}
                        min={vacunaForm.fecha_aplicacion || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2"
                      />
                      <input type="text" value={vacunaForm.observaciones} onChange={(e) => setVacunaForm({ ...vacunaForm, observaciones: e.target.value })} placeholder="Observaciones de esta vacuna (opcional)" className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2" />
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Guardar Vacunación</button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Apartado: Observaciones del animal */}
              <div className="bg-amber-50/80 rounded-xl p-6 border-2 border-amber-200">
                <h4 className="text-lg font-bold text-black mb-3">Observaciones del animal</h4>
                {selectedAnimal.observaciones && selectedAnimal.observaciones.trim() ? (
                  <ul className="space-y-1">
                    {selectedAnimal.observaciones.split(' · ').filter(Boolean).map((obs, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-2">
                        <span className="text-cownect-green mt-0.5">•</span>
                        <span>{obs.trim()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">Sin observaciones. Puedes añadirlas al editar el animal.</p>
                )}
              </div>

              {/* Acciones del animal */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => router.push(`/dashboard/eventos?id=${selectedAnimal.id}`)} className="bg-cownect-dark-green text-white px-4 py-2 rounded-lg font-bold hover:bg-opacity-90">Historial de eventos</button>
                {selectedAnimal.sexo === 'H' && (
                  <button onClick={() => router.push(`/dashboard/fertilidad?id=${selectedAnimal.id}`)} className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-700">Fertilidad y ciclo reproductivo</button>
                )}
                <button onClick={() => router.push(`/dashboard/documentacion?id=${selectedAnimal.id}`)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700">Documentación</button>
                {puedeEditar && (
                  <button onClick={() => { setAnimalToDelete(selectedAnimal); setShowDeleteModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">Marcar Inactivo</button>
                )}
                {puedeEditar && selectedAnimal.sexo === 'H' && (selectedAnimal.estado === 'Vaca Ordeña' || selectedAnimal.estado === 'Vaca Seca') && (
                  <>
                    <button onClick={() => handleCambiarEstado(selectedAnimal, 'Vaca Ordeña')} className={`px-4 py-2 rounded-lg font-bold ${selectedAnimal.estado === 'Vaca Ordeña' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>Ordeña</button>
                    <button onClick={() => handleCambiarEstado(selectedAnimal, 'Vaca Seca')} className={`px-4 py-2 rounded-lg font-bold ${selectedAnimal.estado === 'Vaca Seca' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700'}`}>Seca</button>
                  </>
                )}
              </div>

              {/* Botón al final: modificar datos */}
              {puedeEditar && (
                <div className="pt-4 border-t border-gray-200">
                  <button onClick={() => handleEdit(selectedAnimal)} className="w-full sm:w-auto bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all">
                    Modificar datos del animal (nombre, raza, arete, etc.)
                  </button>
                </div>
              )}
            </div>
          )}

          {animales.length === 0 && !loading && <div className="text-center py-8 text-xl text-gray-700">No hay animales registrados</div>}
          {animales.length > 0 && animalesFiltrados.length === 0 && <div className="text-center py-8 text-xl text-gray-700">No se encontraron animales con ese arete</div>}
        </div>
      </div>

      {/* Modal Eliminar/Inactivo */}
      {showDeleteModal && animalToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowDeleteModal(false); setAnimalToDelete(null) }} inline />
              <h3 className="text-xl font-bold">Marcar como Inactivo</h3>
            </div>
            <p className="mb-4"><strong>{animalToDelete.nombre || animalToDelete.numero_identificacion}</strong></p>
            <textarea value={razonEliminacion} onChange={(e) => setRazonEliminacion(e.target.value)} placeholder="Razón (opcional)" className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold">Confirmar</button>
              <button onClick={() => { setShowDeleteModal(false); setAnimalToDelete(null) }} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estado Muerto/Robado */}
      {showEstadoModal && animalEstadoCambiar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowEstadoModal(false); setAnimalEstadoCambiar(null); setNuevoEstado(''); setRazonEstado('') }} inline />
              <h3 className="text-xl font-bold">Marcar como {nuevoEstado}</h3>
            </div>
            <p className="mb-4"><strong>{animalEstadoCambiar.nombre || animalEstadoCambiar.numero_identificacion}</strong></p>
            <textarea value={razonEstado} onChange={(e) => setRazonEstado(e.target.value)} placeholder="Razón (opcional)" className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={confirmarCambioEstado} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold">Confirmar</button>
              <button onClick={() => { setShowEstadoModal(false); setAnimalEstadoCambiar(null); setNuevoEstado(''); setRazonEstado('') }} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-cownect-green mb-4">Éxito</h3>
            <p className="mb-6">{successMessage}</p>
            <button onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }} className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold">Aceptar</button>
          </div>
        </div>
      )}

      {/* Modal Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
            <p className="mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">Cerrar</button>
              {isLimitError && <button onClick={() => { router.push('/choose-plan'); setShowErrorModal(false); setErrorMessage(''); setIsLimitError(false) }} className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold">Ver Planes</button>}
            </div>
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

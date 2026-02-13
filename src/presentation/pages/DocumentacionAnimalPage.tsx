'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import ImageUpload from '../components/ui/ImageUpload'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { AlertTriangle, Shield, Lock, XCircle, Upload } from 'lucide-react'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function DocumentacionAnimalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const animalId = searchParams.get('id')

  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [declaracionAceptada, setDeclaracionAceptada] = useState(false)

  // Documentos
  const [documentos, setDocumentos] = useState({
    documento_guia_transito: '',
    documento_factura_venta: '',
    documento_certificado_movilizacion: '',
    documento_patente_fierro: '',
  })

  // Foto del animal (separada de documentos)
  const [fotoAnimal, setFotoAnimal] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!animalId) {
      router.replace('/dashboard/animales')
      return
    }
    loadAnimal()
  }, [user, authLoading, animalId, router])

  const loadAnimal = async () => {
    if (!animalId) return
    try {
      setLoading(true)
      const db = getFirebaseDb()
      const animalRef = doc(db, 'animales', animalId)
      const animalSnap = await getDoc(animalRef)
      
      if (!animalSnap.exists()) {
        setError('Animal no encontrado')
        return
      }

      const animalData = { id: animalSnap.id, ...animalSnap.data() } as Animal
      
      // Verificar que el animal pertenece al usuario
      if (animalData.usuario_id !== user?.id) {
        setError('No tienes permiso para ver este animal')
        router.replace('/dashboard/animales')
        return
      }

      setAnimal(animalData)
      setDocumentos({
        documento_guia_transito: animalData.documento_guia_transito || '',
        documento_factura_venta: animalData.documento_factura_venta || '',
        documento_certificado_movilizacion: animalData.documento_certificado_movilizacion || '',
        documento_patente_fierro: animalData.documento_patente_fierro || '',
      })
      setFotoAnimal(animalData.foto || '')
    } catch (err: any) {
      console.error('Error cargando animal:', err)
      setError('Error al cargar el animal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!animalId || !user) return
    if (!declaracionAceptada) {
      setError('Debe aceptar la declaración jurada para continuar')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Actualizar animal con documentos y foto (sin validaciones que impidan guardar)
      const animalActualizado: Partial<Animal> = {
        ...documentos,
        foto: fotoAnimal || undefined,
        updated_at: new Date().toISOString(),
      }

      await firestoreService.updateAnimal(animalId, animalActualizado)

      // Actualizar estado de documentación (sin bloquear)
      const documentosCompletos = Object.values(documentos).every(doc => doc.trim() !== '') && fotoAnimal
      await firestoreService.updateAnimal(animalId, {
        documentos_completos: documentosCompletos,
        estado_documentacion: documentosCompletos ? 'completa' : 'incompleta',
      })

          setSuccess(true)
          setTimeout(() => {
            router.push('/dashboard/animales')
          }, 2000)
    } catch (err: any) {
      console.error('Error guardando documentos:', err)
      setError('Error al guardar los documentos: ' + err.message)
    } finally {
      setSaving(false)
    }
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Animal no encontrado</h2>
            <p className="text-gray-600 mb-6">{error || 'El animal que buscas no existe'}</p>
            <button
              onClick={() => router.push('/dashboard/animales')}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
            >
              Volver a Animales
            </button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/animales')}
            className="text-cownect-green font-semibold mb-4 hover:underline flex items-center gap-2"
          >
            ← Volver a Animales
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Documentación del Animal
          </h1>
          <p className="text-lg text-gray-700">
            {animal.nombre || 'Sin nombre'} - {animal.numero_identificacion || 'Sin identificación'}
          </p>
        </div>

        {/* Banner de Alerta - El Repositorio */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                Aviso de Seguridad
              </h3>
              <p className="text-amber-800 leading-relaxed">
                <strong>Cownect</strong> actúa únicamente como un repositorio digital. No validamos la veracidad de los documentos ante autoridades oficiales. El usuario es el único responsable de la legalidad de la información cargada.
              </p>
            </div>
          </div>
        </div>


        {/* Alerta sobre Disposición Oficial */}
        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Disposición Oficial de la Ley
              </h3>
              <p className="text-blue-800 leading-relaxed mb-3">
                Por disposición oficial de la ley, para proceder con la venta de ganado se requieren ciertos documentos legales. 
                Estos documentos son necesarios para garantizar la legalidad de la transacción y la trazabilidad del animal.
              </p>
              <p className="text-blue-700 text-sm italic">
                Nota: Puede guardar la documentación en cualquier momento. La falta de documentos no impide guardar, pero se recomienda tenerlos completos para proceder con la venta.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Documentos */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Shield className="h-7 w-7 text-cownect-green" />
            Documentación
          </h2>
          <p className="text-gray-700 mb-6">
            Suba imágenes claras y legibles de cada documento. Todos los campos son opcionales, pero se recomienda completarlos para proceder con la venta.
          </p>

          <div className="space-y-6 mb-8">
            <div>
              <ImageUpload
                label="1. Guía de Movilización Interna (o de Tránsito)"
                value={documentos.documento_guia_transito}
                onChange={(url) => setDocumentos({ ...documentos, documento_guia_transito: url })}
                maxSizeMB={10}
              />
              <p className="text-xs text-gray-600 mt-1 ml-1">
                Permiso oficial que autoriza mover animales de un punto A a un punto B. Prueba que los animales provienen de un predio registrado y libre de enfermedades.
              </p>
            </div>

            <div>
              <ImageUpload
                label="2. Factura de Venta (o Contrato de Compraventa)"
                value={documentos.documento_factura_venta}
                onChange={(url) => setDocumentos({ ...documentos, documento_factura_venta: url })}
                maxSizeMB={10}
              />
              <p className="text-xs text-gray-600 mt-1 ml-1">
                Documento que detalla cuántos animales se venden, a qué precio y quién es el nuevo dueño. Prueba legal de que el comprador pagó por el ganado.
              </p>
            </div>

            <div>
              <ImageUpload
                label="3. Certificado de Identificación (SINIIGA / Arete)"
                value={documentos.documento_certificado_movilizacion}
                onChange={(url) => setDocumentos({ ...documentos, documento_certificado_movilizacion: url })}
                maxSizeMB={10}
              />
              <p className="text-xs text-gray-600 mt-1 ml-1">
                Registro individual vinculado al arete o dispositivo de identificación oficial. Permite la trazabilidad del animal.
              </p>
            </div>

            <div>
              <ImageUpload
                label="4. Patente de Fierro (Registro de Marca)"
                value={documentos.documento_patente_fierro}
                onChange={(url) => setDocumentos({ ...documentos, documento_patente_fierro: url })}
                maxSizeMB={10}
              />
              <p className="text-xs text-gray-600 mt-1 ml-1">
                Documento que certifica que la marca quemada (o tatuada) en el animal pertenece al vendedor. Prueba de propiedad legal.
              </p>
            </div>
          </div>

          {/* Foto del Animal (separada) */}
          <div className="mt-8 pt-8 border-t-2 border-gray-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Foto del Animal</h3>
            <p className="text-gray-700 mb-4">
              Suba una foto clara del animal. Esta foto aparecerá en el inicio y en el marketplace.
            </p>
            <ImageUpload
              label="Foto del Animal"
              value={fotoAnimal}
              onChange={setFotoAnimal}
              maxSizeMB={10}
            />
          </div>

          {/* Checkbox de Declaración Jurada */}
          <div className="mt-8 pt-8 border-t-2 border-gray-300">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaracionAceptada}
                  onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                  className="mt-1 w-5 h-5 text-cownect-green border-gray-300 rounded focus:ring-cownect-green"
                  required
                />
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold mb-2">
                    Declaración Jurada
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Declaro bajo gravedad de juramento que los documentos subidos son auténticos, vigentes y legales. Entiendo que <strong>Cownect</strong> no se hace responsable por la veracidad de estos archivos.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Lock className="h-5 w-5" />
              <span className="text-sm">Conexión segura</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!declaracionAceptada || saving}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                declaracionAceptada && !saving
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <Shield className="h-5 w-5" />
                  Guardar Documentación
                </>
              )}
            </button>
          </div>

          {/* Mensajes de Error y Éxito */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-base font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-50 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg text-base font-semibold">
              Documentación guardada exitosamente. Redirigiendo...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


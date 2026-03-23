'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import ImageUpload from '../components/ui/ImageUpload'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { AlertTriangle, Shield, Lock, XCircle, Upload, BadgeCheck, QrCode } from 'lucide-react'
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
  const [certificados, setCertificados] = useState<any[]>([])
  const [savingCert, setSavingCert] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)
  const [certSuccess, setCertSuccess] = useState<string | null>(null)
  const [certForm, setCertForm] = useState({
    certificateId: '',
    metadataUri: '',
    txHash: '',
  })
  const [autoCertLoading, setAutoCertLoading] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminValidateLoading, setAdminValidateLoading] = useState(false)
  const [markReviewedLoading, setMarkReviewedLoading] = useState(false)

  // Documentos
  const [documentos, setDocumentos] = useState({
    documento_guia_transito: '',
    documento_factura_venta: '',
    documento_certificado_movilizacion: '',
    documento_patente_fierro: '',
  })

  // Foto del animal (separada de documentos)
  const [fotoAnimal, setFotoAnimal] = useState('')

  const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
  const hasCertificate = certificados.length > 0
  const [isDocsLocked, setIsDocsLocked] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!animalId) {
      router.replace('/dashboard/gestion')
      return
    }
    loadAnimal()
    loadCertificados()
  }, [user, authLoading, animalId, router])

  // Bloqueo por sesión: si ya se guardó documentación de este animal en esta sesión,
  // la próxima vez se muestra en solo lectura hasta que cierre sesión / pestaña.
  useEffect(() => {
    if (!animalId) return
    if (typeof window === 'undefined') return
    const key = `cownect_docs_locked_${animalId}`
    if (window.sessionStorage.getItem(key) === '1') {
      setIsDocsLocked(true)
    }
  }, [animalId])

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
        router.replace('/dashboard/gestion')
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

  const loadCertificados = async () => {
    if (!animalId) return
    try {
      const res = await fetch(`/api/animal-certificates?animalId=${encodeURIComponent(animalId)}`)
      if (!res.ok) return
      const data = await res.json()
      setCertificados(data.certificados || [])
    } catch {
      // si falla, simplemente no mostramos certificados
    }
  }

  const handleRegisterCertificate = async () => {
    if (!animalId || !user?.id) return
    setCertError(null)
    setCertSuccess(null)

    if (!certForm.certificateId.trim() || !certForm.metadataUri.trim()) {
      setCertError('ID de certificado y Metadata URI son requeridos')
      return
    }

    try {
      setSavingCert(true)
      const res = await fetch('/api/animal-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          animalId,
          certificateIdOnchain: certForm.certificateId.trim(),
          ownerWallet: user.wallet_address ?? null,
          metadataUri: certForm.metadataUri.trim(),
          txHash: certForm.txHash.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCertError(data.error || 'Error al registrar el certificado')
        return
      }

      setCertSuccess('Certificado registrado correctamente')
      const newCert = {
        id: data.id,
        animal_id: animalId,
        certificate_id_onchain: certForm.certificateId.trim(),
        metadata_uri: certForm.metadataUri.trim(),
        tx_hash: certForm.txHash.trim() || null,
        owner_wallet: user.wallet_address ?? null,
        created_at: new Date().toISOString(),
      }
      setCertificados((prev) => [newCert, ...prev])
      setCertForm({ certificateId: '', metadataUri: '', txHash: '' })
      await loadCertificados()
    } catch (err: any) {
      setCertError(err?.message || 'Error al registrar el certificado')
    } finally {
      setSavingCert(false)
    }
  }

  const handleAutoCertificate = async () => {
    if (!animalId || !user?.id) return
    setCertError(null)
    setCertSuccess(null)

    try {
      setAutoCertLoading(true)
      const res = await fetch('/api/animal-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          animalId,
          auto: true,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCertError(data.error || 'Error al generar el certificado en blockchain')
        return
      }

      setCertSuccess('Certificado generado y vinculado correctamente')
      await loadCertificados()
    } catch (err: any) {
      setCertError(err?.message || 'Error al generar el certificado')
    } finally {
      setAutoCertLoading(false)
    }
  }

  const handleMarkReviewed = async () => {
    if (!animalId || !user?.id) return
    setCertError(null)
    setCertSuccess(null)

    if (!adminPassword.trim()) {
      setCertError('Ingresa la contraseña de administrador')
      return
    }

    const code = certForm.txHash.trim()
    if (!code) {
      setCertError('Ingresa el txHash del certificado (0x...)')
      return
    }

    try {
      setMarkReviewedLoading(true)
      const res = await fetch('/api/animal-certificates/mark-reviewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId,
          txHash: code,
          adminPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCertError(data.error || 'Error al validar y marcar el animal')
        return
      }

      setCertSuccess('Animal marcado como revisado para venta')
      setCertForm((f) => ({ ...f, txHash: '' }))
      await loadCertificados()
      await loadAnimal()
    } catch (err: any) {
      setCertError(err?.message || 'Error al validar el txHash')
    } finally {
      setMarkReviewedLoading(false)
    }
  }

  const handleAdminValidate = async () => {
    if (!animalId) return
    setCertError(null)
    setCertSuccess(null)

    if (!adminPassword.trim()) {
      setCertError('Ingresa la contraseña de administrador')
      return
    }

    try {
      setAdminValidateLoading(true)
      const res = await fetch('/api/animal-certificates/admin-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId,
          adminPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCertError(data.error || 'Error al marcar revisado')
        return
      }

      setCertSuccess('Animal marcado como revisado por administración')
      await loadAnimal()
    } catch (err: any) {
      setCertError(err?.message || 'Error al marcar revisado')
    } finally {
      setAdminValidateLoading(false)
    }
  }

  const handleSave = async () => {
    if (isDocsLocked) return
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

      // Marcar documentación como bloqueada en esta sesión
      if (typeof window !== 'undefined' && animalId) {
        const key = `cownect_docs_locked_${animalId}`
        window.sessionStorage.setItem(key, '1')
      }
      setIsDocsLocked(true)

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/gestion')
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
              onClick={() => router.push('/dashboard/gestion')}
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
            onClick={() => router.push('/dashboard/gestion')}
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

          {isDocsLocked && (
            <p className="text-xs text-gray-600 mb-6">
              La documentación de este animal ya fue guardada en esta sesión. Estás viendo una{' '}
              <span className="font-semibold">vista de solo lectura</span>. Para volver a editar,
              cierra sesión e inicia nuevamente.
            </p>
          )}

          {/* Certificados on‑chain (solo lectura) */}
          {certificados.length > 0 && (
            <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <div className="flex items-start gap-3 mb-2">
                <BadgeCheck className="h-5 w-5 text-emerald-700 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Certificados en Blockchain
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Este animal cuenta con certificados registrados on‑chain. Los datos
                    sensibles viven en la blockchain y aquí solo se muestra un resumen.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-emerald-900">
                {certificados.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 border border-emerald-200"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        Certificado Cownect #{c.cownect_certificate_id ?? c.id}
                      </span>
                      <span className="text-xs text-emerald-700">
                        Emitido el {new Date(c.created_at).toLocaleString()}
                      </span>
                      {c.metadata_uri && (
                        <a
                          href={c.metadata_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cownect-green hover:underline mt-1"
                        >
                          Ver metadata (IPFS / JSON)
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4">
                      {c.owner_wallet && (
                        <span className="text-[11px] text-emerald-800 font-mono truncate max-w-[180px]">
                          {c.owner_wallet}
                        </span>
                      )}
                      {c.tx_hash && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${c.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cownect-green hover:underline"
                        >
                          Ver en blockchain
                        </a>
                      )}
                      {typeof window !== 'undefined' && c.tx_hash && (
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                            `https://amoy.polygonscan.com/tx/${c.tx_hash}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:underline"
                        >
                          <QrCode className="h-3 w-3" />
                          Ver QR
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certificados on‑chain: generación automática y registro manual */}
          {isPremium && !hasCertificate && (
            <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-1">
                    <BadgeCheck className="h-4 w-4 text-emerald-700" />
                    Certificados en blockchain
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Solo puedes generar certificados si el animal fue validado/revisado por administración.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoCertificate}
                  disabled={autoCertLoading || animal?.revisado_para_venta !== true}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {autoCertLoading ? 'Generando certificado...' : 'Generar certificado automáticamente'}
                </button>

                <div className="border-t border-emerald-200 pt-3 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-800 mb-1">
                        Contraseña de administrador
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleAdminValidate}
                        disabled={adminValidateLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {adminValidateLoading ? 'Marcando...' : 'Marcar revisado (sin txHash)'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 pt-3 mt-3">
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      txHash (opcional, para vincular certificado existente)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="0x..."
                      value={certForm.txHash}
                      onChange={(e) => setCertForm((f) => ({ ...f, txHash: e.target.value }))}
                    />

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleMarkReviewed}
                        disabled={markReviewedLoading}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {markReviewedLoading ? 'Validando...' : 'Validar con txHash'}
                      </button>
                    </div>
                  </div>

                  {certError && <p className="text-xs text-red-700 mb-2 mt-3">{certError}</p>}
                  {certSuccess && <p className="text-xs text-emerald-700 mb-2 mt-3">{certSuccess}</p>}
                </div>
              </div>
            </div>
          )}

          {isPremium && hasCertificate && (
            <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
              <p className="text-xs text-emerald-900 font-semibold">
                Este animal ya tiene un Certificado Cownect. No se pueden generar certificados adicionales.
              </p>
            </div>
          )}

          <div className={`space-y-6 mb-8 ${isDocsLocked ? 'pointer-events-none opacity-80' : ''}`}>
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
          <div className={`mt-8 pt-8 border-t-2 border-gray-300 ${isDocsLocked ? 'pointer-events-none opacity-80' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Foto del Animal</h3>
            <p className="text-gray-700 mb-4">
              Suba una foto clara del animal. Esta foto aparecerá en el inicio y en la ficha del animal.
            </p>
            <ImageUpload
              label="Foto del Animal"
              value={fotoAnimal}
              onChange={setFotoAnimal}
              maxSizeMB={10}
            />
          </div>

          {/* Checkbox de Declaración Jurada */}
          <div className={`mt-8 pt-8 border-t-2 border-gray-300 ${isDocsLocked ? 'pointer-events-none opacity-60' : ''}`}>
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
          {!isDocsLocked && (
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
          )}

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


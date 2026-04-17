'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import { fetchWithAuth } from '../utils/fetchWithAuth'

interface CertificadoResult {
  elegible: boolean
  puntuacion: number
  criterios: {
    nombre: string
    cumplido: boolean
    descripcion: string
  }[]
  recomendaciones: string[]
}

function CertificadoContent() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const [loading, setLoading] = useState(false)
  const [certificado, setCertificado] = useState<CertificadoResult | null>(null)
  const [selectedRanchoId, setSelectedRanchoId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.rancho_actual_id) {
      setSelectedRanchoId(user.rancho_actual_id)
    }
  }, [user])

  const handleVerificar = async () => {
    if (!user?.id || !selectedRanchoId) return

    setVerifying(true)
    setError('')
    setSuccess('')
    setCertificado(null)

    try {
      const response = await fetchWithAuth('/api/certificado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rancho_id: selectedRanchoId,
          usuario_id: user.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCertificado(data.certificado)
        setSuccess('Verificación completada exitosamente')
      } else if (response.status === 403) {
        const errorData = await response.json()
        setError(errorData.error || 'Acceso denegado')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al verificar certificado')
      }
    } catch (err) {
      console.error('Error verificando certificado:', err)
      setError('Error al verificar certificado')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando certificado...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Certificado Cownect</h1>
              <p className="text-gray-600 mt-2">Verificación de elegibilidad para el certificado premium (Función Premium)</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Verificar Elegibilidad</h2>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Rancho
                  </label>
                  <select
                    value={selectedRanchoId}
                    onChange={(e) => setSelectedRanchoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar rancho...</option>
                    {user?.rancho_actual_id && (
                      <option value={user.rancho_actual_id}>Rancho Actual</option>
                    )}
                    {/* Aquí se podrían cargar ranchos adicionales si existiera endpoint GET */}
                  </select>
                </div>
                <button
                  onClick={handleVerificar}
                  disabled={verifying || !selectedRanchoId}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verificando...' : 'Verificar Elegibilidad'}
                </button>
              </div>
            </div>

            {certificado && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                    certificado.elegible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {certificado.elegible ? (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        ¡Elegible para Certificado Cownect!
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        No elegible para certificado
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-gray-600">Puntuación: {certificado.puntuacion}/100</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Criterios Evaluados</h3>
                    <div className="space-y-3">
                      {certificado.criterios.map((criterio, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                            criterio.cumplido ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {criterio.cumplido ? (
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${criterio.cumplido ? 'text-green-800' : 'text-red-800'}`}>
                              {criterio.nombre}
                            </p>
                            <p className="text-sm text-gray-600">{criterio.descripcion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Recomendaciones</h3>
                    {certificado.recomendaciones.length > 0 ? (
                      <ul className="space-y-2">
                        {certificado.recomendaciones.map((recomendacion, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{recomendacion}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">¡Excelente! No hay recomendaciones pendientes.</p>
                    )}
                  </div>
                </div>

                {certificado.elegible && (
                  <div className="text-center">
                    <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
                      Descargar Certificado Cownect
                    </button>
                    <p className="text-sm text-gray-600 mt-2">Próximamente: Generación de PDF oficial</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function CertificadoPage() {
  return <CertificadoContent />
}
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'

function DocumentacionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animalId = searchParams.get('id')
  const { user } = useAuth(false)
  const soloLectura = !!user?.es_sesion_trabajador
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (animalId) loadAnimal()
  }, [animalId])

  const loadAnimal = async () => {
    try {
      setLoading(true)
      const data = await firestoreService.getAnimal(animalId!)
      setAnimal(data as Animal)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando documentación...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard/gestion" inline />
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-cownect-green/20">
              <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">Documentación Digital</h1>
                  <p className="text-gray-500 text-lg">Animal: <span className="text-cownect-green font-bold">{animal?.numero_identificacion}</span> - {animal?.nombre || 'Sin nombre'}</p>
                  {soloLectura && (
                    <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mt-3 max-w-xl">
                      Sesión de trabajador: solo puedes consultar la documentación; no subir ni modificar archivos.
                    </p>
                  )}
                </div>
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-gray-100">
                  📄
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:border-cownect-green transition-all ${soloLectura ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">📸</div>
                   <h3 className="font-bold text-gray-900 mb-1">Fotografías</h3>
                   <p className="text-xs text-gray-400 uppercase font-black">Sin archivos subidos</p>
                </div>
                <div className={`bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:border-cownect-green transition-all ${soloLectura ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">🆔</div>
                   <h3 className="font-bold text-gray-900 mb-1">Registro de Fierro</h3>
                   <p className="text-xs text-gray-400 uppercase font-black">Pendiente de carga</p>
                </div>
                <div className={`bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:border-cownect-green transition-all ${soloLectura ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">🧬</div>
                   <h3 className="font-bold text-gray-900 mb-1">Certificado de Pureza</h3>
                   <p className="text-xs text-gray-400 uppercase font-black">Sin archivo adjunto</p>
                </div>
                <div className={`bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:border-cownect-green transition-all ${soloLectura ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">🚛</div>
                   <h3 className="font-bold text-gray-900 mb-1">Factura de Compra</h3>
                   <p className="text-xs text-gray-400 uppercase font-black">No disponible</p>
                </div>
              </div>

              <div className="mt-12 p-8 bg-cownect-green/5 rounded-3xl border border-cownect-green/10">
                <h4 className="font-black text-cownect-dark-green uppercase text-xs tracking-widest mb-4">Aviso de Seguridad</h4>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">Todos los documentos subidos son encriptados y almacenados de forma segura en la nube de Cownect. Solo tú y las personas autorizadas pueden visualizarlos.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function DocumentacionAnimalPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Cargando...</div>}>
      <DocumentacionContent />
    </Suspense>
  )
}

export default function DocumentacionAnimalPage() {
  return (
    <ProtectedRoute>
      <DocumentacionAnimalPageWrapper />
    </ProtectedRoute>
  )
}

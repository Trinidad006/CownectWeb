'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'

function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth(false)

  const handleLogout = async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <BackButton href="/" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">
              Cownect
            </h1>
            <h2 className="text-2xl font-bold text-black mb-4">Dashboard</h2>
            
            {user && (
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700">
                  Bienvenido, <span className="font-bold">
                    {user.nombre && user.apellido 
                      ? `${user.nombre} ${user.apellido}` 
                      : user.nombre || user.email}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">Gestión de Animales</h3>
              <p className="text-gray-700 mb-4">Registre y administre su inventario ganadero</p>
              <button 
                onClick={() => router.push('/dashboard/animales')}
                className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
              >
                Ver Animales
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">Vacunaciones</h3>
              <p className="text-gray-700 mb-4">Controle el historial de vacunaciones</p>
              <button 
                onClick={() => router.push('/dashboard/vacunaciones')}
                className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
              >
                Ver Vacunaciones
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">Control de Peso</h3>
              <p className="text-gray-700 mb-4">Registre y siga el peso de sus animales</p>
              <button 
                onClick={() => router.push('/dashboard/pesos')}
                className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
              >
                Ver Pesos
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">Marketplace</h3>
              <p className="text-gray-700 mb-4">Compre y venda ganado</p>
              <button 
                onClick={() => router.push('/dashboard/marketplace')}
                className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
              >
                Ver Marketplace
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}


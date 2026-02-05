'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../ui/Logo'
import ImageUpload from '../ui/ImageUpload'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { PAISES_MONEDAS, getMonedaByPais } from '@/utils/paisesMonedas'
import Image from 'next/image'

export default function DashboardHeader() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showFotoPerfilModal, setShowFotoPerfilModal] = useState(false)
  const [showEditarPerfilModal, setShowEditarPerfilModal] = useState(false)
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string>('')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    rancho: '',
    rancho_hectareas: '',
    rancho_pais: '',
    rancho_ciudad: '',
    rancho_direccion: '',
    rancho_descripcion: '',
  })

  const handleLogout = async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
    router.replace('/')
  }

  const nombreCompleto = user?.nombre && user?.apellido
    ? `${user.nombre} ${user.apellido}`
    : user?.nombre || user?.email || 'Usuario'

  const iniciales = user?.nombre && user?.apellido
    ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    : user?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  const handleGuardarFotoPerfil = async () => {
    if (!fotoPerfilUrl || !user?.id) return
    setUploadingFoto(true)
    try {
      await firestoreService.updateUsuario(user.id, { foto_perfil: fotoPerfilUrl })
      await checkAuth()
      setShowFotoPerfilModal(false)
      setFotoPerfilUrl('')
      // El modal se cierra automáticamente, no necesitamos alert
    } catch (error: any) {
      console.error('Error al guardar foto de perfil:', error)
      // El error se mostrará en el componente ImageUpload
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleAbrirEditarPerfil = () => {
    if (user) {
      setPerfilData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        rancho: user.rancho || '',
        rancho_hectareas: user.rancho_hectareas?.toString() || '',
        rancho_pais: user.rancho_pais || '',
        rancho_ciudad: user.rancho_ciudad || '',
        rancho_direccion: user.rancho_direccion || '',
        rancho_descripcion: user.rancho_descripcion || '',
      })
      setShowEditarPerfilModal(true)
      setShowMenu(false)
    }
  }

  const handleGuardarPerfil = async () => {
    if (!user?.id) return
    setEditandoPerfil(true)
    try {
      const info = perfilData.rancho_pais ? getMonedaByPais(perfilData.rancho_pais) : null
      await firestoreService.updateUsuario(user.id, {
        nombre: perfilData.nombre.trim(),
        apellido: perfilData.apellido.trim(),
        telefono: perfilData.telefono.trim(),
        rancho: perfilData.rancho.trim(),
        rancho_hectareas: perfilData.rancho_hectareas ? parseFloat(perfilData.rancho_hectareas) : undefined,
        rancho_pais: perfilData.rancho_pais || undefined,
        rancho_ciudad: perfilData.rancho_ciudad.trim() || undefined,
        rancho_direccion: perfilData.rancho_direccion.trim() || undefined,
        rancho_descripcion: perfilData.rancho_descripcion.trim() || undefined,
        moneda: info?.moneda,
      })
      await checkAuth()
      setShowEditarPerfilModal(false)
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error('Error al guardar perfil:', error)
      setErrorMessage('Error al guardar perfil: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setEditandoPerfil(false)
    }
  }

  return (
    <header className="bg-white shadow-md relative z-40" style={{ position: 'relative', zIndex: 40 }}>
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="text-2xl font-serif font-bold text-black hidden md:block">
              Cownect
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 transition-all"
            >
              {user?.foto_perfil ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cownect-green">
                  <Image
                    src={user.foto_perfil}
                    alt="Foto de perfil"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-cownect-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {iniciales}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-black">{nombreCompleto}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${showMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-30">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    {user?.foto_perfil ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cownect-green">
                        <Image
                          src={user.foto_perfil}
                          alt="Foto de perfil"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-cownect-green rounded-full flex items-center justify-center text-white font-bold">
                        {iniciales}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-black">{nombreCompleto}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  {user?.rancho && (
                    <p className="text-xs text-gray-500 mt-1">Rancho: {user.rancho}</p>
                  )}
                </div>
                <button
                  onClick={handleAbrirEditarPerfil}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Editar Perfil
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowFotoPerfilModal(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cambiar Foto de Perfil
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    router.push('/dashboard')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Ir al Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para cambiar foto de perfil */}
      {showFotoPerfilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-black">Cambiar Foto de Perfil</h3>
              <button
                onClick={() => {
                  setShowFotoPerfilModal(false)
                  setFotoPerfilUrl('')
                }}
                className="text-gray-500 hover:text-black text-3xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <ImageUpload
                label="Foto de Perfil"
                value={fotoPerfilUrl}
                onChange={setFotoPerfilUrl}
                maxSizeMB={5}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGuardarFotoPerfil}
                disabled={!fotoPerfilUrl || uploadingFoto}
                className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {uploadingFoto ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setShowFotoPerfilModal(false)
                  setFotoPerfilUrl('')
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar perfil */}
      {showEditarPerfilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-black">Editar Perfil</h3>
              <button
                onClick={() => {
                  setShowEditarPerfilModal(false)
                }}
                className="text-gray-500 hover:text-black text-3xl font-bold"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleGuardarPerfil(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={perfilData.nombre}
                    onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Apellido *</label>
                  <input
                    type="text"
                    value={perfilData.apellido}
                    onChange={(e) => setPerfilData({ ...perfilData, apellido: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-black mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={perfilData.telefono}
                  onChange={(e) => setPerfilData({ ...perfilData, telefono: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                />
              </div>

              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <h4 className="text-lg font-bold text-black mb-4">Información del Rancho</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Nombre del Rancho *</label>
                    <input
                      type="text"
                      value={perfilData.rancho}
                      onChange={(e) => setPerfilData({ ...perfilData, rancho: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-bold text-black mb-2">Hectáreas</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={perfilData.rancho_hectareas}
                        onChange={(e) => setPerfilData({ ...perfilData, rancho_hectareas: e.target.value })}
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-black mb-2">País</label>
                      <select
                        value={perfilData.rancho_pais}
                        onChange={(e) => setPerfilData({ ...perfilData, rancho_pais: e.target.value })}
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      >
                        <option value="">Seleccione un país</option>
                        {PAISES_MONEDAS.map((pais) => (
                          <option key={pais.codigo} value={pais.codigo}>
                            {pais.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-black mb-2">Ciudad</label>
                    <input
                      type="text"
                      value={perfilData.rancho_ciudad}
                      onChange={(e) => setPerfilData({ ...perfilData, rancho_ciudad: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-black mb-2">Dirección</label>
                    <input
                      type="text"
                      value={perfilData.rancho_direccion}
                      onChange={(e) => setPerfilData({ ...perfilData, rancho_direccion: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-black mb-2">Descripción del Rancho</label>
                    <textarea
                      value={perfilData.rancho_descripcion}
                      onChange={(e) => setPerfilData({ ...perfilData, rancho_descripcion: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editandoPerfil}
                  className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {editandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditarPerfilModal(false)
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn">
            <h3 className="text-xl font-bold text-cownect-green mb-4">Éxito</h3>
            <p className="text-gray-700 mb-6">Perfil actualizado exitosamente</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn">
            <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setErrorMessage('')
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}


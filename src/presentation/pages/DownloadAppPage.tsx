'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Smartphone,
  Download,
  CheckCircle,
  Clock,
  Apple,
  AlertTriangle,
  Code,
  LayoutDashboard,
} from 'lucide-react'

export default function DownloadAppPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (
    platform: 'android' | 'windows' | 'ios',
    type: 'release' | 'snapshot' = 'release'
  ) => {
    setDownloading(`${platform}-${type}`)
    try {
      if (platform === 'android') {
        const endpoint =
          type === 'snapshot'
            ? '/api/download/android/snapshot'
            : '/api/download/android'
        const response = await fetch(endpoint)
        if (!response.ok) {
          const text = await response.text()
          let message = 'Error al descargar la aplicación. Por favor intenta más tarde.'
          try {
            const json = JSON.parse(text)
            if (json.message) message = json.message
          } catch {
            if (text) message = text
          }
          throw new Error(message)
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute(
          'download',
          type === 'snapshot' ? 'Cownect-Snapshot.apk' : 'Cownect-Android.apk'
        )
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else if (platform === 'windows') {
        alert('La aplicación para Windows estará disponible próximamente')
      } else if (platform === 'ios') {
        alert('La aplicación para iOS estará disponible próximamente')
      }
    } catch (error: unknown) {
      console.error('Error al descargar:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al descargar la aplicación. Por favor intenta más tarde.'
      alert(errorMessage)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Botón ir al dashboard */}
        <div className="flex justify-end mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg border border-black"
          >
            <LayoutDashboard className="h-5 w-5" />
            Ir al panel
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-3xl shadow-2xl border border-black overflow-hidden p-2 mb-6">
            <Image
              src="/images/logo_front.jpeg"
              alt="Cownect Logo"
              width={96}
              height={96}
              className="w-full h-full object-contain"
              unoptimized
              priority
            />
          </div>
          <h1 className="text-5xl font-bold text-black mb-4">Descarga Cownect</h1>
          <p className="text-xl text-gray-700 font-normal">
            Instala la aplicación en tu dispositivo y gestiona tu ganado desde
            cualquier lugar
          </p>
        </div>

        {/* Lanzamientos oficiales */}
        <div className="bg-white rounded-2xl shadow-xl border border-black p-6 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Download className="h-7 w-7 text-black" />
            <h2 className="text-2xl font-bold text-black">Lanzamientos oficiales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Android - Disponible */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-black hover:shadow-3xl transition-all">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-4">
                <Smartphone className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Android</h3>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Disponible</span>
              </div>
            </div>
            <p className="text-gray-700 mb-6 text-center font-normal">
              Versión 1.0.0 - Compatible con Android 8.0+
            </p>
            <button
              onClick={() => handleDownload('android', 'release')}
              disabled={downloading === 'android-release'}
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-black flex items-center justify-center gap-3"
            >
              {downloading === 'android-release' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Descargar Versión Estable
                </>
              )}
            </button>
          </div>

          {/* Versión Web */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-black hover:shadow-3xl transition-all">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-4">
                <LayoutDashboard className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Versión Web</h3>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Disponible</span>
              </div>
            </div>
            <p className="text-gray-700 mb-6 text-center font-normal">
              Accede al panel completo desde cualquier equipo con navegador.
            </p>
            <Link
              href="/dashboard"
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 transition-all shadow-xl border border-black flex items-center justify-center gap-3"
            >
              <LayoutDashboard className="h-5 w-5" />
              Abrir Versión Web
            </Link>
          </div>

          {/* iOS - Próximamente */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-300 opacity-75">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-4">
                <Apple className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">iOS</h3>
              <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-full">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Próximamente</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-center font-normal">
              Estará disponible en las próximas semanas
            </p>
            <button
              disabled
              className="w-full bg-gray-300 text-gray-600 py-4 rounded-xl text-lg font-bold cursor-not-allowed border border-gray-400 flex items-center justify-center gap-3"
            >
              <Clock className="h-5 w-5" />
              Próximamente
            </button>
          </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-black">
          <h2 className="text-2xl font-bold text-black mb-6 text-center">
            Instrucciones de Instalación
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">Descarga el archivo APK</h3>
                <p className="text-gray-700 font-normal">
                  Haz clic en el botón &quot;Descargar Versión Estable&quot; para Android
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  Permite instalación de fuentes desconocidas
                </h3>
                <p className="text-gray-700 font-normal">
                  Ve a Configuración → Seguridad → Activa &quot;Fuentes desconocidas&quot;
                  o &quot;Instalar aplicaciones desconocidas&quot;
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">Instala la aplicación</h3>
                <p className="text-gray-700 font-normal">
                  Abre el archivo APK descargado y sigue las instrucciones para
                  instalar
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">Inicia sesión</h3>
                <p className="text-gray-700 font-normal">
                  Abre la aplicación e inicia sesión con tus credenciales
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Snapshots */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-300">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-orange-600" />
            <h2 className="text-2xl font-bold text-black">
              Snapshots (Solo Android)
            </h2>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-900 font-bold mb-2">
                  ⚠️ ADVERTENCIA IMPORTANTE:
                </p>
                <ul className="text-orange-800 text-sm space-y-1 list-disc list-inside">
                  <li>Las snapshots son versiones experimentales en desarrollo</li>
                  <li>
                    <strong>NO tienen acceso a la base de datos del servidor</strong>
                  </li>
                  <li>Usan una base de datos local para pruebas</li>
                  <li>Pueden contener errores y funcionalidades incompletas</li>
                  <li>Solo disponibles para Android</li>
                  <li>No recomendadas para uso en producción</li>
                </ul>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDownload('android', 'snapshot')}
            disabled={downloading === 'android-snapshot'}
            className="w-full bg-orange-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-orange-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-orange-700 flex items-center justify-center gap-3"
          >
            {downloading === 'android-snapshot' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Descargando...
              </>
            ) : (
              <>
                <Code className="h-5 w-5" />
                Descargar Snapshot (Solo Android)
              </>
            )}
          </button>
          <p className="text-sm text-gray-600 text-center mt-4">
            Actualmente no hay snapshots disponibles
          </p>
        </div>

        {/* Nota de seguridad */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <p className="text-yellow-800 font-semibold text-center">
            ⚠️ Nota: La aplicación Android se descarga directamente desde nuestro
            servidor. Asegúrate de tener activada la opción de &quot;Fuentes
            desconocidas&quot; en tu dispositivo.
          </p>
        </div>
      </div>
    </div>
  )
}

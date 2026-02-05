'use client'

import { useState, useRef, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage } from '@/infrastructure/config/firebase'
import { useAuth } from '../../hooks/useAuth'

interface ImageUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  required?: boolean
  accept?: string
  maxSizeMB?: number
}

export default function ImageUpload({
  label,
  value,
  onChange,
  required = false,
  accept = 'image/*',
  maxSizeMB = 5
}: ImageUploadProps & { maxSizeMB?: number }) {
  const { user } = useAuth(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Actualizar preview cuando cambie el value desde fuera
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione una imagen válida')
      return
    }

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen es muy grande. Por favor seleccione una imagen menor a ${maxSizeMB}MB`)
      return
    }

    if (!user?.id) {
      setError('Debe estar autenticado para subir imágenes. Por favor, recarga la página.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Verificar que Firebase Storage esté configurado
      const storage = getFirebaseStorage()
      if (!storage) {
        throw new Error('No se pudo inicializar Firebase Storage. Verifica la configuración.')
      }

      // Verificar que el usuario esté autenticado en Firebase Auth
      const { getFirebaseAuth } = await import('@/infrastructure/config/firebase')
      const auth = getFirebaseAuth()
      if (!auth.currentUser) {
        throw new Error('No hay una sesión activa. Por favor, inicia sesión nuevamente.')
      }

      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `documentos/${user.id}/${timestamp}_${sanitizedFileName}`
      const storageRef = ref(storage, fileName)

      console.log('Iniciando subida de imagen...')
      console.log('Usuario ID:', user.id)
      console.log('Nombre de archivo:', fileName)
      console.log('Tamaño del archivo:', file.size, 'bytes')
      
      await uploadBytes(storageRef, file)
      console.log('Imagen subida exitosamente a Firebase Storage')
      
      const downloadURL = await getDownloadURL(storageRef)
      console.log('URL de descarga obtenida:', downloadURL)

      setPreview(downloadURL)
      onChange(downloadURL)
      setError(null)
    } catch (error: any) {
      console.error('Error completo al subir imagen:', error)
      console.error('Código de error:', error.code)
      console.error('Mensaje de error:', error.message)
      
      let errorMessage = 'Error al subir la imagen'
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'No tienes permisos para subir imágenes. Verifica las reglas de Firebase Storage.'
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Se ha excedido la cuota de almacenamiento.'
      } else if (error.code === 'storage/unauthenticated') {
        errorMessage = 'Debes estar autenticado para subir imágenes.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-base font-bold text-black mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className="w-full h-48 object-contain border-2 border-gray-300 rounded-lg mb-2 bg-gray-50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-cownect-green transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, '-')}`}
          />
          <label
            htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
            className="cursor-pointer"
          >
            {uploading ? (
              <p className="text-gray-600">Subiendo imagen...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">Haz clic para seleccionar una imagen</p>
                <p className="text-sm text-gray-500">JPG, PNG (máx. {maxSizeMB}MB)</p>
              </>
            )}
          </label>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 font-semibold">{error}</p>
      )}
    </div>
  )
}


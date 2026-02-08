'use client'

import { useState, useRef, useEffect } from 'react'
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

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione una imagen válida')
      return
    }

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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', `documentos/${user.id}`)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen')
      }

      const downloadURL = data.url
      setPreview(downloadURL)
      onChange(downloadURL)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Error al subir la imagen')
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

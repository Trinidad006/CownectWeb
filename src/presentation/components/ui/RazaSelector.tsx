'use client'

import React, { useState, useMemo } from 'react'
import { Raza } from '@/domain/entities/Raza'
import { useRazas } from '@/presentation/hooks/useRazas'
import { Search } from 'lucide-react'

interface RazaSelectorProps {
  value?: string // ID de la raza seleccionada
  onChange: (razaId: string, raza?: Raza) => void
  aptitud?: 'Lechera' | 'Cárnica' | 'Doble Propósito'
  especie?: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)'
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

export default function RazaSelector({
  value,
  onChange,
  aptitud,
  especie,
  label = 'Raza',
  required = true,
  disabled = false,
  className = '',
  placeholder = 'Buscar raza...',
}: RazaSelectorProps) {
  const { razas, loading, error } = useRazas()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filtrar razas según los filtros
  const filteredRazas = useMemo(() => {
    let result = razas

    if (aptitud) {
      result = result.filter((r) => r.aptitud === aptitud)
    }

    if (especie) {
      result = result.filter((r) => r.especie === especie)
    }

    if (searchTerm) {
      result = result.filter(
        (r) =>
          r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.origen?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return result
  }, [razas, searchTerm, aptitud, especie])

  const selectedRaza = razas.find((r) => r.id === value)

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-cownect-green transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className={selectedRaza ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            {selectedRaza ? selectedRaza.nombre : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {loading && <div className="animate-spin h-4 w-4 border-2 border-cownect-green border-t-transparent rounded-full"></div>}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredRazas.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No se encontraron razas</div>
              ) : (
                filteredRazas.map((raza) => (
                  <button
                    key={raza.id}
                    type="button"
                    onClick={() => {
                      onChange(raza.id || '', raza)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-cownect-green/10 transition-colors border-b border-gray-100 last:border-b-0 ${
                      value === raza.id ? 'bg-cownect-green/20 font-semibold text-cownect-dark-green' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{raza.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {raza.aptitud} • {raza.especie} • {raza.origen}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{raza.clima_ideal}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedRaza && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Aptitud:</strong> {selectedRaza.aptitud} | <strong>Especie:</strong> {selectedRaza.especie}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            <strong>Clima ideal:</strong> {selectedRaza.clima_ideal}
            {selectedRaza.composicion && ` | Composición: ${selectedRaza.composicion}`}
          </p>
        </div>
      )}
    </div>
  )
}

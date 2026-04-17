'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BackButton from '@/presentation/components/ui/BackButton'

interface PublicRancher {
  id: string
  nombre?: string
  apellido?: string
  rancho?: string
  rancho_pais?: string
  rancho_ciudad?: string
  descripcion_publica?: string
  tipos_ganado?: string[]
}

export default function RanchosDirectoryPage() {
  const [items, setItems] = useState<PublicRancher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError('')
        const res = await fetch('/api/ranchos-publicos', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error((data as any)?.error || 'No se pudieron cargar los ranchos públicos.')
        }
        const dbItems = Array.isArray((data as any)?.items) ? (data as any).items : []

        if (!mounted) return
        setItems(
          dbItems.map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido,
            rancho: u.rancho,
            rancho_pais: u.rancho_pais,
            rancho_ciudad: u.rancho_ciudad,
            descripcion_publica: u.descripcion_publica,
            tipos_ganado: u.tipos_ganado || [],
          }))
        )
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudieron cargar los ranchos públicos.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((u) => {
      const haystack = [
        u.rancho,
        u.nombre,
        u.apellido,
        u.descripcion_publica,
        ...(u.tipos_ganado || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, search])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat relative"
        style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <p className="relative z-10 text-lg text-white font-semibold">Cargando ganaderos...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative py-10"
      style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <div className="mb-4">
          <BackButton href="/dashboard" inline />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Ganaderos en Cownect</h1>
          <p className="text-gray-700 mb-4">
            Perfiles públicos de ranchos que aceptan solicitudes de compra.
          </p>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por rancho, propietario o tipo de ganado..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-sm outline-none focus:border-cownect-green focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mostrando {filteredItems.length} de {items.length} perfiles
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {!error && filteredItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-8 text-center text-gray-600 shadow-xl">
            {items.length === 0
              ? 'Aún no hay perfiles públicos configurados.'
              : 'No encontramos resultados con ese filtro.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredItems.map((u) => (
              <Link
                key={u.id}
                href={`/ranchos/${u.id}`}
                className="group bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl border border-gray-200 hover:border-emerald-200 transition-all block"
              >
                <h2 className="text-xl font-bold text-black mb-1 group-hover:text-cownect-green transition-colors">
                  {u.rancho || 'Rancho sin nombre'}
                </h2>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-3">
                  Ver perfil
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  Propietario: {[u.nombre, u.apellido].filter(Boolean).join(' ') || 'No especificado'}
                </p>
                {u.tipos_ganado && u.tipos_ganado.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.tipos_ganado.slice(0, 4).map((tipo) => (
                      <span
                        key={tipo}
                        className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"
                      >
                        {tipo}
                      </span>
                    ))}
                  </div>
                )}
                {u.descripcion_publica && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {u.descripcion_publica}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


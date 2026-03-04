'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const dbItems = await (async () => {
          // Re‑usar firestoreService con un helper ligero
          const db = (await import('firebase/firestore')).getFirestore()
          const { collection, query, where, getDocs } = await import('firebase/firestore')
          const q = query(
            collection(db, 'usuarios'),
            where('perfil_publico', '==', true)
          )
          const snap = await getDocs(q)
          return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        })()

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
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Cargando ganaderos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-4">
          <BackButton href="/dashboard" inline />
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">Ganaderos en Cownect</h1>
        <p className="text-gray-700 mb-6">
          Perfiles públicos de ranchos que aceptan solicitudes de compra.
        </p>

        {items.length === 0 ? (
          <p className="text-gray-600">Aún no hay perfiles públicos configurados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((u) => (
              <Link
                key={u.id}
                href={`/ranchos/${u.id}`}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg border border-gray-200 transition-all block"
              >
                <h2 className="text-xl font-bold text-black mb-1">
                  {u.rancho || 'Rancho sin nombre'}
                </h2>
                <p className="text-sm text-gray-700 mb-1">
                  Propietario: {[u.nombre, u.apellido].filter(Boolean).join(' ') || 'No especificado'}
                </p>
                {(u.rancho_ciudad || u.rancho_pais) && (
                  <p className="text-sm text-gray-600">
                    {u.rancho_ciudad && `${u.rancho_ciudad}, `}{u.rancho_pais}
                  </p>
                )}
                {u.tipos_ganado && u.tipos_ganado.length > 0 && (
                  <p className="text-xs text-cownect-green font-semibold mt-2">
                    {u.tipos_ganado.join(' • ')}
                  </p>
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


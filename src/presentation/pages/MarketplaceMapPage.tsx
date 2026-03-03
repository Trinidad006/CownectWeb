'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import type { LoteMarketplace } from '@/domain/entities/LoteMarketplace'
import { MapPin } from 'lucide-react'

const LOTES_COORDS: Pick<
  LoteMarketplace,
  'id' | 'nombre' | 'ubicacion' | 'coords' | 'precioTotalUsd' | 'vendedorNombre'
>[] = [
  {
    id: 'lote-1',
    nombre: 'Lote Norte - Holstein',
    ubicacion: 'Mérida, Yucatán',
    coords: { lat: 20.97, lng: -89.62 },
    precioTotalUsd: 12500,
    vendedorNombre: 'Rancho La Esperanza',
  },
  {
    id: 'lote-2',
    nombre: 'Lote Sur - Angus',
    ubicacion: 'Escárcega, Campeche',
    coords: { lat: 18.61, lng: -90.75 },
    precioTotalUsd: 8200,
    vendedorNombre: 'Ganadería El Trébol',
  },
]

function MapContent() {
  const router = useRouter()

  const lotesConCoords = LOTES_COORDS.filter((l) => l.coords)

  const bounds = useMemo(() => {
    const lats = lotesConCoords.map((l) => l.coords!.lat)
    const lngs = lotesConCoords.map((l) => l.coords!.lng)
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.max(...lngs), // en México, más al este es un número "mayor" (menos negativo)
      maxLng: Math.min(...lngs),
    }
  }, [lotesConCoords])

  const project = (lat: number, lng: number) => {
    const { minLat, maxLat, minLng, maxLng } = bounds
    const latRange = maxLat - minLat || 1
    const lngRange = maxLng - minLng || 1
    const top = 10 + ((maxLat - lat) / latRange) * 80
    const left = 10 + ((lng - maxLng) / lngRange) * 80
    return { top: `${top}%`, left: `${left}%` }
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black/50" />
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <div className="flex items-center justify-between mb-4">
          <BackButton href="/dashboard/marketplace" inline />
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md font-serif">
            Lotes en el mapa
          </h1>
        </div>
        <p className="text-white/90 text-sm mb-4">
          Visualiza rápidamente qué lotes están cerca de ti. Cada punto representa un lote publicado.
        </p>

        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/10 p-4 md:p-6">
          <div className="relative w-full h-[380px] md:h-[460px] rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ffffff33_0,transparent_40%),radial-gradient(circle_at_80%_80%,#ffffff22_0,transparent_45%)]" />

            {lotesConCoords.map((lote) => {
              const pos = project(lote.coords!.lat, lote.coords!.lng)
              return (
                <button
                  key={lote.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group"
                  style={pos}
                  onClick={() => router.push('/dashboard/marketplace')}
                >
                  <div className="px-2 py-1 rounded-full bg-white/95 text-[10px] text-gray-900 font-semibold shadow mb-1 whitespace-nowrap">
                    {lote.nombre}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <MapPin className="h-3.5 w-3.5 text-emerald-900" />
                  </div>
                </button>
              )
            })}

            <div className="absolute left-4 bottom-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{lotesConCoords.length} lotes publicados</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {lotesConCoords.map((lote) => (
              <div
                key={lote.id}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-semibold text-gray-900">{lote.nombre}</p>
                  <p className="text-gray-600 text-[11px]">{lote.ubicacion}</p>
                  <p className="text-[11px] text-cownect-green font-semibold mt-1">
                    ${lote.precioTotalUsd.toLocaleString()} USD
                  </p>
                  {lote.vendedorNombre && (
                    <p className="text-[10px] text-gray-500">Vendedor: {lote.vendedorNombre}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/marketplace')}
                  className="text-[11px] text-cownect-green hover:text-cownect-dark-green underline mt-1"
                >
                  Ver publicación
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceMapPage() {
  return (
    <ProtectedRoute>
      <MapContent />
    </ProtectedRoute>
  )
}


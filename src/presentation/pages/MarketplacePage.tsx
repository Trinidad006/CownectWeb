'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import type { GanadoEnLote, LoteMarketplace } from '@/domain/entities/LoteMarketplace'
import type { CartItem } from '@/domain/entities/MarketplaceCart'
import {
  ArrowRight,
  CreditCard,
  Filter,
  FileText,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Plus,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from 'lucide-react'

// Fotos genéricas de ganado (Unsplash) para ejemplo
const IMG_LOTE_HOLSTEIN = 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&q=80'
const IMG_LOTE_ANGUS = 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80'
const IMG_VACA = 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=400&q=80'
const IMG_TORO = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80'

const LOTES_MOCK: LoteMarketplace[] = [
  {
    id: 'lote-1',
    nombre: 'Lote Norte - Holstein',
    descripcion: 'Lote de hembras Holstein en producción, ideal para lechería familiar.',
    certificadoBlockchainId: '0x7a3f...b2c1',
    precioTotalUsd: 12500,
    vendedorNombre: 'Rancho La Esperanza',
    vendedorId: 'vendor-rancho-esperanza',
    vendorPostalCode: '97000',
    ubicacion: 'Mérida, Yucatán',
    proposito: 'lechero',
    certificadoSanitario: true,
    vendedorOro: true,
    esNuevo: true,
    videoUrl:
      'https://videos.pexels.com/video-files/5532773/5532773-hd_1280_720_30fps.mp4',
    ratingAverage: 4.8,
    ratingCount: 23,
    coords: {
      lat: 20.97,
      lng: -89.62,
    },
    reviewsSample: [
      {
        buyerName: 'Ganadería San José',
        comment: 'Vacas muy tranquilas y sanas, tal como en las fotos. Buena comunicación del vendedor.',
        rating: 5,
      },
      {
        buyerName: 'Rancho El Roble',
        comment: 'Entrega puntual y animales acostumbrados a manejo diario. Volvería a comprar.',
        rating: 4,
      },
    ],
    detalles:
      'Vacas felices manejadas en pastoreo rotacional. Animales dóciles, acostumbrados a manejo diario y contacto con personas.',
    imagenUrl: IMG_LOTE_HOLSTEIN,
    ganados: [
      {
        id: 'g1',
        siniiga: '3102938475',
        nombre: 'Blanca',
        raza: 'Holstein',
        peso_kg: 520,
        sexo: 'H',
        contratoInteligenteId: 'SC-001',
        fotoUrl: IMG_VACA,
        descripcion: 'Vaca feliz, muy dócil, acostumbrada a ser ordeñada a mano y a máquina.',
      },
      {
        id: 'g2',
        siniiga: '3102938476',
        nombre: 'Mancha',
        raza: 'Holstein',
        peso_kg: 480,
        sexo: 'H',
        contratoInteligenteId: 'SC-002',
        fotoUrl: IMG_VACA,
        descripcion: 'Hembra joven, excelente conformación, ideal para mejorar genética del hato.',
      },
    ],
  },
  {
    id: 'lote-2',
    nombre: 'Lote Sur - Angus',
    descripcion: 'Machos Angus para engorda, listos para subir de peso en corral o pastura.',
    certificadoBlockchainId: '0x9b1e...d4f2',
    precioTotalUsd: 8200,
    vendedorNombre: 'Ganadería El Trébol',
    vendedorId: 'vendor-ganaderia-trebol',
    vendorPostalCode: '24350',
    ubicacion: 'Escárcega, Campeche',
    proposito: 'engorda',
    certificadoSanitario: true,
    ratingAverage: 4.6,
    ratingCount: 11,
    videoUrl:
      'https://videos.pexels.com/video-files/6894154/6894154-hd_1280_720_25fps.mp4',
    coords: {
      lat: 18.61,
      lng: -90.75,
    },
    reviewsSample: [
      {
        buyerName: 'Engorda Los Pinos',
        comment: 'Lote parejo y bien cuidado, ideal para corral de engorda. Muy buena asesoría.',
        rating: 5,
      },
      {
        buyerName: 'Rancho El Milagro',
        comment: 'Un toro llegó un poco flaco, pero en general buena genética y trato serio.',
        rating: 4,
      },
    ],
    detalles:
      'Lote parejo, animales revisados por médico veterinario. Ideales para proyectos de engorda o cruzas terminales.',
    imagenUrl: IMG_LOTE_ANGUS,
    ganados: [
      {
        id: 'g3',
        siniiga: '3102938477',
        nombre: 'Toro 1',
        raza: 'Angus',
        peso_kg: 650,
        sexo: 'M',
        contratoInteligenteId: 'SC-003',
        fotoUrl: IMG_TORO,
        descripcion: 'Toro manso, camina bien, excelente conformación muscular.',
      },
    ],
  },
]

function MarketplaceContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [lotes] = useState<LoteMarketplace[]>(LOTES_MOCK)
  const [loteExpandido, setLoteExpandido] = useState<string | null>(null)
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteMarketplace | null>(null)
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [hoverLoteId, setHoverLoteId] = useState<string | null>(null)
  const [animacionesActivas, setAnimacionesActivas] = useState(false)
  const [search, setSearch] = useState('')

  const totalCarrito = useMemo(
    () => carrito.reduce((sum, item) => sum + item.precioUsd * item.cantidad, 0),
    [carrito]
  )
  const cantidadCarrito = useMemo(() => carrito.reduce((s, i) => s + i.cantidad, 0), [carrito])

  useEffect(() => {
    // Activamos animaciones una vez que el componente se monta en el cliente
    const timer = setTimeout(() => setAnimacionesActivas(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const precioMaxAbsoluto = useMemo(
    () => (lotes.length ? Math.max(...lotes.map((l) => l.precioTotalUsd)) : 0),
    [lotes]
  )
  const [precioMaxFiltro, setPrecioMaxFiltro] = useState<number>(precioMaxAbsoluto || 0)

  const lotesFiltrados = useMemo(
    () =>
      lotes.filter((lote) => {
        if (precioMaxFiltro && lote.precioTotalUsd > precioMaxFiltro) return false

        if (search.trim()) {
          const q = search.toLowerCase()
          const texto = (
            lote.nombre +
            ' ' +
            (lote.descripcion ?? '') +
            ' ' +
            (lote.detalles ?? '') +
            ' ' +
            (lote.vendedorNombre ?? '') +
            ' ' +
            (lote.ubicacion ?? '')
          ).toLowerCase()
          if (!texto.includes(q)) return false
        }

        return true
      }),
    [lotes, precioMaxFiltro, search]
  )

  const imagenesLote = (lote: LoteMarketplace): string[] => {
    const urls: string[] = []
    if (lote.imagenUrl) urls.push(lote.imagenUrl)
    lote.ganados.forEach((g) => {
      if (g.fotoUrl && !urls.includes(g.fotoUrl)) urls.push(g.fotoUrl)
    })
    return urls
  }

  const agregarLoteAlCarrito = (lote: LoteMarketplace) => {
    setCarrito((prev) => {
      const ya = prev.find((p) => p.lote?.id === lote.id && p.tipo === 'lote')
      if (ya) return prev.map((p) => (p.lote?.id === lote.id ? { ...p, cantidad: p.cantidad + 1 } : p))
      return [...prev, { id: `lote-${lote.id}`, tipo: 'lote' as const, lote, precioUsd: lote.precioTotalUsd, cantidad: 1 }]
    })
  }

  const agregarGanadoAlCarrito = (lote: LoteMarketplace, ganado: GanadoEnLote, precio: number) => {
    setCarrito((prev) => {
      const ya = prev.find((p) => p.ganado?.id === ganado.id && p.tipo === 'ganado')
      if (ya) return prev.map((p) => (p.ganado?.id === ganado.id ? { ...p, cantidad: p.cantidad + 1 } : p))
      return [...prev, { id: `g-${ganado.id}`, tipo: 'ganado' as const, lote, ganado, precioUsd: precio, cantidad: 1 }]
    })
  }

  const quitarDelCarrito = (itemId: string) => {
    setCarrito((prev) => prev.filter((p) => p.id !== itemId))
  }

  const precioPorGanado = (lote: LoteMarketplace) =>
    lote.ganados.length > 0 ? lote.precioTotalUsd / lote.ganados.length : 0

  const buildWhatsAppChecklist = () => {
    const lineas = [
      '✅ Checklist compra Cownect Marketplace',
      '',
      ...carrito.map((item) => {
        if (item.tipo === 'lote' && item.lote) return `☐ Lote: ${item.lote.nombre} - $${item.precioUsd} USD x ${item.cantidad}`
        if (item.tipo === 'ganado' && item.ganado) return `☐ ${item.ganado.nombre || item.ganado.siniiga} (${item.ganado.raza}) - $${item.precioUsd} USD`
        return '☐ Item'
      }),
      '',
      `Total: $${totalCarrito.toFixed(2)} USD`,
    ]
    return encodeURIComponent(lineas.join('\n'))
  }

  const abrirChecklistWhatsApp = () => {
    const text = buildWhatsAppChecklist()
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const procederACompra = () => {
    if (carrito.length === 0) return
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        'cownect_marketplace_cart',
        JSON.stringify({
          items: carrito,
          total: totalCarrito,
        })
      )
    } catch {
      // ignorar errores de almacenamiento
    }

    window.open('/dashboard/marketplace/checkout', '_blank')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black/50" />
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6 max-w-5xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <BackButton href="/dashboard" inline />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md font-serif">
              Marketplace de Ganado
            </h1>
            <button
              type="button"
              onClick={() => router.push('/dashboard/marketplace/map')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/40 text-xs text-white/90 hover:bg-white/10 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              Ver en mapa
            </button>
          </div>
        </div>

        {/* Buscador + filtro por precio */}
        {precioMaxAbsoluto > 0 && (
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-4 mb-6 space-y-4">
            <div className="w-full md:w-2/3">
              <label className="block text-xs text-white/80 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Holstein, Angus, engorda, Mérida..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Precio máximo:</span>
                <span className="font-semibold">
                  ${(precioMaxFiltro || precioMaxAbsoluto).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  USD
                </span>
              </div>
              <input
                type="range"
                min={Math.min(...lotes.map((l) => l.precioTotalUsd))}
                max={precioMaxAbsoluto}
                value={precioMaxFiltro || precioMaxAbsoluto}
                onChange={(e) => setPrecioMaxFiltro(Number(e.target.value))}
                className="flex-1 accent-cownect-green"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lotesFiltrados.map((lote, index) => {
            const imagenes = imagenesLote(lote)
            const imagenPrincipal =
              hoverLoteId === lote.id && imagenes[1] ? imagenes[1] : imagenes[0]
            const isHovered = hoverLoteId === lote.id

            return (
            <article
              key={lote.id}
              className={`bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-white/30 overflow-hidden hover:shadow-2xl transition-all flex flex-col transform ${
                animacionesActivas ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDuration: '500ms', transitionDelay: `${index * 80}ms` }}
            >
              <div
                className="relative h-52 bg-gray-200 cursor-pointer group overflow-hidden"
                onClick={() => setLoteSeleccionado(lote)}
                onMouseEnter={() => setHoverLoteId(lote.id)}
                onMouseLeave={() => setHoverLoteId(null)}
              >
                {lote.videoUrl && isHovered ? (
                  <video
                    src={lote.videoUrl}
                    muted
                    loop
                    autoPlay
                    playsInline
                    poster={imagenPrincipal}
                    className="w-full h-full object-cover"
                  />
                ) : imagenPrincipal ? (
                  <Image
                    src={imagenPrincipal}
                    alt={lote.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {lote.esNuevo && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600/95 text-white text-[10px] font-semibold shadow">
                      <Sparkles className="h-3 w-3" />
                      Nuevo lote
                    </span>
                  )}
                  {lote.certificadoSanitario && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-emerald-700 text-[10px] font-semibold shadow">
                      <Filter className="h-3 w-3" />
                      Certificado
                    </span>
                  )}
                  {lote.vendedorOro && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-black text-[10px] font-semibold shadow">
                      <Star className="h-3 w-3" />
                      Vendedor oro
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-base font-bold text-black mb-1 line-clamp-1">{lote.nombre}</h2>
                {lote.ubicacion && (
                  <p className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    {lote.ubicacion}
                  </p>
                )}
                {lote.descripcion && <p className="text-gray-600 text-xs mb-1 line-clamp-2">{lote.descripcion}</p>}
                {typeof lote.ratingAverage === 'number' && typeof lote.ratingCount === 'number' && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-gray-900">{lote.ratingAverage.toFixed(1)}</span>
                    <span className="text-gray-500">({lote.ratingCount} reseñas)</span>
                  </p>
                )}
                {lote.vendedorNombre && (
                  <p className="text-gray-500 text-xs mb-3">Vendedor: {lote.vendedorNombre}</p>
                )}
                <p className="text-2xl font-extrabold text-black mb-4">
                  ${lote.precioTotalUsd.toLocaleString()} USD
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => agregarLoteAlCarrito(lote)}
                    className="inline-flex items-center gap-1.5 bg-cownect-green text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-cownect-dark-green transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Lote completo
                  </button>
                  <button
                    onClick={() => setLoteExpandido(loteExpandido === lote.id ? null : lote.id)}
                    className="inline-flex items-center gap-1.5 border border-cownect-green/70 text-cownect-green px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-cownect-green/5 transition-colors"
                  >
                    {loteExpandido === lote.id ? 'Cerrar lista' : 'Ver animales'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoteSeleccionado(lote)}
                    className="inline-flex items-center gap-1.5 text-cownect-green text-sm font-semibold ml-auto"
                  >
                    Ver publicación
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {loteExpandido === lote.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {lote.ganados.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {g.fotoUrl ? (
                            <Image src={g.fotoUrl} alt={g.nombre || g.siniiga} width={56} height={56} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black">{g.nombre || g.siniiga}</p>
                          <p className="text-gray-600 text-sm">{g.raza} · {g.peso_kg} kg</p>
                          {g.contratoInteligenteId && (
                            <p className="text-indigo-600 text-xs flex items-center gap-1 mt-0.5">
                              <FileText className="h-3 w-3" /> {g.contratoInteligenteId}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => agregarGanadoAlCarrito(lote, g, precioPorGanado(lote))}
                          className="flex-shrink-0 inline-flex items-center gap-1 bg-cownect-green text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-cownect-dark-green"
                        >
                          <Plus className="h-3.5 w-3.5" /> ${precioPorGanado(lote).toFixed(0)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )})}
        </div>
      </div>

      {/* Icono flotante del carrito */}
      <button
        onClick={() => setCarritoAbierto(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-cownect-green text-white shadow-lg hover:bg-cownect-dark-green transition-all flex items-center justify-center border-2 border-white/30"
        aria-label="Ver carrito"
      >
        <ShoppingCart className="h-6 w-6" />
        {cantidadCarrito > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-white text-cownect-green text-xs font-bold flex items-center justify-center">
            {cantidadCarrito > 99 ? '99+' : cantidadCarrito}
          </span>
        )}
      </button>

      {/* Panel del carrito (slide desde la derecha) */}
      {carritoAbierto && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setCarritoAbierto(false)} aria-hidden="true" />
          <aside className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-cownect-green" />
                Carrito
              </h3>
              <button
                onClick={() => setCarritoAbierto(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {carrito.length === 0 ? (
                <p className="text-gray-500 text-sm">Añade lotes o ganado desde el listado.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {carrito.map((item) => (
                      <li key={item.id} className="flex justify-between items-start gap-2 text-sm bg-gray-50 rounded-xl p-3">
                        <span className="text-gray-800 flex-1 min-w-0">
                          {item.tipo === 'lote' ? item.lote?.nombre : item.ganado?.nombre || item.ganado?.siniiga}
                          {item.cantidad > 1 && ` × ${item.cantidad}`}
                        </span>
                        <span className="font-semibold text-cownect-green whitespace-nowrap">${(item.precioUsd * item.cantidad).toFixed(0)}</span>
                        <button
                          onClick={() => quitarDelCarrito(item.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-lg font-bold text-black mt-4 pt-3 border-t">Total: ${totalCarrito.toFixed(2)} USD</p>

                  <button
                    onClick={abrirChecklistWhatsApp}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Checklist en WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      procederACompra()
                      setCarritoAbierto(false)
                    }}
                    disabled={totalCarrito <= 0}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-cownect-green text-white py-3 rounded-xl font-bold hover:bg-cownect-dark-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CreditCard className="h-5 w-5" />
                    Proceder a compra
                  </button>
                </>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Modal de publicación estilo marketplace */}
      {loteSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="relative md:w-1/2 h-56 md:h-auto bg-gray-200">
                {loteSeleccionado.imagenUrl ? (
                  <Image
                    src={loteSeleccionado.imagenUrl}
                    alt={loteSeleccionado.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                )}
              </div>
              <div className="md:w-1/2 p-5 md:p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-black">{loteSeleccionado.nombre}</h2>
                    {loteSeleccionado.ubicacion && (
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {loteSeleccionado.ubicacion}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setLoteSeleccionado(null)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-black"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-2xl font-bold text-cownect-green mb-2">
                  ${loteSeleccionado.precioTotalUsd.toLocaleString()} USD
                </p>
                {loteSeleccionado.detalles && (
                  <p className="text-gray-700 text-sm mb-3 whitespace-pre-line">
                    {loteSeleccionado.detalles}
                  </p>
                )}
                {loteSeleccionado.vendedorNombre && (
                  <p className="text-gray-500 text-xs mb-3">
                    Publicado por <span className="font-semibold">{loteSeleccionado.vendedorNombre}</span>
                  </p>
                )}

                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Animales en el lote
                  </p>
                  <ul className="space-y-1 max-h-32 overflow-y-auto pr-1 text-xs">
                    {loteSeleccionado.ganados.map((g: GanadoEnLote) => (
                      <li key={g.id} className="flex justify-between gap-2">
                        <span className="text-gray-800">
                          {g.nombre || g.siniiga} · {g.raza} ({g.peso_kg} kg)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {loteSeleccionado.certificadoBlockchainId && (
                  <p className="text-[10px] text-gray-400 font-mono mb-3">
                    ID blockchain: {loteSeleccionado.certificadoBlockchainId}
                  </p>
                )}

                {loteSeleccionado.reviewsSample && loteSeleccionado.reviewsSample.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Opiniones recientes</p>
                    <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                      {loteSeleccionado.reviewsSample.map((r, index) => (
                        <div key={`${r.buyerName}-${index}`} className="bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Star
                                key={v}
                                className={`h-3 w-3 ${
                                  r.rating >= v ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-800 mb-0.5 line-clamp-2">
                            {r.comment}
                          </p>
                          <p className="text-[10px] text-gray-500">— {r.buyerName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <button
                    onClick={() => {
                      agregarLoteAlCarrito(loteSeleccionado)
                      setLoteSeleccionado(null)
                      setCarritoAbierto(true)
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-cownect-green text-white py-2.5 rounded-xl font-bold text-sm hover:bg-cownect-dark-green"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Agregar lote al carrito
                  </button>
                  <button
                    onClick={() => setLoteSeleccionado(null)}
                    className="w-full text-sm text-gray-600 hover:text-black py-1.5"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <MarketplaceContent />
    </ProtectedRoute>
  )
}

'use client'

import { EstadisticasCompletas } from '@/domain/entities/Estadisticas'
import type { Animal } from '@/domain/entities/Animal'
import { ESTADOS_HEMBRA, ESTADOS_MACHO } from '@/domain/validators/AnimalValidator'

interface EstadisticasPanelProps {
  estadisticas: EstadisticasCompletas
  /** Animales reales del usuario, para desglosar por género y etapa desde la BD */
  animales?: Animal[]
}

export default function EstadisticasPanel({ estadisticas, animales = [] }: EstadisticasPanelProps) {
  const getColorStatus = (valor: number, umbralBajo: number, umbralAlto: number): string => {
    if (valor >= umbralAlto) return 'text-green-600'
    if (valor >= umbralBajo) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBgColorStatus = (valor: number, umbralBajo: number, umbralAlto: number): string => {
    if (valor >= umbralAlto) return 'bg-green-50 border-green-400'
    if (valor >= umbralBajo) return 'bg-yellow-50 border-yellow-400'
    return 'bg-red-50 border-red-400'
  }

  const normalizarEtapa = (estado?: string | null): string | null => {
    if (!estado) return null
    const e = estado.toLowerCase()
    if (e.includes('cría') || e.includes('cria')) return 'Cría'
    if (e.includes('becerra')) return 'Becerra'
    if (e.includes('becerro')) return 'Becerro'
    if (e.includes('destetado')) return 'Destetado'
    if (e.includes('novillo')) return 'Novillo'
    if (e.includes('toro') && e.includes('engorda')) return 'Toro de Engorda'
    if (e.includes('toro') && e.includes('reproductor')) return 'Toro Reproductor'
    if (e.includes('vaca') && (e.includes('orde') || e.includes('ordeña'))) return 'Vaca Ordeña'
    if (e.includes('vaca') && e.includes('seca')) return 'Vaca Seca'
    return null
  }

  // Agrupar animales reales de la BD por sexo + etapa y ordenar de mayor a menor
  const gruposPorSexoYEtapa = (sexo: 'M' | 'H', etapasBase: readonly string[]) => {
    const animalesFiltrados = animales.filter((a) => a.sexo === sexo)
    const conteos: Record<string, number> = {}
    for (const a of animalesFiltrados) {
      const etapa = normalizarEtapa(a.estado)
      if (!etapa) continue
      conteos[etapa] = (conteos[etapa] || 0) + 1
    }
    const items = etapasBase.map((etapa) => ({
      etapa,
      total: conteos[etapa] || 0,
    }))
    items.sort((a, b) => b.total - a.total)
    return items
  }

  // Para las gráficas por género, solo usamos las etapas válidas de cada sexo
  const etapasHembra = gruposPorSexoYEtapa('H', ESTADOS_HEMBRA as readonly string[])
  const etapasMacho = gruposPorSexoYEtapa('M', ESTADOS_MACHO as readonly string[])
  const maxHembra = etapasHembra.reduce((max, e) => Math.max(max, e.total), 0) || 1
  const maxMacho = etapasMacho.reduce((max, e) => Math.max(max, e.total), 0) || 1

  // Para mantener tu grid original de Etapa Productiva, pero ordenado por tamaño
  const etapasOrdenadasGlobal = [
    { label: 'Cría', valor: estadisticas.inventario.conteoPorEtapa.cria },
    { label: 'Becerra', valor: estadisticas.inventario.conteoPorEtapa.becerra },
    { label: 'Becerro', valor: estadisticas.inventario.conteoPorEtapa.becerro },
    { label: 'Destetado', valor: estadisticas.inventario.conteoPorEtapa.destetado },
    { label: 'Novillo', valor: estadisticas.inventario.conteoPorEtapa.novillo },
    { label: 'Toro de Engorda', valor: estadisticas.inventario.conteoPorEtapa.toroEngorda },
    { label: 'Toro Reproductor', valor: estadisticas.inventario.conteoPorEtapa.toroReproductor },
    { label: 'Vaca Ordeña', valor: estadisticas.inventario.conteoPorEtapa.vacaOrdeña },
    { label: 'Vaca Seca', valor: estadisticas.inventario.conteoPorEtapa.vacaSeca },
  ].sort((a, b) => b.valor - a.valor)

  return (
    <div className="space-y-6">
      {/* Resumen de Inventario */}
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-black mb-4">Estado del Hato</h3>
        
        {/* Distribución por Sexo */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-black mb-3">Distribución por Sexo</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
              <p className="text-sm text-gray-700 mb-1">Machos</p>
              <p className="text-3xl font-bold text-black">{estadisticas.inventario.distribucionPorSexo.machos}</p>
              <p className="text-sm text-gray-600">{estadisticas.inventario.distribucionPorSexo.porcentajeMachos.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
              <p className="text-sm text-gray-700 mb-1">Hembras</p>
              <p className="text-3xl font-bold text-black">{estadisticas.inventario.distribucionPorSexo.hembras}</p>
              <p className="text-sm text-gray-600">{estadisticas.inventario.distribucionPorSexo.porcentajeHembras.toFixed(1)}%</p>
            </div>
          </div>

          {/* Barra apilada 100% machos vs hembras (gráfica simple de proporción) */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-blue-500 inline-block"
                style={{ width: `${Math.min(estadisticas.inventario.distribucionPorSexo.porcentajeMachos, 100)}%` }}
              ></div>
              <div
                className="h-3 bg-pink-500 inline-block"
                style={{ width: `${Math.min(estadisticas.inventario.distribucionPorSexo.porcentajeHembras, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Machos</span>
              <span>Hembras</span>
            </div>
          </div>
        </div>

        {/* Etapa Productiva: tus tarjetas, ordenadas de mayor a menor */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-black mb-3">Etapa Productiva</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {etapasOrdenadasGlobal.map((item) => (
              <div key={item.label} className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                <p className="text-xs text-gray-700 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-black">{item.valor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle por género y etapa: mini-gráficas de barras, “aumento” por grupo */}
        {animales.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <h4 className="text-md font-semibold text-black mb-2">Hembras por etapa</h4>
              {etapasHembra.map((item) => (
                <div key={item.etapa} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-700 mb-1">
                    <span>{item.etapa}</span>
                    <span className="font-semibold">{item.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-pink-500"
                      style={{ width: `${item.total === 0 ? 2 : (item.total / maxHembra) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-md font-semibold text-black mb-2">Machos por etapa</h4>
              {etapasMacho.map((item) => (
                <div key={item.etapa} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-700 mb-1">
                    <span>{item.etapa}</span>
                    <span className="font-semibold">{item.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${item.total === 0 ? 2 : (item.total / maxMacho) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estatus del Sistema */}
        <div>
          <h4 className="text-lg font-semibold text-black mb-3">Estatus del Sistema</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
              <p className="text-xs text-gray-700 mb-1">Activo</p>
              <p className="text-2xl font-bold text-black">{estadisticas.inventario.estatusSistema.activo}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
              <p className="text-xs text-gray-700 mb-1">Vendido</p>
              <p className="text-2xl font-bold text-black">{estadisticas.inventario.estatusSistema.vendido}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
              <p className="text-xs text-gray-700 mb-1">Muerto</p>
              <p className="text-2xl font-bold text-black">{estadisticas.inventario.estatusSistema.muerto}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
              <p className="text-xs text-gray-700 mb-1">Robado</p>
              <p className="text-2xl font-bold text-black">{estadisticas.inventario.estatusSistema.robado}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Sanitario */}
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-black mb-4">Control Sanitario</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-lg p-4 border-2 ${getBgColorStatus(estadisticas.sanitarias.coberturaVacunacion, 70, 90)}`}>
            <p className="text-sm text-gray-600 mb-1">Cobertura de Vacunación</p>
            <p className={`text-3xl font-bold ${getColorStatus(estadisticas.sanitarias.coberturaVacunacion, 70, 90)}`}>
              {estadisticas.sanitarias.coberturaVacunacion.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Últimos 6 meses</p>
          </div>

          <div className={`rounded-lg p-4 border-2 ${estadisticas.sanitarias.alertasSanitarias > 0 ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}>
            <p className="text-sm text-gray-600 mb-1">Alertas Sanitarias</p>
            <p className={`text-3xl font-bold ${estadisticas.sanitarias.alertasSanitarias > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {estadisticas.sanitarias.alertasSanitarias}
            </p>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </div>

          <div className={`rounded-lg p-4 border-2 ${getBgColorStatus(estadisticas.sanitarias.tasaMortalidad, 2, 5)}`}>
            <p className="text-sm text-gray-600 mb-1">Tasa de Mortalidad</p>
            <p className={`text-3xl font-bold ${getColorStatus(estadisticas.sanitarias.tasaMortalidad, 2, 5)}`}>
              {estadisticas.sanitarias.tasaMortalidad.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
          </div>
        </div>
      </div>

      {/* Reproducción */}
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-black mb-4">Reproducción y Genealogía</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
            <p className="text-sm text-gray-700 mb-1">Tasa de Natalidad</p>
            <p className="text-3xl font-bold text-black">{estadisticas.reproduccion.tasaNatalidad}</p>
            <p className="text-xs text-gray-600 mt-1">Nacimientos (último trimestre)</p>
          </div>

          <div className={`rounded-lg p-4 border-2 ${getBgColorStatus(estadisticas.reproduccion.exitoDestete, 70, 85)}`}>
            <p className="text-sm text-gray-600 mb-1">Éxito de Destete</p>
            <p className={`text-3xl font-bold ${getColorStatus(estadisticas.reproduccion.exitoDestete, 70, 85)}`}>
              {estadisticas.reproduccion.exitoDestete.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Crías destetadas exitosamente</p>
          </div>
        </div>
      </div>

      {/* Infraestructura */}
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-black mb-4">Eficiencia de Infraestructura</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 border-2 ${estadisticas.infraestructura.cargaAnimal.maxima == null ? 'bg-green-50 border-green-400' : getBgColorStatus(estadisticas.infraestructura.ocupacionGeneral, 70, 90)}`}>
            <p className="text-sm text-gray-600 mb-1">Carga Animal</p>
            <p className="text-2xl font-bold text-black">
              {estadisticas.infraestructura.cargaAnimal.actual} / {estadisticas.infraestructura.cargaAnimal.maxima == null ? 'Ilimitado' : estadisticas.infraestructura.cargaAnimal.maxima}
            </p>
            {estadisticas.infraestructura.cargaAnimal.maxima != null ? (
              <>
                <p className={`text-xl font-semibold ${getColorStatus(estadisticas.infraestructura.ocupacionGeneral, 70, 90)} mt-2`}>
                  {estadisticas.infraestructura.ocupacionGeneral.toFixed(1)}% Ocupación
                </p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      estadisticas.infraestructura.ocupacionGeneral >= 90
                        ? 'bg-red-500'
                        : estadisticas.infraestructura.ocupacionGeneral >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(estadisticas.infraestructura.ocupacionGeneral, 100)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <p className="text-xl font-semibold text-green-600 mt-2">Plan Premium: capacidad ilimitada</p>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
            <p className="text-sm text-gray-700 mb-1">Capacidad Máxima</p>
            <p className="text-3xl font-bold text-black">{estadisticas.infraestructura.cargaAnimal.maxima == null ? 'Ilimitado' : estadisticas.infraestructura.cargaAnimal.maxima}</p>
            <p className="text-xs text-gray-600 mt-1">{estadisticas.infraestructura.cargaAnimal.maxima == null ? 'Plan Premium' : 'Animales recomendados'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


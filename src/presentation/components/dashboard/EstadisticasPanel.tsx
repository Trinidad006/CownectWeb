'use client'

import { EstadisticasCompletas } from '@/domain/entities/Estadisticas'

interface EstadisticasPanelProps {
  estadisticas: EstadisticasCompletas
}

export default function EstadisticasPanel({ estadisticas }: EstadisticasPanelProps) {
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
        </div>

        {/* Etapa Productiva */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-black mb-3">Etapa Productiva</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Cría', valor: estadisticas.inventario.conteoPorEtapa.cria },
              { label: 'Becerra', valor: estadisticas.inventario.conteoPorEtapa.becerra },
              { label: 'Becerro', valor: estadisticas.inventario.conteoPorEtapa.becerro },
              { label: 'Destetado', valor: estadisticas.inventario.conteoPorEtapa.destetado },
              { label: 'Novillo', valor: estadisticas.inventario.conteoPorEtapa.novillo },
              { label: 'Toro de Engorda', valor: estadisticas.inventario.conteoPorEtapa.toroEngorda },
              { label: 'Toro Reproductor', valor: estadisticas.inventario.conteoPorEtapa.toroReproductor },
              { label: 'Vaca Ordeña', valor: estadisticas.inventario.conteoPorEtapa.vacaOrdeña },
              { label: 'Vaca Seca', valor: estadisticas.inventario.conteoPorEtapa.vacaSeca },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                <p className="text-xs text-gray-700 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-black">{item.valor}</p>
              </div>
            ))}
          </div>
        </div>

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
          <div className={`rounded-lg p-4 border-2 ${getBgColorStatus(estadisticas.infraestructura.ocupacionGeneral, 70, 90)}`}>
            <p className="text-sm text-gray-600 mb-1">Carga Animal</p>
            <p className="text-2xl font-bold text-black">
              {estadisticas.infraestructura.cargaAnimal.actual} / {estadisticas.infraestructura.cargaAnimal.maxima}
            </p>
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
          </div>

          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
            <p className="text-sm text-gray-700 mb-1">Capacidad Máxima</p>
            <p className="text-3xl font-bold text-black">{estadisticas.infraestructura.cargaAnimal.maxima}</p>
            <p className="text-xs text-gray-600 mt-1">Animales recomendados</p>
          </div>
        </div>
      </div>
    </div>
  )
}


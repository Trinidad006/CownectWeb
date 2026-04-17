'use client'

import { useState, useRef } from 'react'

interface PesosChartProps {
  pesos: { peso: number; fecha_registro: string }[]
  className?: string
}

export default function PesosChart({ pesos, className = '' }: PesosChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; showBelow?: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (!pesos || pesos.length === 0) {
    return (
      <div className={`text-gray-500 text-sm italic py-8 text-center ${className}`}>
        No hay registros de peso para graficar
      </div>
    )
  }

  // Ordenar por fecha ascendente para el gráfico
  const ordenados = [...pesos].sort(
    (a, b) => new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
  )
  const valores = ordenados.map((p) => parseFloat(String(p.peso)))
  const minPeso = Math.min(...valores)
  const maxPeso = Math.max(...valores)
  const rango = maxPeso - minPeso || 1
  const padding = 30
  const width = 600
  const height = 240

  const puntosData = ordenados.map((p, i) => {
    const x = padding + (i / Math.max(ordenados.length - 1, 1)) * (width - 2 * padding)
    const valor = parseFloat(String(p.peso))
    const y = height - padding - ((valor - minPeso) / rango) * (height - 2 * padding)
    return { x, y, peso: valor, fecha: p.fecha_registro }
  })

  const puntos = puntosData.map((p) => `${p.x},${p.y}`)
  const pathData = puntos.length > 1 ? `M ${puntos.join(' L ')}` : ''

  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return fecha
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    // Usar setTimeout para asegurar que el DOM esté actualizado
    setTimeout(() => updateTooltipPosition(index), 0)
  }

  const handleMouseMove = (index: number) => {
    updateTooltipPosition(index)
  }

  const updateTooltipPosition = (index: number) => {
    if (!svgRef.current || !containerRef.current) return
    
    const svg = svgRef.current
    const container = containerRef.current
    
    const svgRect = svg.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // Calcular la escala del SVG considerando preserveAspectRatio
    const viewBox = svg.viewBox.baseVal
    const viewBoxAspect = viewBox.width / viewBox.height
    const svgAspect = svgRect.width / svgRect.height
    
    let scaleX: number
    let scaleY: number
    let offsetX = 0
    let offsetY = 0
    
    if (viewBoxAspect > svgAspect) {
      // El SVG está limitado por el ancho
      scaleX = svgRect.width / viewBox.width
      scaleY = scaleX
      offsetY = (svgRect.height - viewBox.height * scaleY) / 2
    } else {
      // El SVG está limitado por la altura
      scaleY = svgRect.height / viewBox.height
      scaleX = scaleY
      offsetX = (svgRect.width - viewBox.width * scaleX) / 2
    }
    
    // Calcular posición del punto en coordenadas del contenedor
    const puntoXEnSVG = puntosData[index].x
    const puntoYEnSVG = puntosData[index].y
    
    // Convertir coordenadas del viewBox a píxeles relativos al contenedor
    let x = offsetX + puntoXEnSVG * scaleX
    let y = offsetY + puntoYEnSVG * scaleY
    
    // Estimar tamaño del tooltip (aproximadamente 120px de ancho, 60px de alto)
    const tooltipWidth = 120
    const tooltipHeight = 60
    const margin = 10
    
    // Ajustar posición horizontal si se sale de los bordes
    if (x - tooltipWidth / 2 < margin) {
      x = tooltipWidth / 2 + margin
    } else if (x + tooltipWidth / 2 > containerRect.width - margin) {
      x = containerRect.width - tooltipWidth / 2 - margin
    }
    
    // Ajustar posición vertical: si hay poco espacio arriba, mostrar abajo
    const espacioArriba = y
    const espacioAbajo = containerRect.height - y
    const showBelow = espacioArriba < tooltipHeight + margin && espacioAbajo > tooltipHeight + margin
    
    if (showBelow) {
      // Mostrar abajo del punto
      y = y + 20
    } else {
      // Mostrar arriba del punto (por defecto)
      y = y - 15
    }
    
    setTooltipPosition({ x, y, showBelow })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltipPosition(null)
  }

  return (
    <div className={`relative ${className}`}>
      <p className="text-sm font-semibold text-gray-700 mb-2">Evolución del peso (kg)</p>
      <div ref={containerRef} className="relative w-full">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-64" preserveAspectRatio="xMidYMid meet">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#15803d"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {puntosData.map((punto, index) => (
            <g key={index}>
              {/* Círculo invisible grande para área de hover más fácil */}
              <circle
                cx={punto.x}
                cy={punto.y}
                r={15}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseMove={() => handleMouseMove(index)}
                onMouseLeave={handleMouseLeave}
              />
              {/* Círculo visible del punto */}
              <circle
                cx={punto.x}
                cy={punto.y}
                r={hoveredIndex === index ? 8 : 7}
                fill="#15803d"
                stroke="white"
                strokeWidth={hoveredIndex === index ? 3 : 2}
                className="cursor-pointer transition-all pointer-events-none"
              />
            </g>
          ))}
        </svg>
        {hoveredIndex !== null && tooltipPosition !== null && (
          <div
            className="absolute bg-gray-900 text-white text-sm rounded-lg px-4 py-2 shadow-2xl z-[9999] pointer-events-none whitespace-nowrap"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: tooltipPosition.showBelow 
                ? 'translate(-50%, 0)' 
                : 'translate(-50%, -100%)',
            }}
          >
            {tooltipPosition.showBelow && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-gray-900"></div>
            )}
            <div className="font-semibold mb-1 text-white">{formatearFecha(puntosData[hoveredIndex].fecha)}</div>
            <div className="text-cownect-green font-bold text-base">{puntosData[hoveredIndex].peso.toFixed(1)} kg</div>
            {!tooltipPosition.showBelow && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{ordenados[0]?.fecha_registro ? formatearFecha(ordenados[0].fecha_registro) : ''}</span>
        <span>{ordenados[ordenados.length - 1]?.fecha_registro ? formatearFecha(ordenados[ordenados.length - 1].fecha_registro) : ''}</span>
      </div>
    </div>
  )
}

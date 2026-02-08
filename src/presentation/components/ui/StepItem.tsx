'use client'

import { useState } from 'react'
import BackButton from './BackButton'

interface StepItemProps {
  number: number
  title: string
  description: string
  details: string
}

export default function StepItem({ number, title, description, details }: StepItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <div 
        className="flex flex-col items-center text-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl p-6 rounded-lg border-2 border-transparent hover:border-cownect-green"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowDetails(true)}
      >
        <div className={`w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${isHovered ? 'bg-cownect-green scale-110' : ''}`}>
          <span className="text-white text-2xl font-bold">{number}</span>
        </div>
        <h3 className={`text-xl font-bold text-black mb-2 transition-colors duration-300 ${isHovered ? 'text-cownect-green' : ''}`}>
          {title}
        </h3>
        <p className="text-gray-700">{description}</p>
        {isHovered && (
          <div className="mt-4 text-cownect-green font-semibold text-sm animate-pulse">
            Haz clic para más detalles →
          </div>
        )}
      </div>

      {/* Modal con detalles */}
      {showDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full transform transition-all duration-300 animate-slideUp relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <BackButton onClick={() => setShowDetails(false)} inline />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-cownect-green rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{number}</span>
                </div>
                <h3 className="text-2xl font-bold text-black">{title}</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 text-lg mb-4">{description}</p>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <h4 className="text-xl font-bold text-black mb-3">Más Información:</h4>
                <p className="text-gray-700 text-base leading-relaxed">{details}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}


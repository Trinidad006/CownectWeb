'use client'

import { useEffect, useState, useRef } from 'react'
import HeaderSection from '../components/sections/HeaderSection'
import LandingHeader from '../components/layouts/LandingHeader'
import HowItWorksSection from '../components/sections/HowItWorksSection'
import PlansSection from '../components/sections/PlansSection'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const howItWorksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      setMounted(true)
    } catch (err) {
      console.error('Error al montar LandingPage:', err)
      setError('Error al cargar la página')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (howItWorksRef.current) {
        const rect = howItWorksRef.current.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight * 0.9
        if (isVisible && !showHowItWorks) {
          setShowHowItWorks(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showHowItWorks])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-xl font-bold mb-2">Error</div>
          <div className="text-gray-700">{error}</div>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <div className="text-gray-700">Cargando...</div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/ganado_fondo.jpg)' }}>
        {/* Overlay oscuro para oscurecer el fondo */}
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        <div className="relative z-10">
          {/* Header con navegación */}
          <LandingHeader />
          
          {/* Tarjeta principal de vidrio */}
          <HeaderSection />
          
          {/* Cómo funciona - Oculto inicialmente, aparece con animación al hacer scroll */}
          <div 
            ref={howItWorksRef}
            className={`container mx-auto px-4 py-8 max-w-7xl transition-all duration-1000 ease-out ${
              showHowItWorks 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10'
            }`}
            style={{ visibility: showHowItWorks ? 'visible' : 'hidden' }}
          >
            <HowItWorksSection />
          </div>
          
          {/* Planes */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100">
            <PlansSection />
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Error al renderizar LandingPage:', err)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-xl font-bold mb-2">Error al renderizar</div>
          <div className="text-gray-700">Por favor recarga la página</div>
        </div>
      </div>
    )
  }
}


'use client'

import { useEffect, useState } from 'react'
import HeaderSection from '../components/sections/HeaderSection'
import FeaturesSection from '../components/sections/FeaturesSection'
import BenefitsSection from '../components/sections/BenefitsSection'
import HowItWorksSection from '../components/sections/HowItWorksSection'
import FooterSection from '../components/sections/FooterSection'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setMounted(true)
    } catch (err) {
      console.error('Error al montar LandingPage:', err)
      setError('Error al cargar la página')
    }
  }, [])

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
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        {/* Overlay oscuro para oscurecer el fondo */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          <HeaderSection />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <FeaturesSection />
            <BenefitsSection />
          </div>
          <HowItWorksSection />
          <FooterSection />
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


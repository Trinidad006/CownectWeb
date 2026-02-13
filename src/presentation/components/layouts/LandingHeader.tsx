'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '../ui/Logo'
import Button from '../ui/Button'
import { ChevronDown } from 'lucide-react'

const features = [
  {
    icon: 'cow',
    title: 'Gestión Integral',
    description: 'Registre y administre todo su inventario ganadero desde una única plataforma centralizada'
  },
  {
    icon: 'alert',
    title: 'Sistema de Alertas',
    description: 'Notificaciones automáticas para el control de vacunaciones y tratamientos veterinarios'
  },
  {
    icon: 'device',
    title: 'Acceso Multiplataforma',
    description: 'Disponible en dispositivos móviles y de escritorio para acceso en cualquier momento y lugar'
  },
  {
    icon: 'scale',
    title: 'Control de Peso',
    description: 'Registro y seguimiento del peso de sus animales con gráficos de evolución histórica'
  },
  {
    icon: 'syringe',
    title: 'Gestión de Vacunas',
    description: 'Registro completo del historial de vacunaciones con fechas de aplicación y próximas dosis'
  },
  {
    icon: 'document',
    title: 'Historial de Tratamientos',
    description: 'Documentación completa de tratamientos veterinarios y condiciones médicas de cada animal'
  },
  {
    icon: 'marketplace',
    title: 'Marketplace Ganadero',
    description: 'Plataforma de comercio para compra y venta de productos y servicios relacionados con la ganadería'
  },
  {
    icon: 'chart',
    title: 'Reportes y Estadísticas',
    description: 'Dashboard con métricas e indicadores clave para la toma de decisiones informadas'
  }
]

const benefits = [
  {
    icon: 'shield',
    title: 'Seguridad de Datos',
    description: 'Sus datos están protegidos con encriptación y respaldos automáticos'
  },
  {
    icon: 'clock',
    title: 'Ahorro de Tiempo',
    description: 'Automatice procesos y reduzca el tiempo de gestión administrativa'
  },
  {
    icon: 'users',
    title: 'Gestión Colaborativa',
    description: 'Trabaje en equipo con acceso controlado para múltiples usuarios'
  },
  {
    icon: 'chart',
    title: 'Análisis de Datos',
    description: 'Obtenga insights valiosos para mejorar la productividad de su explotación'
  }
]

export default function LandingHeader() {
  const [showFeatures, setShowFeatures] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)

  return (
    <header className="relative z-50 w-full">
      {/* Overlay oscuro cuando se abren los dropdowns */}
      {(showFeatures || showBenefits) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      )}
      
      <nav className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between relative z-50 max-w-7xl">
        {/* Logo y marca */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex-shrink-0">
            <Logo />
          </div>
          <span className="text-white font-bold text-lg md:text-xl lg:text-2xl tracking-tight whitespace-nowrap">Cownect</span>
        </div>
        
        {/* Navegación central */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
          <div 
            className="relative z-50"
            onMouseEnter={() => setShowFeatures(true)}
            onMouseLeave={() => setShowFeatures(false)}
          >
            <button className={`flex items-center gap-1.5 font-semibold text-sm md:text-base px-4 py-2.5 rounded-lg transition-all duration-200 ${
              showFeatures 
                ? 'bg-cownect-dark-green text-cownect-green shadow-lg border border-cownect-green/50' 
                : 'bg-transparent text-white hover:text-cownect-green'
            }`}>
              Funcionalidades
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFeatures ? 'rotate-180' : ''}`} />
            </button>
            {showFeatures && (
              <div className="absolute top-full left-0 mt-2 w-[420px] bg-black/95 backdrop-blur-lg border-2 border-cownect-green/40 rounded-xl shadow-2xl p-5 grid grid-cols-1 gap-3 animate-fadeIn z-50">
                {features.map((feature, index) => (
                  <div key={index} className="p-4 rounded-lg hover:bg-cownect-green/20 transition-all border border-white/10 hover:border-cownect-green/50 last:border-b-0">
                    <p className="text-white font-bold text-sm mb-1">{feature.title}</p>
                    <p className="text-white/75 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div 
            className="relative z-50"
            onMouseEnter={() => setShowBenefits(true)}
            onMouseLeave={() => setShowBenefits(false)}
          >
            <button className={`flex items-center gap-1.5 font-semibold text-sm md:text-base px-4 py-2.5 rounded-lg transition-all duration-200 ${
              showBenefits 
                ? 'bg-cownect-dark-green text-cownect-green shadow-lg border border-cownect-green/50' 
                : 'bg-transparent text-white hover:text-cownect-green'
            }`}>
              Beneficios
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showBenefits ? 'rotate-180' : ''}`} />
            </button>
            {showBenefits && (
              <div className="absolute top-full left-0 mt-2 w-[420px] bg-black/95 backdrop-blur-lg border-2 border-cownect-green/40 rounded-xl shadow-2xl p-5 grid grid-cols-1 gap-3 animate-fadeIn z-50">
                {benefits.map((benefit, index) => (
                  <div key={index} className="p-4 rounded-lg hover:bg-cownect-green/20 transition-all border border-white/10 hover:border-cownect-green/50 last:border-b-0">
                    <p className="text-white font-bold text-sm mb-1">{benefit.title}</p>
                    <p className="text-white/75 text-xs leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="secondary" href="/login" className="hidden md:inline-flex text-sm px-4 py-2 min-w-[120px]">
            Iniciar Sesión
          </Button>
          <Button variant="primary" href="/register" className="hidden md:inline-flex text-sm px-4 py-2 min-w-[120px]">
            Empezar
          </Button>
        </div>
      </nav>
    </header>
  )
}


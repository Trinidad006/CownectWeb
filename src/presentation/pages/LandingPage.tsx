import HeaderSection from '../components/sections/HeaderSection'
import FeaturesSection from '../components/sections/FeaturesSection'
import BenefitsSection from '../components/sections/BenefitsSection'
import HowItWorksSection from '../components/sections/HowItWorksSection'
import FooterSection from '../components/sections/FooterSection'

export default function LandingPage() {
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
}


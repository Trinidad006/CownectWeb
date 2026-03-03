import FeatureItem from '../ui/FeatureItem'

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

export default function BenefitsSection() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-black text-center mb-4 pb-2 border-b border-gray-300">
        Beneficios del Sistema
      </h2>
      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <FeatureItem
            key={index}
            icon={benefit.icon}
            title={benefit.title}
            description={benefit.description}
          />
        ))}
      </div>
    </div>
  )
}


import FeatureItem from '../ui/FeatureItem'

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

export default function FeaturesSection() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-black text-center mb-4 pb-2 border-b border-gray-300">
        Funcionalidades del Sistema
      </h2>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <FeatureItem
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  )
}


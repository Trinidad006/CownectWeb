import StepItem from '../ui/StepItem'

const steps = [
  {
    number: 1,
    title: 'Regístrese',
    description: 'Complete el formulario con sus datos personales para crear su cuenta de acceso',
    details: 'El proceso de registro es rápido y sencillo. Solo necesitas proporcionar tu información básica como nombre, apellido, correo electrónico y teléfono. Una vez completado el registro, recibirás un correo de confirmación y podrás acceder inmediatamente a todas las funcionalidades del sistema.'
  },
  {
    number: 2,
    title: 'Configure su Explotación',
    description: 'Registre sus animales y configure los parámetros de su explotación ganadera',
    details: 'Comienza registrando cada uno de tus animales con información detallada como nombre, número de identificación, especie, raza, fecha de nacimiento y sexo. Puedes configurar parámetros específicos de tu explotación como tipos de vacunas, tratamientos comunes y seguimiento de pesos. El sistema te guiará paso a paso para que no olvides ningún dato importante.'
  },
  {
    number: 3,
    title: 'Gestione y Optimice',
    description: 'Utilice las herramientas del sistema para gestionar y optimizar su producción',
    details: 'Una vez configurado, podrás gestionar todos los aspectos de tu ganadería desde un solo lugar. Registra vacunaciones, controla el peso de tus animales, lleva un historial médico completo y utiliza el marketplace para comprar o vender ganado. El sistema te enviará alertas automáticas para vacunaciones pendientes y te proporcionará reportes detallados para tomar decisiones informadas.'
  }
]

export default function HowItWorksSection() {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border-2 border-white/30">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ¿Cómo Funciona?
        </h2>
        <div className="w-24 h-1 bg-cownect-green mx-auto rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {steps.map((step) => (
          <StepItem
            key={step.number}
            number={step.number}
            title={step.title}
            description={step.description}
            details={step.details}
          />
        ))}
      </div>
    </div>
  )
}


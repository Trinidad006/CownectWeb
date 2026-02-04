import Logo from '../ui/Logo'
import Button from '../ui/Button'

export default function HeaderSection() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
      <div className="flex flex-col items-center text-center">
        <Logo />
        <h1 className="text-5xl font-serif font-bold text-black mt-4 mb-2">
          Cownect
        </h1>
        <h2 className="text-xl font-bold text-black mb-4">
          Sistema de Gestión Ganadera
        </h2>
        <p className="text-black max-w-2xl mb-6 text-base leading-relaxed">
          Plataforma profesional para la gestión integral de su explotación ganadera. 
          Registre animales, controle vacunaciones, gestione pesos y optimice su producción.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" href="/register">
            Registrarse Ahora →
          </Button>
          <Button variant="secondary" href="/login">
            Ya tengo cuenta
          </Button>
        </div>
      </div>
    </div>
  )
}


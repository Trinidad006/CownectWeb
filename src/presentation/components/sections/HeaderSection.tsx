import Logo from '../ui/Logo'
import Button from '../ui/Button'

export default function HeaderSection() {
  return (
    <div className="bg-transparent min-h-[85vh] flex items-center justify-center py-12">
      <div className="container mx-auto max-w-5xl px-4 w-full">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 md:p-16 lg:p-20 border-2 border-white/30 transition-all duration-300 ease-in-out hover:shadow-3xl hover:border-white/50">
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            <div className="mb-4 w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden bg-transparent flex items-center justify-center mx-auto">
              <img
                src="/images/logo_blanco.jpeg"
                alt="Cownect Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight tracking-tight">
              Cownect
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl leading-relaxed">
              Herramienta para la gestión integral de su explotación ganadera
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="primary" href="/register" className="min-w-[200px]">
                Comenzar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


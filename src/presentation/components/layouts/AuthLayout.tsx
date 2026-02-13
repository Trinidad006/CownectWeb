import Link from 'next/link'
import Logo from '../ui/Logo'
import BackButton from '../ui/BackButton'

interface AuthLayoutProps {
  title: string
  subtitle: string
  footerText: string
  footerLinkText: string
  footerLinkHref: string
  children: React.ReactNode
}

export default function AuthLayout({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
  children
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center px-4 py-8" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      {/* Overlay oscuro para oscurecer el fondo */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Botón de retroceso */}
      <BackButton href="/" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Logo y título */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
              <Logo />
            </div>
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">
              Cownect
            </h1>
            <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
            <p className="text-gray-700 text-base text-center">{subtitle}</p>
          </div>

          {/* Formulario */}
          {children}

          {/* Footer con enlace */}
          <div className="mt-6 text-center">
            <p className="text-gray-700 text-base">
              {footerText}{' '}
              <Link href={footerLinkHref} className="text-cownect-green font-bold hover:underline text-lg">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


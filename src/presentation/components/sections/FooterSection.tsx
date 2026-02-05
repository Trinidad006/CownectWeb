'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { checkAuthentication } from '@/infrastructure/utils/auth'

export default function FooterSection() {
  const router = useRouter()

  const handleAccessSystem = async (e: React.MouseEvent) => {
    e.preventDefault()
    const { isAuthenticated } = await checkAuthentication()
    
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
        <div>
          <h3 className="text-xl font-bold text-black mb-2">Cownect</h3>
          <p className="text-gray-700">
            Sistema profesional de gestión ganadera para optimizar su explotación
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-black mb-2">Enlaces Rápidos</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/login" className="text-gray-700 hover:text-black">
                Iniciar Sesión
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-gray-700 hover:text-black">
                Registrarse
              </Link>
            </li>
            <li>
              <a 
                href="#" 
                onClick={handleAccessSystem}
                className="text-gray-700 hover:text-black cursor-pointer"
              >
                Acceder al Sistema
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold text-black mb-2">Contacto</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <a href="mailto:soporte@cownect.com" className="text-gray-700 hover:text-black">
                soporte@cownect.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2127 21.3522 21.3978C21.1472 21.5828 20.9053 21.7201 20.6441 21.8002C20.3829 21.8803 20.1086 21.9013 19.84 21.862C16.7433 21.4947 13.787 20.3691 11.19 18.58C8.77382 16.8928 6.72533 14.6242 5.19 12C3.36907 9.22219 2.17349 6.06628 1.7 2.8C1.65869 2.53078 1.67888 2.25575 1.7589 1.99422C1.83892 1.73269 1.97645 1.49099 2.16157 1.28649C2.34669 1.08199 2.57501 0.919423 2.83102 0.809192C3.08703 0.698961 3.36475 0.643494 3.645 0.646H6.645C7.16557 0.644859 7.66812 0.831332 8.06073 1.17278C8.45334 1.51422 8.71028 1.98888 8.785 2.5C8.92979 3.48631 9.20839 4.45019 9.613 5.365C9.81678 5.84109 9.88101 6.36217 9.79853 6.87095C9.71605 7.37973 9.49014 7.85734 9.145 8.255L7.545 9.855C9.40589 12.7239 11.9961 15.3141 14.865 16.175L16.465 14.575C16.8627 14.2299 17.3403 14.0039 17.8491 13.9215C18.3578 13.839 18.8789 13.9032 19.355 14.107C20.2698 14.5116 21.2337 14.7902 22.22 14.935C22.7315 15.0099 23.2063 15.2669 23.5478 15.6596C23.8892 16.0522 24.0757 16.5548 24.075 17.075L22.075 17.075H22.08L22 16.92Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <a href="tel:+573001234567" className="text-gray-700 hover:text-black">
                +57 300 123 4567
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-300 pt-6">
        <p className="text-center text-gray-600">
          © 2024 Cownect. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}


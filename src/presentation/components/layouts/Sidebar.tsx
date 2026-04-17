'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Settings, 
  MapPin, 
  Milk, 
  CheckSquare, 
  Award, 
  Users,
  UserCog,
  ChevronRight,
  Search,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/presentation/hooks/useAuth'

interface SidebarProps {
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth(false)

  const isPremium = user?.plan === 'premium' || user?.suscripcion_activa

  type MenuItem = {
    name: string
    icon: React.ReactNode
    path: string
    /** Si true, no se muestra en sesión de trabajador (solo el dueño gestiona trabajadores). */
    hideIfWorker?: boolean
  }

  const menuItems: Array<{
    label: string
    show?: boolean
    items: MenuItem[]
  }> = [
    {
      label: 'General',
      items: [
        {
          name: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          path: '/dashboard',
        },
        {
          name: 'Gestion',
          icon: <Settings className="w-5 h-5" />,
          path: '/dashboard/gestion',
        }
      ]
    },
    {
      label: 'Red Ganadera',
      show: isPremium,
      items: [
        {
          name: 'Ganaderos',
          icon: <Search className="w-5 h-5" />,
          path: '/ranchos',
        },
        {
          name: 'Solicitudes de Compra',
          icon: <MessageSquare className="w-5 h-5" />,
          path: '/buy-requests',
        }
      ]
    },
    {
      label: 'Funciones Especiales',
      show: isPremium,
      items: [
        {
          name: 'Certificado Cownect',
          icon: <Award className="w-5 h-5" />,
          path: '/dashboard/certificado',
        },
        {
          name: 'Empleados (Kiosko)',
          icon: <Users className="w-5 h-5" />,
          path: '/dashboard/empleados',
        },
        {
          name: 'Trabajadores',
          icon: <UserCog className="w-5 h-5" />,
          path: '/dashboard/trabajadores',
          hideIfWorker: true,
        },
        {
          name: 'Sistema de Tareas',
          icon: <CheckSquare className="w-5 h-5" />,
          path: '/dashboard/tareas',
        },
        {
          name: 'Produccion',
          icon: <Milk className="w-5 h-5" />,
          path: '/dashboard/produccion',
        },
        {
          name: 'Multiples Ranchos',
          icon: <MapPin className="w-5 h-5" />,
          path: '/dashboard/ranchos',
        }
      ]
    }
  ]

  const isActive = (path: string) => pathname === path

  return (
    <aside className={`bg-white border-r-2 border-cownect-green/20 h-screen sticky top-0 flex flex-col transition-all duration-300 ${className}`}>
      <div className="p-6 border-b border-cownect-green/10">
        <h2 className="text-xl font-bold text-cownect-dark-green flex items-center gap-2">
          Cownect Menu
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-4">
        {menuItems.map((section, idx) => (
          (section.show !== false) && (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items
                  .filter((item) => !item.hideIfWorker || !user?.es_sesion_trabajador)
                  .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                      isActive(item.path)
                        ? 'bg-cownect-green text-white shadow-md'
                        : 'text-gray-600 hover:bg-cownect-green/5 hover:text-cownect-green'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-cownect-green'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isActive(item.path) && <ChevronRight className="w-4 h-4 text-white/70" />}
                  </button>
                ))}
              </div>
            </div>
          )
        ))}
      </nav>

      <div className="p-4 border-t border-cownect-green/10 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-cownect-green/20 flex items-center justify-center text-cownect-dark-green font-bold text-xs uppercase">
            {user?.nombre?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-gray-900">
            <p className="text-sm font-semibold truncate">{user?.nombre || 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.plan || 'Basico'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

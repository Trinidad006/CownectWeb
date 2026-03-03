/// <reference types="@testing-library/jest-dom" />

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}))

const mockUseAuth = jest.fn()
jest.mock('@/presentation/hooks/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

jest.mock('@/presentation/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/infrastructure/services/firestoreService', () => ({
  firestoreService: {
    getAnimalesByUser: jest.fn().mockResolvedValue([]),
    getVacunacionesByUser: jest.fn().mockResolvedValue([]),
    getPesosByUser: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn() }))
jest.mock('@/infrastructure/config/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  getFirebaseDb: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}))

describe('TC-PAY-04: DashboardHeader / Vista Dashboard según plan', () => {
  const baseUser = {
    id: 'user-1',
    email: 'test@cownect.com',
    nombre: 'Test',
    apellido: 'Usuario',
    rancho_hectareas: 100,
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      checkAuth: jest.fn(),
    })
  })

  it('Caso Freemium: muestra el botón "Ver Planes" cuando el usuario tiene plan gratuito', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...baseUser, plan: 'gratuito' as const, suscripcion_activa: false },
      loading: false,
      checkAuth: jest.fn(),
    })

    const DashboardPage = require('@/presentation/pages/DashboardPage').default
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/ver planes/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/ver planes/i)).toBeVisible()
  })

  it('Caso Premium: NO muestra el botón "Ver Planes" cuando el usuario tiene plan premium', async () => {
    mockUseAuth.mockReturnValue({
      user: { ...baseUser, plan: 'premium' as const, suscripcion_activa: true },
      loading: false,
      checkAuth: jest.fn(),
    })

    const DashboardPage = require('@/presentation/pages/DashboardPage').default
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Accesos Rápidos')).toBeInTheDocument()
    })
    expect(screen.queryByText(/ver planes/i)).not.toBeInTheDocument()
  })
})

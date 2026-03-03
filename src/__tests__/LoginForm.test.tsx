/// <reference types="@testing-library/jest-dom" />

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}))

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}))

jest.mock('@/infrastructure/config/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  getFirebaseDb: jest.fn(),
}))

describe('TC-AUTH-07', () => {
  it('deshabilita el botón "Ingresar" si el email no contiene @', async () => {
    // Import después de los mocks para evitar cargar Firebase real (TextDecoder/undici)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LoginForm = require('../presentation/components/forms/LoginForm').default
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'correo-invalido.com' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ingresar/i })).toBeDisabled()
    })
  })
})


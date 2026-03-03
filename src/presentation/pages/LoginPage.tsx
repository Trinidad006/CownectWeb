'use client'

import { Suspense } from 'react'
import AuthLayout from '../components/layouts/AuthLayout'
import LoginForm from '../components/forms/LoginForm'

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AuthLayout
        title="Iniciar Sesión"
        subtitle="Ingrese sus credenciales para acceder a su cuenta"
        footerText="¿No tienes una cuenta?"
        footerLinkText="Registrarse"
        footerLinkHref="/register"
      >
        <LoginFormWrapper />
      </AuthLayout>
    </Suspense>
  )
}

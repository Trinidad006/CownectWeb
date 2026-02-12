import { Suspense } from 'react'
import AuthLayout from '../components/layouts/AuthLayout'
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm'

function ForgotPasswordFormWrapper() {
  return <ForgotPasswordForm />
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AuthLayout
        title="Recuperar Contraseña"
        subtitle="Te ayudaremos a restablecer tu contraseña"
        footerText="¿Ya tienes una cuenta?"
        footerLinkText="Iniciar Sesión"
        footerLinkHref="/login"
      >
        <ForgotPasswordFormWrapper />
      </AuthLayout>
    </Suspense>
  )
}


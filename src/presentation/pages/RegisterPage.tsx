import AuthLayout from '../components/layouts/AuthLayout'
import RegisterForm from '../components/forms/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Complete el formulario para registrarse en Cownect"
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar Sesión"
      footerLinkHref="/login"
    >
      <RegisterForm />
    </AuthLayout>
  )
}


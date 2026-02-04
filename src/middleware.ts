import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Rutas protegidas que requieren autenticación
  const protectedPaths = ['/dashboard']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Verificar si hay token de sesión en las cookies
  const accessToken = req.cookies.get('sb-rovlcrdgjinpfudyoovg-auth-token')?.value
  const hasSession = !!accessToken

  // Si intenta acceder a una ruta protegida sin sesión, redirigir al login
  if (isProtectedPath && !hasSession) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}


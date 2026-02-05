import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Las rutas protegidas verifican la sesión en el cliente (ProtectedRoute + Firebase Auth).
// El middleware solo redirige; la validación real de Firebase se hace en el cliente.
export function middleware(req: NextRequest) {
  const protectedPaths = ['/dashboard']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Firebase Auth persiste la sesión en IndexedDB/localStorage en el cliente.
  // No hay cookie de sesión que podamos verificar aquí sin Firebase Admin.
  // Dejamos pasar la petición; ProtectedRoute redirigirá a /login si no hay usuario.
  if (isProtectedPath) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protección de /dashboard se hace en el cliente (ProtectedRoute + Firebase Auth).
// Dejamos pasar para evitar bucle de redirección cuando no hay cookie de sesión.
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}

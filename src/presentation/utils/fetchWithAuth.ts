'use client'

import { getFirebaseAuth } from '@/infrastructure/config/firebase'

/**
 * Igual que fetch, pero añade Authorization: Bearer <Firebase ID token> si hay sesión.
 * Usar en llamadas a rutas API que validan con getCurrentUserFromRequest.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined)
  try {
    const auth = getFirebaseAuth()
    await auth.authStateReady()
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken()
      headers.set('Authorization', `Bearer ${token}`)
    }
  } catch {
    // sin sesión: la API responderá 401 si requiere auth
  }
  return fetch(input, { ...init, headers })
}

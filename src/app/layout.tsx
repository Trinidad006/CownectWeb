import type { Metadata } from 'next'
import '../presentation/styles/globals.css'

export const metadata: Metadata = {
  title: 'Cownect - Herramienta de Gestión Ganadera',
  description: 'Plataforma profesional para la gestión integral de su explotación ganadera',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}


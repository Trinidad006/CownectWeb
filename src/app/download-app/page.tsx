'use client'

import ProtectedRoute from '@/presentation/components/auth/ProtectedRoute'
import DownloadAppPage from '@/presentation/pages/DownloadAppPage'

export default function DownloadApp() {
  return (
    <ProtectedRoute>
      <DownloadAppPage />
    </ProtectedRoute>
  )
}

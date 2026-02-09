'use client'

import ProtectedRoute from '@/presentation/components/auth/ProtectedRoute'
import ChoosePlanPage from '@/presentation/pages/ChoosePlanPage'

export default function ChoosePlan() {
  return (
    <ProtectedRoute>
      <ChoosePlanPage />
    </ProtectedRoute>
  )
}

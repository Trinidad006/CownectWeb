import { NextRequest, NextResponse } from 'next/server'

type PlanType = 'freemium' | 'premium'

type PremiumRequestBody = {
  userId?: string
  plan?: PlanType | string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PremiumRequestBody
    const { userId, plan } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing userId or plan' },
        { status: 400 }
      )
    }

    if (plan !== 'premium') {
      return NextResponse.json(
        { error: 'Premium required: access forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Premium feature accessed',
        plan: 'premium' as const,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('premium-feature API:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}


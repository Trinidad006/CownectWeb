import { handleCaptureSubscription } from '@/app/api/paypal/capture-subscription-order/handler'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

jest.mock('@/infrastructure/config/firebaseAdmin', () => ({
  getFirebaseAdminDb: jest.fn(),
  hasAdminCredentials: jest.fn(),
}))

describe('TC-PAY-05: PayPal capture-subscription-order webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('debe devolver 400 si el status no es COMPLETED', async () => {
    ;(hasAdminCredentials as jest.Mock).mockReturnValue(true)

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        orderID: 'ORDER-123',
        subscriptionID: 'SUB-123',
        userId: 'user-123',
        status: 'PENDING',
      }),
    } as any

    const result = await handleCaptureSubscription(await mockRequest.json())

    expect(result.status).toBe(400)
    expect((result.body as any).error).toMatch(/COMPLETED/i)
  })

  test('debe actualizar el plan del usuario a premium cuando el pago está COMPLETED', async () => {
    ;(hasAdminCredentials as jest.Mock).mockReturnValue(true)

    const setMock = jest.fn().mockResolvedValue(undefined)
    const getMock = jest.fn().mockResolvedValue({ exists: true })

    ;(getFirebaseAdminDb as jest.Mock).mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: getMock,
          set: setMock,
        }),
      }),
    })

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        orderID: 'ORDER-123',
        subscriptionID: 'SUB-123',
        userId: 'user-123',
        status: 'COMPLETED',
      }),
    } as any

    const result = await handleCaptureSubscription(await mockRequest.json())

    expect(result.status).toBe(200)

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'premium',
      }),
      { merge: true }
    )
    const body = result.body as any
    expect(body.success).toBe(true)
    expect(body.plan).toBe('premium')
  })
})



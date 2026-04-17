import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Hash para credenciales de trabajador (solo servidor). */
export function hashWorkerPassword(plain: string): { salt: string; hash: string } {
  const salt = randomBytes(16)
  const hash = scryptSync(plain, salt, 64)
  return { salt: salt.toString('hex'), hash: hash.toString('hex') }
}

export function verifyWorkerPassword(plain: string, saltHex: string, hashHex: string): boolean {
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const computed = scryptSync(plain, salt, 64)
    if (computed.length !== expected.length) return false
    return timingSafeEqual(computed, expected)
  } catch {
    return false
  }
}

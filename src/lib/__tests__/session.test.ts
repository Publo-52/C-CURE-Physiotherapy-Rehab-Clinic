import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '../session'

describe('JWT Session Encryption & Decryption Unit Tests', () => {
  it('should encrypt and decrypt payload successfully', async () => {
    const payload = { userId: 'admin-uuid-123', role: 'Admin', sessionToken: 'token-xyz-789' }
    const token = await encrypt(payload)

    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)

    const decrypted = await decrypt(token)
    expect(decrypted.userId).toBe('admin-uuid-123')
    expect(decrypted.role).toBe('Admin')
    expect(decrypted.sessionToken).toBe('token-xyz-789')
  })

  it('should throw an error when decrypting an invalid JWT token string', async () => {
    await expect(decrypt('invalid.jwt.token')).rejects.toThrow()
  })
})

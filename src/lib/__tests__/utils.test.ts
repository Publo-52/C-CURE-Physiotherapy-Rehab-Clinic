import { describe, it, expect } from 'vitest'
import { formatDate, cn } from '../utils'

describe('Utility Functions Unit Tests', () => {
  describe('formatDate', () => {
    it('returns "—" for null or undefined input', () => {
      expect(formatDate(null)).toBe('—')
      expect(formatDate(undefined)).toBe('—')
      expect(formatDate('')).toBe('—')
    })

    it('returns "—" for invalid date strings', () => {
      expect(formatDate('invalid-date-string')).toBe('—')
    })

    it('formats valid Date object or ISO string into DD/MM/YYYY in IST', () => {
      const date = new Date('2026-08-19T10:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  describe('cn (Tailwind Merge)', () => {
    it('merges overlapping tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4', { 'bg-red-500': true })
      expect(result).toBe('py-1 px-4 bg-red-500')
    })
  })
})

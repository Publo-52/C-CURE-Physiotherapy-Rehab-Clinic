import { describe, it, expect } from 'vitest'

function safeInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const parsed = parseInt(String(val), 10)
  return isNaN(parsed) ? null : parsed
}

function validatePatientInput(formData: Map<string, string>) {
  const name = formData.get('name')?.trim()
  const phone = formData.get('phone')?.trim()
  const age = safeInt(formData.get('age'))

  if (!name || !phone) {
    return { valid: false, error: 'Name and Phone are required.' }
  }

  if (age !== null && (age < 0 || age > 150)) {
    return { valid: false, error: 'Age must be a realistic number between 0 and 150.' }
  }

  return { valid: true, data: { name, phone, age } }
}

describe('Patient Form Validation & Edge Case Unit Tests', () => {
  it('rejects form when Name is missing', () => {
    const formData = new Map([
      ['phone', '9876543210'],
      ['age', '45']
    ])
    const result = validatePatientInput(formData)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Name and Phone are required.')
  })

  it('rejects form when Phone is missing', () => {
    const formData = new Map([
      ['name', 'John Doe'],
      ['age', '45']
    ])
    const result = validatePatientInput(formData)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Name and Phone are required.')
  })

  it('accepts valid input and trims whitespace from Name and Phone', () => {
    const formData = new Map([
      ['name', '  Jane Smith  '],
      ['phone', ' 9123456789 '],
      ['age', '32']
    ])
    const result = validatePatientInput(formData)
    expect(result.valid).toBe(true)
    expect(result.data?.name).toBe('Jane Smith')
    expect(result.data?.phone).toBe('9123456789')
    expect(result.data?.age).toBe(32)
  })

  it('handles non-numeric age input gracefully', () => {
    const formData = new Map([
      ['name', 'Alice'],
      ['phone', '9988776655'],
      ['age', 'invalid_age']
    ])
    const result = validatePatientInput(formData)
    expect(result.valid).toBe(true)
    expect(result.data?.age).toBeNull()
  })

  it('detects unrealistic age values', () => {
    const formData = new Map([
      ['name', 'Bob'],
      ['phone', '9988776655'],
      ['age', '250']
    ])
    const result = validatePatientInput(formData)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('realistic number')
  })
})

import { describe, it, expect } from 'vitest'
import { parseDeviceInfo, getFriendlyDeviceModel } from '../device-parser'

describe('Device Parser Unit Tests', () => {
  it('should format known model codes correctly', () => {
    expect(getFriendlyDeviceModel('SM-S928')).toBe('Samsung Galaxy S24 Ultra')
    expect(getFriendlyDeviceModel('CPH2581')).toBe('OnePlus 12')
    expect(getFriendlyDeviceModel('2312DRA50I')).toBe('Redmi Note 13 Pro 5G')
  })

  it('should apply fallback heuristic rules for unknown model codes', () => {
    expect(getFriendlyDeviceModel('SM-A999')).toBe('Samsung Galaxy (SM-A999)')
    expect(getFriendlyDeviceModel('Pixel 8 Pro')).toBe('Google Pixel 8 Pro')
  })

  it('should parse Windows 10/11 Chrome User-Agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseDeviceInfo(ua)

    expect(result.deviceName).toBe('Windows PC')
    expect(result.os).toBe('Windows 10/11')
    expect(result.browser).toBe('Chrome 120')
    expect(result.fullLabel).toContain('Windows PC')
  })

  it('should parse iPhone iOS Safari User-Agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    const result = parseDeviceInfo(ua)

    expect(result.deviceName).toBe('Apple iPhone')
    expect(result.os).toBe('iOS 17.2')
    expect(result.browser).toBe('Safari 17')
  })

  it('should handle empty user agent gracefully', () => {
    const result = parseDeviceInfo('')
    expect(result.deviceName).toBe('Unknown Device')
    expect(result.os).toBe('Unknown OS')
    expect(result.browser).toBe('Unknown Browser')
  })
})

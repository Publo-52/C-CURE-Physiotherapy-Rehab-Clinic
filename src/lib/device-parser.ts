/**
 * Utility to parse User-Agent header into precise device name, model number, OS, and browser.
 */
export function parseDeviceInfo(userAgent: string): {
  deviceName: string
  os: string
  browser: string
  fullLabel: string
} {
  if (!userAgent) {
    return {
      deviceName: 'Unknown Device',
      os: 'Unknown OS',
      browser: 'Unknown Browser',
      fullLabel: 'Unknown Device'
    }
  }

  const ua = userAgent.trim()

  // --- 1. Detect OS & OS Version ---
  let os = 'Unknown OS'
  let osVersion = ''

  if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 10/11'
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1'
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7'
  } else if (/windows/i.test(ua)) {
    os = 'Windows'
  } else if (/android/i.test(ua)) {
    os = 'Android'
    const match = ua.match(/android\s+([0-9.]+)/i)
    if (match) osVersion = match[1]
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = /ipad/i.test(ua) ? 'iPadOS' : 'iOS'
    const match = ua.match(/os\s+([0-9_]+)/i)
    if (match) osVersion = match[1].replace(/_/g, '.')
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS'
    const match = ua.match(/mac os x\s+([0-9_.]+)/i)
    if (match) osVersion = match[1].replace(/_/g, '.')
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS'
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  }

  const osFull = osVersion ? `${os} ${osVersion}` : os

  // --- 2. Detect Browser Name & Version ---
  let browser = 'Browser'
  let browserVersion = ''

  if (/edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge'
    browserVersion = ua.match(/edg\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''
  } else if (/samsungbrowser\/([0-9.]+)/i.test(ua)) {
    browser = 'Samsung Internet'
    browserVersion = ua.match(/samsungbrowser\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''
  } else if (/chrome\/([0-9.]+)/i.test(ua) && !/chromium|edg|opera|opr/i.test(ua)) {
    browser = 'Chrome'
    browserVersion = ua.match(/chrome\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    browser = 'Firefox'
    browserVersion = ua.match(/firefox\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    browser = 'Safari'
    browserVersion = ua.match(/version\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''
  } else if (/opera|opr\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera'
  }

  const browserFull = browserVersion ? `${browser} ${browserVersion}` : browser

  // --- 3. Detect Specific Device Model / Brand ---
  let deviceName = 'Desktop PC'

  if (/iphone/i.test(ua)) {
    deviceName = 'Apple iPhone'
  } else if (/ipad/i.test(ua)) {
    deviceName = 'Apple iPad'
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceName = 'Apple Mac'
  } else if (/windows/i.test(ua)) {
    deviceName = 'Windows PC'
  } else if (/linux/i.test(ua) && !/android/i.test(ua)) {
    deviceName = 'Linux Computer'
  } else if (/android/i.test(ua)) {
    // Attempt to extract Android Model Number e.g. SM-S918B, Pixel 7, M2101K6G, CPH2451, V2202, etc.
    const modelMatch = ua.match(/\;\s*([^;]+)\s+Build\//i) || ua.match(/\(([^)]+)\)/)
    let rawModel = ''

    if (modelMatch && modelMatch[1]) {
      const parts = modelMatch[1].split(';')
      // Search parts for mobile model identifiers
      for (const part of parts) {
        const trimmed = part.trim()
        if (
          !/android|linux|wv|mobile|en-us|en-gb|build|wv/i.test(trimmed) &&
          trimmed.length >= 3 &&
          trimmed.length <= 30
        ) {
          rawModel = trimmed
          break
        }
      }
    }

    // Brand identification mapping
    if (/sm-[a-z0-9]+/i.test(rawModel) || /samsung/i.test(ua)) {
      const smCode = rawModel.match(/sm-[a-z0-9]+/i)?.[0]?.toUpperCase()
      deviceName = smCode ? `Samsung Galaxy (${smCode})` : 'Samsung Galaxy'
    } else if (/pixel/i.test(rawModel) || /pixel/i.test(ua)) {
      deviceName = rawModel ? `Google ${rawModel}` : 'Google Pixel'
    } else if (/oneplus|cph[0-9]+/i.test(rawModel) || /oneplus/i.test(ua)) {
      deviceName = rawModel ? `OnePlus (${rawModel})` : 'OnePlus Smartphone'
    } else if (/redmi|mi\s|xiaomi|m2[0-9]+/i.test(rawModel) || /xiaomi/i.test(ua)) {
      deviceName = rawModel ? `Xiaomi / Redmi (${rawModel})` : 'Xiaomi / Redmi'
    } else if (/vivo|v2[0-9]+/i.test(rawModel) || /vivo/i.test(ua)) {
      deviceName = rawModel ? `Vivo (${rawModel})` : 'Vivo Smartphone'
    } else if (/oppo|cph[0-9]+/i.test(rawModel) || /oppo/i.test(ua)) {
      deviceName = rawModel ? `Oppo (${rawModel})` : 'Oppo Smartphone'
    } else if (/realme|rmx[0-9]+/i.test(rawModel) || /realme/i.test(ua)) {
      deviceName = rawModel ? `Realme (${rawModel})` : 'Realme Smartphone'
    } else if (rawModel) {
      deviceName = `Android (${rawModel})`
    } else {
      deviceName = 'Android Smartphone'
    }
  }

  const fullLabel = `${deviceName} • ${browserFull} on ${osFull}`

  return {
    deviceName,
    os: osFull,
    browser: browserFull,
    fullLabel
  }
}

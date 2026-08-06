/**
 * Known Mobile Device Model Dictionary (Samsung, OnePlus, Xiaomi/Redmi, Realme, Vivo, Oppo, Google Pixel, Apple)
 */
const MODEL_MAP: Record<string, string> = {
  // Samsung Galaxy S series
  'SM-S928': 'Samsung Galaxy S24 Ultra',
  'SM-S926': 'Samsung Galaxy S24+',
  'SM-S921': 'Samsung Galaxy S24',
  'SM-S918': 'Samsung Galaxy S23 Ultra',
  'SM-S916': 'Samsung Galaxy S23+',
  'SM-S911': 'Samsung Galaxy S23',
  'SM-S908': 'Samsung Galaxy S22 Ultra',
  'SM-S906': 'Samsung Galaxy S22+',
  'SM-S901': 'Samsung Galaxy S22',
  'SM-G998': 'Samsung Galaxy S21 Ultra',
  'SM-G996': 'Samsung Galaxy S21+',
  'SM-G991': 'Samsung Galaxy S21',
  'SM-G990': 'Samsung Galaxy S21 FE',
  'SM-G780': 'Samsung Galaxy S20 FE',

  // Samsung Galaxy A & M series
  'SM-A556': 'Samsung Galaxy A55 5G',
  'SM-A356': 'Samsung Galaxy A35 5G',
  'SM-A546': 'Samsung Galaxy A54 5G',
  'SM-A346': 'Samsung Galaxy A34 5G',
  'SM-A156': 'Samsung Galaxy A15 5G',
  'SM-A146': 'Samsung Galaxy A14 5G',
  'SM-A536': 'Samsung Galaxy A53 5G',
  'SM-A526': 'Samsung Galaxy A52s 5G',
  'SM-M346': 'Samsung Galaxy M34 5G',
  'SM-M146': 'Samsung Galaxy M14 5G',
  'SM-M546': 'Samsung Galaxy M54 5G',
  'SM-F946': 'Samsung Galaxy Z Fold 5',
  'SM-F731': 'Samsung Galaxy Z Flip 5',

  // OnePlus
  'CPH2581': 'OnePlus 12',
  'CPH2573': 'OnePlus 12R',
  'CPH2413': 'OnePlus 11',
  'CPH2451': 'OnePlus 11',
  'CPH2447': 'OnePlus 11R',
  'CPH2417': 'OnePlus 10T',
  'NE2211': 'OnePlus 10 Pro',
  'CPH2467': 'OnePlus Nord CE 3',
  'CPH2409': 'OnePlus Nord CE 2 Lite',
  'CPH2569': 'OnePlus Nord CE 3 Lite',

  // Xiaomi / Redmi / POCO
  '2312DRA50I': 'Redmi Note 13 Pro 5G',
  '2312DRA50G': 'Redmi Note 13 Pro 5G',
  '22101316I': 'Redmi Note 12 Pro 5G',
  '22101316G': 'Redmi Note 12 Pro 5G',
  '23049PCD8I': 'POCO X5 Pro 5G',
  '2311DRK48I': 'POCO X6 Pro 5G',

  // Realme
  'RMX3840': 'Realme 12 Pro+ 5G',
  'RMX3771': 'Realme 11 Pro 5G',
  'RMX3741': 'Realme 11 Pro+ 5G',

  // Vivo & Oppo
  'V2303': 'Vivo V30 5G',
  'V2250': 'Vivo V27 Pro',
  'V2202': 'Vivo V27 5G',
  'V2203': 'Vivo V27 5G',
  'CPH2523': 'Oppo Reno 10 Pro 5G',
}

/**
 * Format model code into human-friendly device name
 */
export function getFriendlyDeviceModel(rawModel: string): string {
  if (!rawModel) return ''
  const clean = rawModel.replace(/"/g, '').trim()

  // Match prefix against dictionary
  for (const [prefix, friendlyName] of Object.entries(MODEL_MAP)) {
    if (clean.toUpperCase().includes(prefix.toUpperCase())) {
      return friendlyName
    }
  }

  // Formatting heuristics
  if (/^SM-[A-Z0-9]+/i.test(clean)) {
    return `Samsung Galaxy (${clean.toUpperCase()})`
  }
  if (/^Pixel/i.test(clean)) {
    return `Google ${clean}`
  }
  if (/^CPH[0-9]+/i.test(clean) || /^NE[0-9]+/i.test(clean)) {
    return `OnePlus / Oppo (${clean.toUpperCase()})`
  }
  if (/^RMX[0-9]+/i.test(clean)) {
    return `Realme (${clean.toUpperCase()})`
  }
  if (/^V[0-9]+/i.test(clean)) {
    return `Vivo (${clean.toUpperCase()})`
  }

  return clean
}

/**
 * Utility to parse User-Agent header into precise device name, model number, OS, and browser.
 */
export function parseDeviceInfo(
  userAgent: string,
  clientModelHint?: string
): {
  deviceName: string
  os: string
  browser: string
  fullLabel: string
} {
  if (!userAgent) {
    const name = clientModelHint ? getFriendlyDeviceModel(clientModelHint) : 'Unknown Device'
    return {
      deviceName: name,
      os: 'Unknown OS',
      browser: 'Unknown Browser',
      fullLabel: name
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
  let deviceName = ''

  if (clientModelHint) {
    deviceName = getFriendlyDeviceModel(clientModelHint)
  }

  if (!deviceName || deviceName === 'Desktop PC' || deviceName === 'Android') {
    if (/iphone/i.test(ua)) {
      deviceName = 'Apple iPhone'
    } else if (/ipad/i.test(ua)) {
      deviceName = 'Apple iPad'
    } else if (/macintosh|mac os x/i.test(ua)) {
      deviceName = 'Apple Mac / MacBook'
    } else if (/windows/i.test(ua)) {
      deviceName = 'Windows PC'
    } else if (/linux/i.test(ua) && !/android/i.test(ua)) {
      deviceName = 'Linux Computer'
    } else if (/android/i.test(ua)) {
      // Extract model token from UA if available
      const match = ua.match(/\;\s*([^;]+)\s+Build\//i)
      let modelToken = match?.[1]?.trim() || ''

      if (modelToken && !/android|linux|wv|mobile/i.test(modelToken)) {
        deviceName = getFriendlyDeviceModel(modelToken)
      } else {
        deviceName = 'Android Mobile Phone'
      }
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

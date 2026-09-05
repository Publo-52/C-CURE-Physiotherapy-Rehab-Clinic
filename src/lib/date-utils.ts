const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // UTC+05:30 (India Standard Time)

/**
 * Returns the exact Date range for the Indian Standard Time (IST) calendar day.
 * Ensures consistent day-boundary behavior whether running locally or on UTC cloud servers (Vercel/Render).
 */
export function getISTDayBounds(dateInput?: Date | string | null): { todayStart: Date; todayEnd: Date } {
  const base = dateInput ? new Date(dateInput) : new Date()
  const validBase = isNaN(base.getTime()) ? new Date() : base

  // Shift to IST virtual time
  const istVirtual = new Date(validBase.getTime() + IST_OFFSET_MS)
  const year = istVirtual.getUTCFullYear()
  const month = istVirtual.getUTCMonth()
  const date = istVirtual.getUTCDate()

  // Convert IST midnight back to real UTC Date
  const startUtcMs = Date.UTC(year, month, date) - IST_OFFSET_MS
  const endUtcMs = Date.UTC(year, month, date + 1) - IST_OFFSET_MS

  return {
    todayStart: new Date(startUtcMs),
    todayEnd: new Date(endUtcMs),
  }
}

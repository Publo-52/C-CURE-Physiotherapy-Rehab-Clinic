export interface BasePayment {
  id?: string
  invoiceNumber?: string
  paymentDate?: Date | string | null
  totalBill?: number | null
  amountPaidToday?: number | null
  remainingDue?: number | null
  previousDue?: number | null
  totalDue?: number | null
  status?: string | null
  paymentMode?: string | null
  paymentNotes?: string | null
  visitId?: string | null
  visit?: {
    id: string
    status?: string | null
  } | null
}

export interface BaseVisit {
  id: string
  visitNumber?: number
  date: Date | string
  status?: string | null
}

export interface BillingSummary {
  totalVisits: number
  totalBilled: number
  totalPaid: number
  remainingDue: number
  paymentStatus: 'PAID' | 'PARTIALLY PAID' | 'OUTSTANDING DUE' | 'NO PAYMENTS RECORDED' | 'NO DUES'
  statusStr: string
  validPaymentsCount: number
}

export interface LedgerEntry extends BasePayment {
  billed: number
  paid: number
  remainingDue: number
  runningDue: number
  computedStatus: string
}

/**
 * Checks if a payment record is valid according to business rules:
 * - Not cancelled, void, or deleted
 * - Real payments (amountPaidToday > 0) are always valid
 * - Auto-billed payments must have a linked non-cancelled visit
 * - Orphaned auto-bills (visitId is null and amountPaidToday is 0) are invalid
 */
export function isValidPayment(payment: BasePayment): boolean {
  if (!payment) return false

  const status = (payment.status || '').toLowerCase().trim()
  if (status === 'cancelled' || status === 'void' || status === 'deleted') {
    return false
  }

  const paid = Math.round(Number(payment.amountPaidToday) || 0)

  // Real money collected is always valid
  if (paid > 0) {
    return true
  }

  // If linked to a visit, check if the visit was cancelled
  if (payment.visitId) {
    if (payment.visit && (payment.visit.status || '').toLowerCase() === 'cancelled') {
      return false
    }
    return true
  }

  // If visitId is null and paid is 0:
  // Check if it's an auto-billed placeholder for a visit/scheduled visit that has no visit
  const notes = payment.paymentNotes || ''
  if (/auto-billed/i.test(notes)) {
    return false
  }

  // Manual payment entry or consultation
  return true
}

/**
 * Deduplicates and filters payment records to only valid ones
 */
export function filterValidPayments<T extends BasePayment>(payments: T[]): T[] {
  if (!Array.isArray(payments)) return []

  const seenIds = new Set<string>()
  const seenInvoiceNumbers = new Set<string>()
  const validList: T[] = []

  for (const p of payments) {
    if (!p) continue

    if (p.id) {
      if (seenIds.has(p.id)) continue
      seenIds.add(p.id)
    }

    if (p.invoiceNumber) {
      if (seenInvoiceNumbers.has(p.invoiceNumber)) continue
      seenInvoiceNumbers.add(p.invoiceNumber)
    }

    if (isValidPayment(p)) {
      validList.push(p)
    }
  }

  return validList
}

/**
 * Filters visits to completed / valid visits (not cancelled)
 */
export function filterValidVisits<T extends BaseVisit>(visits: T[]): T[] {
  if (!Array.isArray(visits)) return []
  const seenIds = new Set<string>()
  return visits.filter((v) => {
    if (!v) return false
    if (v.id) {
      if (seenIds.has(v.id)) return false
      seenIds.add(v.id)
    }
    const status = (v.status || '').toLowerCase()
    return status !== 'cancelled'
  })
}

/**
 * Centralized Patient Billing Calculation:
 * - Total Billed = SUM(all valid billed invoice amounts)
 * - Total Paid = SUM(all valid payments)
 * - Remaining Due = Total Billed - Total Paid
 * - Total Visits = count of valid (non-cancelled) visits
 */
export function calculatePatientBilling(
  payments: BasePayment[] = [],
  visits: BaseVisit[] = []
): BillingSummary {
  const validPayments = filterValidPayments(payments)
  const validVisits = filterValidVisits(visits)

  const totalVisits = validVisits.length

  const totalBilled = Math.round(
    validPayments.reduce((sum, p) => sum + (Number(p.totalBill) || 0), 0)
  )

  const totalPaid = Math.round(
    validPayments.reduce((sum, p) => sum + (Number(p.amountPaidToday) || 0), 0)
  )

  // Remaining Due must ALWAYS be: Total Billed - Total Paid
  const remainingDue = Math.max(0, totalBilled - totalPaid)

  let paymentStatus: BillingSummary['paymentStatus'] = 'NO PAYMENTS RECORDED'
  let statusStr = 'NO PAYMENTS RECORDED'

  if (validPayments.length === 0) {
    if (totalBilled > 0) {
      paymentStatus = 'OUTSTANDING DUE'
      statusStr = 'OUTSTANDING DUE'
    } else {
      paymentStatus = 'NO PAYMENTS RECORDED'
      statusStr = 'NO PAYMENTS RECORDED'
    }
  } else if (remainingDue <= 0 && totalBilled > 0) {
    paymentStatus = 'PAID'
    statusStr = 'CLEARED'
  } else if (totalPaid > 0 && remainingDue > 0) {
    paymentStatus = 'PARTIALLY PAID'
    statusStr = 'PARTIALLY PAID'
  } else if (totalBilled === 0 && totalPaid === 0) {
    paymentStatus = 'NO DUES'
    statusStr = 'CLEARED'
  } else {
    paymentStatus = 'OUTSTANDING DUE'
    statusStr = 'OUTSTANDING DUE'
  }

  return {
    totalVisits,
    totalBilled,
    totalPaid,
    remainingDue,
    paymentStatus,
    statusStr,
    validPaymentsCount: validPayments.length,
  }
}

/**
 * Computes chronological ledger running due balance:
 * - Sorts valid transactions from oldest to newest
 * - Calculates running cumulative balance at each transaction
 * - Returns entries in reverse chronological order (newest first) for UI/PDF display
 */
export function calculateLedgerEntries(payments: BasePayment[] = []): LedgerEntry[] {
  const validPayments = filterValidPayments(payments)

  // Sort strictly in chronological order (oldest first)
  const sorted = [...validPayments].sort((a, b) => {
    const tA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0
    const tB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0
    if (tA !== tB) return tA - tB
    return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '')
  })

  let runningBalance = 0
  const chronologicalEntries: LedgerEntry[] = sorted.map((p) => {
    const billed = Math.round(Number(p.totalBill) || 0)
    const paid = Math.round(Number(p.amountPaidToday) || 0)
    runningBalance += (billed - paid)
    const dueAtThisPoint = Math.max(0, runningBalance)

    let computedStatus = 'Due'
    if (dueAtThisPoint <= 0 && (billed > 0 || paid > 0)) {
      computedStatus = 'Paid'
    } else if (paid > 0 && dueAtThisPoint > 0) {
      computedStatus = 'Partially Paid'
    } else if (dueAtThisPoint > 0 && paid === 0) {
      computedStatus = 'Due'
    }

    return {
      ...p,
      totalBill: billed,
      amountPaidToday: paid,
      billed,
      paid,
      remainingDue: dueAtThisPoint,
      runningDue: dueAtThisPoint,
      computedStatus,
    }
  })

  // Return newest first (reverse chronological)
  return [...chronologicalEntries].reverse()
}

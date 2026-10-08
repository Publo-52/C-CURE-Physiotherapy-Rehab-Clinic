import { describe, it, expect } from 'vitest'
import {
  calculatePatientBilling,
  calculateLedgerEntries,
  filterValidPayments,
  filterValidVisits,
  BasePayment,
  BaseVisit
} from '../billing'

describe('Centralized Billing & Ledger Calculation Tests', () => {
  // Requirement 10: 8 visits × ₹200, ₹0 paid => Total Visits = 8, Total Billed = ₹1,600, Total Paid = ₹0, Remaining Due = ₹1,600
  it('Scenario 1: 8 visits × ₹200, ₹0 paid', () => {
    const visits: BaseVisit[] = Array.from({ length: 8 }, (_, i) => ({
      id: `visit-${i + 1}`,
      visitNumber: i + 1,
      date: new Date(2026, 7, 10 + i),
      status: 'Completed',
    }))

    const payments: BasePayment[] = Array.from({ length: 8 }, (_, i) => ({
      id: `pay-${i + 1}`,
      invoiceNumber: `INV-000${10 + i}`,
      visitId: `visit-${i + 1}`,
      paymentDate: new Date(2026, 7, 10 + i),
      totalBill: 200,
      amountPaidToday: 0,
      paymentMode: 'Cash',
      status: 'Due',
    }))

    const billing = calculatePatientBilling(payments, visits)
    expect(billing.totalVisits).toBe(8)
    expect(billing.totalBilled).toBe(1600)
    expect(billing.totalPaid).toBe(0)
    expect(billing.remainingDue).toBe(1600)
    expect(billing.paymentStatus).toBe('OUTSTANDING DUE')

    const ledger = calculateLedgerEntries(payments)
    expect(ledger.length).toBe(8)
    // Newest is on top, its remainingDue should match total remaining due (1,600)
    expect(ledger[0].remainingDue).toBe(1600)
    // Oldest is at bottom, its remainingDue should be first visit charge (200)
    expect(ledger[7].remainingDue).toBe(200)
  })

  // Requirement 11: If patient pays ₹500 => Total Billed = ₹1,600, Total Paid = ₹500, Remaining Due = ₹1,100
  it('Scenario 2: 8 visits × ₹200, ₹500 paid', () => {
    const visits: BaseVisit[] = Array.from({ length: 8 }, (_, i) => ({
      id: `visit-${i + 1}`,
      visitNumber: i + 1,
      date: new Date(2026, 7, 10 + i),
      status: 'Completed',
    }))

    const payments: BasePayment[] = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `pay-${i + 1}`,
        invoiceNumber: `INV-000${10 + i}`,
        visitId: `visit-${i + 1}`,
        paymentDate: new Date(2026, 7, 10 + i),
        totalBill: 200,
        amountPaidToday: 0,
        paymentMode: 'Cash',
        status: 'Due',
      })),
      // Payment receipt of ₹500
      {
        id: 'pay-receipt-1',
        invoiceNumber: 'INV-00099',
        visitId: null,
        paymentDate: new Date(2026, 7, 25),
        totalBill: 0,
        amountPaidToday: 500,
        paymentMode: 'UPI',
        status: 'Partially Paid',
      }
    ]

    const billing = calculatePatientBilling(payments, visits)
    expect(billing.totalVisits).toBe(8)
    expect(billing.totalBilled).toBe(1600)
    expect(billing.totalPaid).toBe(500)
    expect(billing.remainingDue).toBe(1100)
    expect(billing.paymentStatus).toBe('PARTIALLY PAID')

    const ledger = calculateLedgerEntries(payments)
    expect(ledger.length).toBe(9)
    // Top entry is the ₹500 payment receipt; remaining due after it should be 1,100
    expect(ledger[0].invoiceNumber).toBe('INV-00099')
    expect(ledger[0].remainingDue).toBe(1100)
  })

  // Requirement 12: If patient pays full ₹1,600 => Total Billed = ₹1,600, Total Paid = ₹1,600, Remaining Due = ₹0, Payment Status = PAID
  it('Scenario 3: 8 visits × ₹200, ₹1,600 paid in full', () => {
    const visits: BaseVisit[] = Array.from({ length: 8 }, (_, i) => ({
      id: `visit-${i + 1}`,
      visitNumber: i + 1,
      date: new Date(2026, 7, 10 + i),
      status: 'Completed',
    }))

    const payments: BasePayment[] = [
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `pay-${i + 1}`,
        invoiceNumber: `INV-000${10 + i}`,
        visitId: `visit-${i + 1}`,
        paymentDate: new Date(2026, 7, 10 + i),
        totalBill: 200,
        amountPaidToday: 0,
        paymentMode: 'Cash',
        status: 'Due',
      })),
      {
        id: 'pay-receipt-full',
        invoiceNumber: 'INV-00100',
        visitId: null,
        paymentDate: new Date(2026, 7, 26),
        totalBill: 0,
        amountPaidToday: 1600,
        paymentMode: 'Cash',
        status: 'Paid',
      }
    ]

    const billing = calculatePatientBilling(payments, visits)
    expect(billing.totalVisits).toBe(8)
    expect(billing.totalBilled).toBe(1600)
    expect(billing.totalPaid).toBe(1600)
    expect(billing.remainingDue).toBe(0)
    expect(billing.paymentStatus).toBe('PAID')
    expect(billing.statusStr).toBe('CLEARED')

    const ledger = calculateLedgerEntries(payments)
    expect(ledger.length).toBe(9)
    expect(ledger[0].remainingDue).toBe(0)
  })

  // Requirement 13 & Different visit charges & Multiple payments
  it('Scenario 4: Different visit charges and multiple partial payments', () => {
    const visits: BaseVisit[] = [
      { id: 'v1', visitNumber: 1, date: new Date('2026-08-01'), status: 'Completed' },
      { id: 'v2', visitNumber: 2, date: new Date('2026-08-05'), status: 'Completed' },
      { id: 'v3', visitNumber: 3, date: new Date('2026-08-10'), status: 'Completed' },
    ]

    const payments: BasePayment[] = [
      { id: 'p1', invoiceNumber: 'INV-1', visitId: 'v1', paymentDate: new Date('2026-08-01'), totalBill: 300, amountPaidToday: 0 },
      { id: 'p2', invoiceNumber: 'INV-2', visitId: 'v2', paymentDate: new Date('2026-08-05'), totalBill: 500, amountPaidToday: 200 }, // paid 200 today
      { id: 'p3', invoiceNumber: 'INV-3', visitId: 'v3', paymentDate: new Date('2026-08-10'), totalBill: 200, amountPaidToday: 0 },
      { id: 'p4', invoiceNumber: 'INV-4', visitId: null, paymentDate: new Date('2026-08-15'), totalBill: 0, amountPaidToday: 400 }, // paid 400 later
    ]

    const billing = calculatePatientBilling(payments, visits)
    // Total Billed: 300 + 500 + 200 = 1000
    expect(billing.totalBilled).toBe(1000)
    // Total Paid: 0 + 200 + 0 + 400 = 600
    expect(billing.totalPaid).toBe(600)
    // Remaining Due: 1000 - 600 = 400
    expect(billing.remainingDue).toBe(400)
    expect(billing.paymentStatus).toBe('PARTIALLY PAID')

    const ledger = calculateLedgerEntries(payments)
    // Running balance oldest to newest:
    // INV-1 (08-01): +300 -0 = 300
    // INV-2 (08-05): +500 -200 = +300 => 600
    // INV-3 (08-10): +200 -0 = +200 => 800
    // INV-4 (08-15): +0 -400 = -400 => 400
    // Reverse (newest first):
    expect(ledger[0].remainingDue).toBe(400) // INV-4
    expect(ledger[1].remainingDue).toBe(800) // INV-3
    expect(ledger[2].remainingDue).toBe(600) // INV-2
    expect(ledger[3].remainingDue).toBe(300) // INV-1
  })

  // Requirements 14, 15, 16: Duplicate / Orphaned / Cancelled invoices filtering
  it('Scenario 5: Filters out orphaned auto-billed invoices and cancelled records', () => {
    const visits: BaseVisit[] = [
      { id: 'v1', visitNumber: 1, date: new Date('2026-09-01'), status: 'Completed' },
      { id: 'v2', visitNumber: 2, date: new Date('2026-09-02'), status: 'Completed' },
      { id: 'v3_cancelled', visitNumber: 3, date: new Date('2026-09-03'), status: 'Cancelled' },
    ]

    const payments: BasePayment[] = [
      { id: 'p1', invoiceNumber: 'INV-1', visitId: 'v1', paymentDate: new Date('2026-09-01'), totalBill: 200, amountPaidToday: 0 },
      { id: 'p2', invoiceNumber: 'INV-2', visitId: 'v2', paymentDate: new Date('2026-09-02'), totalBill: 200, amountPaidToday: 0 },
      // Cancelled visit payment with 0 paid
      { id: 'p3', invoiceNumber: 'INV-3', visitId: 'v3_cancelled', visit: { id: 'v3_cancelled', status: 'Cancelled' }, paymentDate: new Date('2026-09-03'), totalBill: 200, amountPaidToday: 0 },
      // Orphaned auto-billed invoice without a visit
      { id: 'p_orphan', invoiceNumber: 'INV-00052', visitId: null, paymentDate: new Date('2026-09-04'), totalBill: 200, amountPaidToday: 0, paymentNotes: 'Auto-billed for visit on 04/09/2026' },
      // Duplicate of INV-1
      { id: 'p1_dup', invoiceNumber: 'INV-1', visitId: 'v1', paymentDate: new Date('2026-09-01'), totalBill: 200, amountPaidToday: 0 },
    ]

    // Test direct filter utilities
    expect(filterValidVisits(visits).length).toBe(2)
    expect(filterValidPayments(payments).length).toBe(2)

    const billing = calculatePatientBilling(payments, visits)
    // Only v1 and v2 are valid visits (v3 is cancelled) => 2 visits
    expect(billing.totalVisits).toBe(2)
    expect(billing.totalBilled).toBe(400)
    expect(billing.totalPaid).toBe(0)
    expect(billing.remainingDue).toBe(400)

    const ledger = calculateLedgerEntries(payments)
    expect(ledger.length).toBe(2)
    expect(ledger[0].invoiceNumber).toBe('INV-2')
    expect(ledger[0].remainingDue).toBe(400)
    expect(ledger[1].invoiceNumber).toBe('INV-1')
    expect(ledger[1].remainingDue).toBe(200)
  })
})

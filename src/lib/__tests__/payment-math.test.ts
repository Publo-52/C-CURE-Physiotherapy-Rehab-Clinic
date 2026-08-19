import { describe, it, expect } from 'vitest'

function computePaymentStatus(totalBill: number, amountPaidToday: number, previousDue: number) {
  const totalDue = previousDue + totalBill
  const remainingDue = totalDue - amountPaidToday

  let status = 'Paid'
  if (remainingDue > 0 && amountPaidToday > 0) status = 'Partially Paid'
  else if (remainingDue > 0 && amountPaidToday === 0) status = 'Due'
  else if (remainingDue < 0) status = 'Advance Paid'

  return { totalDue, remainingDue, status }
}

describe('Financial Math & Status Calculation Tests', () => {
  it('should accurately calculate total bill, remaining due, and Paid status when full amount is paid', () => {
    const consultationFee = 500
    const visitFee = 200
    const extraCharges = 50
    const discount = 50

    const totalBill = consultationFee + visitFee + extraCharges - discount // 700
    const amountPaidToday = 700
    const previousDue = 0

    const result = computePaymentStatus(totalBill, amountPaidToday, previousDue)

    expect(totalBill).toBe(700)
    expect(result.totalDue).toBe(700)
    expect(result.remainingDue).toBe(0)
    expect(result.status).toBe('Paid')
  })

  it('should calculate Partially Paid status when paid amount is less than total due', () => {
    const totalBill = 1000
    const amountPaidToday = 400
    const previousDue = 200

    const result = computePaymentStatus(totalBill, amountPaidToday, previousDue)

    expect(result.totalDue).toBe(1200)
    expect(result.remainingDue).toBe(800)
    expect(result.status).toBe('Partially Paid')
  })

  it('should calculate Due status when zero payment is made', () => {
    const totalBill = 800
    const amountPaidToday = 0
    const previousDue = 0

    const result = computePaymentStatus(totalBill, amountPaidToday, previousDue)

    expect(result.remainingDue).toBe(800)
    expect(result.status).toBe('Due')
  })

  it('should calculate Advance Paid status when overpayment occurs', () => {
    const totalBill = 500
    const amountPaidToday = 1000
    const previousDue = 0

    const result = computePaymentStatus(totalBill, amountPaidToday, previousDue)

    expect(result.remainingDue).toBe(-500)
    expect(result.status).toBe('Advance Paid')
  })
})

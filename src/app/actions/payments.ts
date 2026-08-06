/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function safeFloat(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback
  const parsed = parseFloat(String(val))
  return isNaN(parsed) ? fallback : parsed
}

function safeDate(val: any, fallback = new Date()): Date {
  if (!val || val === '') return fallback
  const d = new Date(val)
  return isNaN(d.getTime()) ? fallback : d
}

export async function createPayment(patientId: string, formData: FormData) {
  const consultationFee = safeFloat(formData.get('consultationFee'))
  const visitFee = safeFloat(formData.get('visitFee'))
  const extraCharges = safeFloat(formData.get('extraCharges'))
  const discount = safeFloat(formData.get('discount'))
  
  const totalBill = consultationFee + visitFee + extraCharges - discount
  
  const amountPaidToday = safeFloat(formData.get('amountPaidToday'))
  const previousDue = safeFloat(formData.get('previousDue'))
  
  const totalDue = previousDue + totalBill
  const remainingDue = totalDue - amountPaidToday

  let status = 'Paid'
  if (remainingDue > 0 && amountPaidToday > 0) status = 'Partially Paid'
  else if (remainingDue > 0 && amountPaidToday === 0) status = 'Due'
  else if (remainingDue < 0) status = 'Advance Paid'

  const paymentMode = (formData.get('paymentMode') as string) || 'Cash'
  const paymentDate = safeDate(formData.get('paymentDate'))
  
  const expectedNextPaymentStr = formData.get('expectedNextPayment') as string
  const expectedNextPayment = expectedNextPaymentStr
    ? safeDate(expectedNextPaymentStr, undefined as any)
    : null

  const paymentNotes = (formData.get('paymentNotes') as string)?.trim() || null
  const transactionId = (formData.get('transactionId') as string)?.trim() || null

  // Auto-generate Invoice ID
  const lastPayment = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  
  let nextInvNum = 1
  if (lastPayment && lastPayment.invoiceNumber.startsWith('INV-')) {
    const lastNum = parseInt(lastPayment.invoiceNumber.replace('INV-', ''))
    if (!isNaN(lastNum)) {
      nextInvNum = lastNum + 1
    }
  }
  const invoiceNumber = `INV-${nextInvNum.toString().padStart(5, '0')}`

  try {
    const payment = await prisma.payment.create({
      data: {
        invoiceNumber,
        patientId,
        consultationFee,
        visitFee,
        extraCharges,
        discount,
        totalBill,
        amountPaidToday,
        remainingDue,
        previousDue,
        totalDue,
        status,
        paymentMode,
        paymentDate,
        expectedNextPayment,
        paymentNotes,
        transactionId,
      }
    })

    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/payments`)
    revalidatePath(`/`)
    
    return { success: true, paymentId: payment.id }
  } catch (error: any) {
    console.error('Error creating payment:', error?.message || error)
    return { error: `Failed to record payment: ${error?.message || 'Database error'}` }
  }
}

export async function updatePayment(paymentId: string, formData: FormData) {
  const consultationFee = safeFloat(formData.get('consultationFee'))
  const visitFee = safeFloat(formData.get('visitFee'))
  const extraCharges = safeFloat(formData.get('extraCharges'))
  const discount = safeFloat(formData.get('discount'))
  
  const totalBill = consultationFee + visitFee + extraCharges - discount
  
  const amountPaidToday = safeFloat(formData.get('amountPaidToday'))
  const previousDue = safeFloat(formData.get('previousDue'))
  
  const totalDue = previousDue + totalBill
  const remainingDue = totalDue - amountPaidToday

  let status = 'Paid'
  if (remainingDue > 0 && amountPaidToday > 0) status = 'Partially Paid'
  else if (remainingDue > 0 && amountPaidToday === 0) status = 'Due'
  else if (remainingDue < 0) status = 'Advance Paid'

  const paymentMode = (formData.get('paymentMode') as string) || 'Cash'
  const paymentDate = safeDate(formData.get('paymentDate'))
  
  const expectedNextPaymentStr = formData.get('expectedNextPayment') as string
  const expectedNextPayment = expectedNextPaymentStr
    ? safeDate(expectedNextPaymentStr, undefined as any)
    : null

  const paymentNotes = (formData.get('paymentNotes') as string)?.trim() || null
  const transactionId = (formData.get('transactionId') as string)?.trim() || null

  try {
    const existing = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!existing) return { error: 'Payment record not found' }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        consultationFee,
        visitFee,
        extraCharges,
        discount,
        totalBill,
        amountPaidToday,
        remainingDue,
        previousDue,
        totalDue,
        status,
        paymentMode,
        paymentDate,
        expectedNextPayment,
        paymentNotes,
        transactionId,
      }
    })

    revalidatePath(`/patients/${existing.patientId}`)
    revalidatePath(`/payments`)
    revalidatePath(`/`)
    
    return { success: true, paymentId: payment.id, patientId: existing.patientId }
  } catch (error: any) {
    console.error('Error updating payment:', error?.message || error)
    return { error: `Failed to update payment: ${error?.message || 'Database error'}` }
  }
}

export async function deletePayment(paymentId: string) {
  try {
    const existing = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!existing) return { error: 'Payment record not found' }

    await prisma.payment.delete({
      where: { id: paymentId }
    })

    revalidatePath(`/patients/${existing.patientId}`)
    revalidatePath(`/payments`)
    revalidatePath(`/`)

    return { success: true, patientId: existing.patientId }
  } catch (error: any) {
    console.error('Error deleting payment:', error?.message || error)
    return { error: `Failed to delete payment: ${error?.message || 'Database error'}` }
  }
}


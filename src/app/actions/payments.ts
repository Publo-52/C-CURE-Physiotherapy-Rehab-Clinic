/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
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

export async function generateInvoiceNumber(): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    })
    
    let maxNum = 0
    if (lastPayment && lastPayment.invoiceNumber.startsWith('INV-')) {
      const parsed = parseInt(lastPayment.invoiceNumber.replace('INV-', ''), 10)
      if (!isNaN(parsed)) maxNum = parsed
    }
    
    const totalCount = await prisma.payment.count()
    const base = Math.max(maxNum, totalCount)
    const candidateNum = base + 1 + attempts
    const invoiceNumber = `INV-${candidateNum.toString().padStart(5, '0')}`

    const existing = await prisma.payment.findUnique({ where: { invoiceNumber } })
    if (!existing) return invoiceNumber
    attempts++
  }
  return `INV-${Date.now().toString().slice(-5)}`
}

export async function createPayment(patientId: string, formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

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

  const invoiceNumber = await generateInvoiceNumber()

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

    // If visit fee was entered, automatically save as patient's standard per-visit fee for future visits
    if (visitFee > 0) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { perVisitFee: visitFee }
      }).catch(err => console.error('Error updating patient perVisitFee:', err))
    }

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
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

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
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

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

export async function getPatientPaymentDefaults(patientId: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        perVisitFee: true,
        payments: {
          select: { totalBill: true, amountPaidToday: true }
        }
      }
    })
    if (!patient) return null
    const totalBilled = patient.payments.reduce((s, p) => s + p.totalBill, 0)
    const totalPaid = patient.payments.reduce((s, p) => s + p.amountPaidToday, 0)
    const previousDue = Math.max(0, totalBilled - totalPaid)
    return {
      perVisitFee: patient.perVisitFee || 0,
      previousDue
    }
  } catch (error: any) {
    console.error('Error fetching payment defaults:', error?.message || error)
    return null
  }
}


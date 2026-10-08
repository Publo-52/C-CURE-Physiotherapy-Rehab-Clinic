/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { calculatePatientBilling } from '@/lib/billing'

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
  const [lastPayment, totalCount] = await Promise.all([
    prisma.payment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    }),
    prisma.payment.count(),
  ])

  let maxNum = 0
  if (lastPayment?.invoiceNumber) {
    const match = lastPayment.invoiceNumber.match(/\d+/)
    if (match) {
      const parsed = parseInt(match[0], 10)
      if (!isNaN(parsed)) maxNum = parsed
    }
  }

  const base = Math.max(maxNum, totalCount)

  for (let attempts = 0; attempts < 15; attempts++) {
    const candidateNum = base + 1 + attempts
    // Pad to 5 digits, or allow natural expansion beyond 99,999 (e.g. INV-100001)
    const numStr = candidateNum < 100000 ? candidateNum.toString().padStart(5, '0') : candidateNum.toString()
    const invoiceNumber = `INV-${numStr}`

    const existing = await prisma.payment.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    })
    if (!existing) return invoiceNumber
  }

  // Guaranteed unique collision-proof fallback
  const uniqueSuffix = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`
  return `INV-${uniqueSuffix}`
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

    // If patient currently has no per-visit fee set (0) and a visit fee was entered, set it as their initial rate
    if (visitFee > 0) {
      const patientRecord = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { perVisitFee: true },
      })
      if (patientRecord && (patientRecord.perVisitFee === 0 || !patientRecord.perVisitFee)) {
        await prisma.patient.update({
          where: { id: patientId },
          data: { perVisitFee: visitFee }
        }).catch(err => console.error('Error updating initial patient perVisitFee:', err))
      }
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
          select: {
            id: true,
            invoiceNumber: true,
            totalBill: true,
            amountPaidToday: true,
            status: true,
            paymentNotes: true,
            visitId: true,
            paymentDate: true,
            visit: { select: { id: true, status: true } },
          }
        },
        visits: {
          select: {
            id: true,
            status: true,
            date: true,
          }
        }
      }
    })
    if (!patient) return null
    const billing = calculatePatientBilling(patient.payments, patient.visits)
    return {
      perVisitFee: patient.perVisitFee || 0,
      previousDue: billing.remainingDue
    }
  } catch (error: any) {
    console.error('Error fetching payment defaults:', error?.message || error)
    return null
  }
}


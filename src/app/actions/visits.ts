/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { generateInvoiceNumber } from './payments'
import { getISTDayBounds } from '@/lib/date-utils'
import { calculatePatientBilling } from '@/lib/billing'

function safeInt(val: any, fallback: number | null = null): number | null {
  if (val === null || val === undefined || val === '') return fallback
  const parsed = parseInt(String(val), 10)
  return isNaN(parsed) ? fallback : parsed
}

export async function createVisit(patientId: string, formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }
  const type = (formData.get('type') as string) || 'Clinic Visit'
  const dateStr = formData.get('date') as string
  const date = dateStr && !isNaN(Date.parse(dateStr)) ? new Date(dateStr) : new Date()
  
  const duration = safeInt(formData.get('duration'), 30)
  const painBefore = safeInt(formData.get('painBefore'), 0)
  const painAfter = safeInt(formData.get('painAfter'), 0)
  const treatmentGiven = (formData.get('treatmentGiven') as string)?.trim() || null
  const exerciseGiven = (formData.get('exerciseGiven') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  try {
    const lastVisit = await prisma.visit.findFirst({
      where: { patientId },
      orderBy: { visitNumber: 'desc' },
      select: { visitNumber: true },
    })
    
    const visitNumber = lastVisit ? lastVisit.visitNumber + 1 : 1

    const visit = await prisma.visit.create({
      data: {
        patientId,
        visitNumber,
        date,
        type,
        duration,
        painBefore,
        painAfter,
        treatmentGiven,
        exerciseGiven,
        notes,
      }
    })

    // 1. Mark patient as completed for today and clear from waiting queue
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        presentStatus: false,
        visitDoneToday: true,
      }
    })

    // 2. Automatically add visit fee payment invoice
    if (patient.perVisitFee > 0) {
      const { todayStart, todayEnd } = getISTDayBounds(date)

      // Check if there was an unlinked auto-billed payment created today from schedule tick
      const unlinkedTodayPayment = await prisma.payment.findFirst({
        where: {
          patientId,
          visitId: null,
          paymentDate: { gte: todayStart, lt: todayEnd },
          paymentNotes: { contains: 'Auto-billed for scheduled visit' }
        }
      })

      if (unlinkedTodayPayment) {
        // Link the pending scheduled visit payment to this recorded visit
        await prisma.payment.update({
          where: { id: unlinkedTodayPayment.id },
          data: { 
            visitId: visit.id,
            paymentNotes: `Auto-billed for Visit #${visitNumber} (${date.toLocaleDateString('en-GB')})`
          }
        })
      } else {
        const pastPayments = await prisma.payment.findMany({
          where: { patientId },
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
        })
        const pastVisits = await prisma.visit.findMany({
          where: { patientId },
          select: { id: true, status: true, date: true }
        })
        const pastBilling = calculatePatientBilling(pastPayments, pastVisits)
        const previousDue = pastBilling.remainingDue

        const visitFee = patient.perVisitFee
        const totalBill = visitFee
        const totalDue = previousDue + totalBill
        const remainingDue = totalDue

        const invoiceNumber = await generateInvoiceNumber()
        await prisma.payment.create({
          data: {
            invoiceNumber,
            patientId,
            visitId: visit.id,
            visitFee,
            totalBill,
            amountPaidToday: 0,
            previousDue,
            remainingDue,
            totalDue,
            status: 'Due',
            paymentMode: 'Cash',
            paymentDate: date,
            paymentNotes: `Auto-billed for recorded visit on ${date.toLocaleDateString('en-GB')}`
          }
        })
      }
    }

    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/patients`)
    revalidatePath(`/payments`)
    revalidatePath(`/calendar`)
    revalidatePath(`/`)
    return { success: true, visitId: visit.id }
  } catch (error: any) {
    console.error('Error creating visit:', error?.message || error)
    return { error: `Failed to record visit: ${error?.message || 'Database error'}` }
  }
}

export async function updateVisit(visitId: string, formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const type = (formData.get('type') as string) || 'Clinic Visit'
  const dateStr = formData.get('date') as string
  const date = dateStr && !isNaN(Date.parse(dateStr)) ? new Date(dateStr) : undefined
  
  const duration = safeInt(formData.get('duration'), 30)
  const painBefore = safeInt(formData.get('painBefore'), 0)
  const painAfter = safeInt(formData.get('painAfter'), 0)
  const treatmentGiven = (formData.get('treatmentGiven') as string)?.trim() || null
  const exerciseGiven = (formData.get('exerciseGiven') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  try {
    const existing = await prisma.visit.findUnique({
      where: { id: visitId }
    })

    if (!existing) {
      return { error: 'Visit record not found.' }
    }

    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: {
        type,
        ...(date && { date }),
        duration,
        painBefore,
        painAfter,
        treatmentGiven,
        exerciseGiven,
        notes,
      }
    })

    revalidatePath(`/patients/${existing.patientId}`)
    revalidatePath(`/patients`)
    revalidatePath(`/payments`)
    revalidatePath(`/calendar`)
    revalidatePath(`/`)
    return { success: true, visitId: updated.id, patientId: existing.patientId }
  } catch (error: any) {
    console.error('Error updating visit:', error?.message || error)
    return { error: `Failed to update visit: ${error?.message || 'Database error'}` }
  }
}

export async function deleteVisit(visitId: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const existing = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        payment: { select: { id: true, amountPaidToday: true } }
      }
    })

    if (!existing) {
      return { error: 'Visit record not found.' }
    }

    await prisma.$transaction(async (tx) => {
      // If the visit has an unpaid auto-billed payment, remove it so the patient isn't billed for a deleted visit
      if (existing.payment && (Number(existing.payment.amountPaidToday) || 0) === 0) {
        await tx.payment.delete({ where: { id: existing.payment.id } })
      }
      await tx.visit.delete({ where: { id: visitId } })
    })

    revalidatePath(`/patients/${existing.patientId}`)
    revalidatePath(`/patients`)
    revalidatePath(`/payments`)
    revalidatePath(`/calendar`)
    revalidatePath(`/`)
    return { success: true, patientId: existing.patientId }
  } catch (error: any) {
    console.error('Error deleting visit:', error?.message || error)
    return { error: `Failed to delete visit: ${error?.message || 'Database error'}` }
  }
}




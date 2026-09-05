/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { generateInvoiceNumber } from './payments'

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

    // 1. Add patient to the Visit Queue on Dashboard
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        presentStatus: true,
        visitDoneToday: false,
      }
    })

    // 2. Automatically add visit fee payment invoice
    if (patient.perVisitFee > 0) {
      const todayStart = new Date(date)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)

      // Check if there was an unlinked auto-billed payment created today (e.g. from the schedule tick)
      const unlinkedTodayPayment = await prisma.payment.findFirst({
        where: {
          patientId,
          visitId: null,
          paymentDate: { gte: todayStart, lt: todayEnd },
          paymentNotes: { contains: 'Auto-billed' }
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
          select: { totalBill: true, amountPaidToday: true }
        })
        const pastBilled = pastPayments.reduce((s, p) => s + p.totalBill, 0)
        const pastPaid = pastPayments.reduce((s, p) => s + p.amountPaidToday, 0)
        const previousDue = Math.max(0, pastBilled - pastPaid)

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



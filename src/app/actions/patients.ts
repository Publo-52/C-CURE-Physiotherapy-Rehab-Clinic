/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { generateInvoiceNumber } from './payments'
import { getISTDayBounds } from '@/lib/date-utils'

function safeInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const parsed = parseInt(String(val), 10)
  return isNaN(parsed) ? null : parsed
}

function safeFloat(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback
  const parsed = parseFloat(String(val))
  return isNaN(parsed) ? fallback : parsed
}

export async function createPatient(formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const age = safeInt(formData.get('age'))
  const gender = (formData.get('gender') as string) || 'Male'
  const disease = (formData.get('disease') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const alternatePhone = (formData.get('alternatePhone') as string)?.trim() || null
  const whatsapp = (formData.get('whatsapp') as string)?.trim() || null
  const aadhaar = (formData.get('aadhaar') as string)?.trim() || null
  const chiefComplaint = (formData.get('chiefComplaint') as string)?.trim() || null
  const diagnosis = (formData.get('diagnosis') as string)?.trim() || null
  const medicalHistory = (formData.get('medicalHistory') as string)?.trim() || null
  const currentMedication = (formData.get('currentMedication') as string)?.trim() || null
  const emerContactName = (formData.get('emerContactName') as string)?.trim() || null
  const emerContactPhone = (formData.get('emerContactPhone') as string)?.trim() || null
  const status = (formData.get('status') as string) || 'Active'
  const perVisitFee = safeFloat(formData.get('perVisitFee'), 0)

  if (!name || !phone) {
    return { error: 'Name and Phone are required.' }
  }

  // Auto-generate Patient ID (e.g., P-0001) with concurrency collision handling
  let patientId = ''
  let attempts = 0
  while (attempts < 10) {
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { patientId: 'desc' },
      select: { patientId: true },
    })
    
    let maxNum = 0
    if (lastPatient && lastPatient.patientId.startsWith('P-')) {
      const lastNum = parseInt(lastPatient.patientId.replace('P-', ''), 10)
      if (!isNaN(lastNum)) maxNum = lastNum
    }
    const totalCount = await prisma.patient.count()
    const base = Math.max(maxNum, totalCount)
    const nextIdNum = base + 1 + attempts
    patientId = `P-${nextIdNum.toString().padStart(4, '0')}`

    const existing = await prisma.patient.findUnique({ where: { patientId } })
    if (!existing) break
    attempts++
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        patientId,
        name,
        phone,
        age,
        gender,
        disease,
        address,
        email,
        alternatePhone,
        whatsapp,
        aadhaar,
        chiefComplaint,
        diagnosis,
        medicalHistory,
        currentMedication,
        emerContactName,
        emerContactPhone,
        status,
        perVisitFee,
      }
    })

    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true, patientId: patient.id }
  } catch (error: any) {
    console.error('Error creating patient:', error?.message || error)
    return { error: `Failed to create patient: ${error?.message || 'Database error'}` }
  }
}

export async function updatePatient(id: string, formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const age = safeInt(formData.get('age'))
  const gender = (formData.get('gender') as string) || 'Male'
  const disease = (formData.get('disease') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const alternatePhone = (formData.get('alternatePhone') as string)?.trim() || null
  const whatsapp = (formData.get('whatsapp') as string)?.trim() || null
  const aadhaar = (formData.get('aadhaar') as string)?.trim() || null
  const chiefComplaint = (formData.get('chiefComplaint') as string)?.trim() || null
  const diagnosis = (formData.get('diagnosis') as string)?.trim() || null
  const medicalHistory = (formData.get('medicalHistory') as string)?.trim() || null
  const currentMedication = (formData.get('currentMedication') as string)?.trim() || null
  const emerContactName = (formData.get('emerContactName') as string)?.trim() || null
  const emerContactPhone = (formData.get('emerContactPhone') as string)?.trim() || null
  const status = (formData.get('status') as string) || 'Active'
  const perVisitFee = safeFloat(formData.get('perVisitFee'), 0)

  if (!name || !phone) {
    return { error: 'Name and Phone are required.' }
  }

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name,
        phone,
        age,
        gender,
        disease,
        address,
        email,
        alternatePhone,
        whatsapp,
        aadhaar,
        chiefComplaint,
        diagnosis,
        medicalHistory,
        currentMedication,
        emerContactName,
        emerContactPhone,
        status,
        perVisitFee,
      }
    })

    let unbilledCount = 0

    // If perVisitFee is set (> 0), automatically create invoices for any past unbilled visits
    if (perVisitFee > 0) {
      const unbilledVisits = await prisma.visit.findMany({
        where: {
          patientId: id,
          payment: null,
        },
        orderBy: { date: 'asc' }
      })

      for (const visit of unbilledVisits) {
        const currentPayments = await prisma.payment.findMany({
          where: { patientId: id },
          select: { totalBill: true, amountPaidToday: true }
        })
        const pastBilled = currentPayments.reduce((s, p) => s + p.totalBill, 0)
        const pastPaid = currentPayments.reduce((s, p) => s + p.amountPaidToday, 0)
        const previousDue = Math.max(0, pastBilled - pastPaid)

        const visitFee = perVisitFee
        const totalBill = visitFee
        const totalDue = previousDue + totalBill
        const remainingDue = totalDue

        const invoiceNumber = await generateInvoiceNumber()
        await prisma.payment.create({
          data: {
            invoiceNumber,
            patientId: id,
            visitId: visit.id,
            visitFee,
            totalBill,
            amountPaidToday: 0,
            previousDue,
            remainingDue,
            totalDue,
            status: 'Due',
            paymentMode: 'Cash',
            paymentDate: visit.date,
            paymentNotes: `Auto-billed for Visit #${visit.visitNumber} (${new Date(visit.date).toLocaleDateString('en-GB')})`
          }
        })
        unbilledCount++
      }
    }

    revalidatePath(`/patients/${id}`)
    revalidatePath('/patients')
    revalidatePath('/payments')
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true, patientId: patient.id, unbilledCount }
  } catch (error: any) {
    console.error('Error updating patient:', error?.message || error)
    return { error: `Failed to update patient: ${error?.message || 'Database error'}` }
  }
}

export async function deletePatient(id: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    // Delete all child relations atomically inside a transaction
    await prisma.$transaction([
      prisma.treatmentPlan.deleteMany({ where: { patientId: id } }),
      prisma.payment.deleteMany({ where: { patientId: id } }),
      prisma.visit.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } }),
    ])

    revalidatePath('/patients')
    revalidatePath('/payments')
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting patient:', error?.message || error)
    return { error: `Failed to delete patient: ${error?.message || 'Database error'}` }
  }
}

export async function togglePresentStatus(id: string, status: boolean) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const { todayStart, todayEnd } = getISTDayBounds()

    const patient = await prisma.patient.update({
      where: { id },
      data: { 
        presentStatus: status,
        visitDoneToday: false
      }
    })

    if (status) {
      // Checked / Scheduled for visit today: add visit fee if perVisitFee is configured
      if (patient.perVisitFee > 0) {
        // Prevent duplicate schedule billing for today (check unlinked schedule bill specifically)
        const existingSchedulePaymentToday = await prisma.payment.findFirst({
          where: {
            patientId: id,
            visitId: null,
            paymentDate: {
              gte: todayStart,
              lt: todayEnd
            },
            paymentNotes: { contains: 'Auto-billed for scheduled visit' }
          }
        })

        if (!existingSchedulePaymentToday) {
          const pastPayments = await prisma.payment.findMany({
            where: { patientId: id },
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
              patientId: id,
              visitFee,
              totalBill,
              amountPaidToday: 0,
              previousDue,
              remainingDue,
              totalDue,
              status: 'Due',
              paymentMode: 'Cash',
              paymentDate: new Date(),
              paymentNotes: `Auto-billed for scheduled visit on ${new Date().toLocaleDateString('en-GB')}`
            }
          })
        }
      }
    } else {
      // Unchecked / Removed from visit: reverse ONLY unpaid auto-billed SCHEDULE payment (where visitId is null)
      // This guarantees real recorded visits (which have a non-null visitId) are NEVER deleted!
      const autoBilledSchedulePayment = await prisma.payment.findFirst({
        where: {
          patientId: id,
          visitId: null,
          paymentDate: {
            gte: todayStart,
            lt: todayEnd
          },
          amountPaidToday: 0,
          paymentNotes: { contains: 'Auto-billed for scheduled visit' }
        }
      })

      if (autoBilledSchedulePayment) {
        await prisma.payment.delete({
          where: { id: autoBilledSchedulePayment.id }
        })
      }
    }

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}`)
    revalidatePath('/payments')
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true, presentStatus: patient.presentStatus }
  } catch (error: any) {
    console.error('Error toggling present status:', error?.message || error)
    return { error: `Failed to update status: ${error?.message || 'Database error'}` }
  }
}

export async function markVisitDone(id: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const { todayStart, todayEnd } = getISTDayBounds()

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        presentStatus: false,
        visitDoneToday: true
      }
    })

    let visitRecordId = ''

    // Check if visit record for today already exists
    const existingTodayVisit = await prisma.visit.findFirst({
      where: {
        patientId: id,
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    })

    if (existingTodayVisit) {
      await prisma.visit.update({
        where: { id: existingTodayVisit.id },
        data: { status: 'Completed' }
      })
      visitRecordId = existingTodayVisit.id
    } else {
      const lastVisit = await prisma.visit.findFirst({
        where: { patientId: id },
        orderBy: { visitNumber: 'desc' }
      })
      const visitNumber = lastVisit ? lastVisit.visitNumber + 1 : 1

      const newVisit = await prisma.visit.create({
        data: {
          patientId: id,
          visitNumber,
          date: new Date(),
          type: 'Clinic Visit',
          status: 'Completed',
          treatmentGiven: patient.disease || 'General Treatment',
          notes: 'Completed via Visit Queue'
        }
      })
      visitRecordId = newVisit.id
    }

    // Link or generate auto-billing for completed visit ONLY if this visit doesn't already have an invoice
    if (visitRecordId) {
      const existingPaymentForVisit = await prisma.payment.findUnique({
        where: { visitId: visitRecordId }
      })

      if (!existingPaymentForVisit) {
        const schedulePaymentToday = await prisma.payment.findFirst({
          where: {
            patientId: id,
            visitId: null,
            paymentDate: { gte: todayStart, lt: todayEnd },
            paymentNotes: { contains: 'Auto-billed' }
          }
        })

        if (schedulePaymentToday) {
          await prisma.payment.update({
            where: { id: schedulePaymentToday.id },
            data: { visitId: visitRecordId }
          })
        } else if (patient.perVisitFee > 0) {
          const pastPayments = await prisma.payment.findMany({
            where: { patientId: id },
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
              patientId: id,
              visitId: visitRecordId,
              visitFee,
              totalBill,
              amountPaidToday: 0,
              previousDue,
              remainingDue,
              totalDue,
              status: 'Due',
              paymentMode: 'Cash',
              paymentDate: new Date(),
              paymentNotes: `Auto-billed for visit on ${new Date().toLocaleDateString('en-GB')}`
            }
          })
        }
      }
    }

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}`)
    revalidatePath('/payments')
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true, visitDoneToday: patient.visitDoneToday }
  } catch (error: any) {
    console.error('Error marking visit as done:', error?.message || error)
    return { error: `Failed to mark visit done: ${error?.message || 'Database error'}` }
  }
}

export async function getPatientPDFData(id: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { patient: null, profile: null }
  }

  try {
    const [patient, profile] = await Promise.all([
      prisma.patient.findUnique({
        where: { id },
        include: {
          payments: { orderBy: { paymentDate: 'desc' } },
          visits: { orderBy: { date: 'desc' } },
        }
      }),
      prisma.clinicProfile.findFirst()
    ])
    return { patient, profile }
  } catch (error: any) {
    console.error('Error fetching patient PDF data:', error)
    return { patient: null, profile: null }
  }
}


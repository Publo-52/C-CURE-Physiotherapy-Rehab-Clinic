/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function updateVisitDate(visitId: string, newDateStr: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const newDate = new Date(newDateStr)
    // Try to update standard visit first
    const originalVisit = await prisma.visit.findUnique({
      where: { id: visitId }
    })

    if (originalVisit) {
      const originalTime = new Date(originalVisit.date)
      newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds())
      await prisma.visit.update({
        where: { id: visitId },
        data: { date: newDate }
      })
    } else {
      // If it's a general event
      const originalEvent = await prisma.event.findUnique({
        where: { id: visitId }
      })
      if (originalEvent) {
        const originalTime = new Date(originalEvent.date)
        newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds())
        await prisma.event.update({
          where: { id: visitId },
          data: { date: newDate }
        })
      }
    }
    
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating visit/event date:', error?.message || error)
    return { error: 'Failed to reschedule' }
  }
}

export async function createScheduledVisit(data: {
  patientId: string
  date: string
  type: string
  duration?: number
  treatmentGiven?: string
  exerciseGiven?: string
  notes?: string
}) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const { patientId, date, type, duration = 30, treatmentGiven, exerciseGiven, notes } = data
    if (!patientId || !date || !type) {
      return { error: 'Patient, Date, and Type are required.' }
    }

    const lastVisit = await prisma.visit.findFirst({
      where: { patientId },
      orderBy: { visitNumber: 'desc' },
    })
    const visitNumber = lastVisit ? lastVisit.visitNumber + 1 : 1

    const visit = await prisma.visit.create({
      data: {
        patientId,
        visitNumber,
        date: new Date(date),
        type,
        duration,
        treatmentGiven,
        exerciseGiven,
        notes,
        status: 'Scheduled',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            patientId: true,
            phone: true,
          }
        }
      }
    })

    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true, visit }
  } catch (error: any) {
    console.error('Error creating scheduled visit:', error)
    return { error: error.message || 'Failed to create visit' }
  }
}

export async function deleteVisit(visitId: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, patientId: true, payment: { select: { id: true, amountPaidToday: true } } }
    })

    if (!visit) return { error: 'Visit not found' }

    await prisma.$transaction(async (tx) => {
      // If the visit has an unpaid auto-billed payment, remove it so the patient isn't billed for a cancelled visit
      if (visit.payment && visit.payment.amountPaidToday === 0) {
        await tx.payment.delete({ where: { id: visit.payment.id } })
      }
      await tx.visit.delete({ where: { id: visitId } })
    })

    revalidatePath('/calendar')
    revalidatePath('/payments')
    revalidatePath(`/patients/${visit.patientId}`)
    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting visit:', error)
    return { error: 'Failed to delete visit' }
  }
}

export async function createEvent(data: {
  title: string
  date: string
  type: string
  duration?: number
  description?: string
}) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const { title, date, type, duration = 30, description } = data
    if (!title || !date || !type) {
      return { error: 'Title, Date, and Type are required.' }
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        type,
        duration,
        description,
      }
    })

    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true, event }
  } catch (error: any) {
    console.error('Error creating event:', error)
    return { error: error.message || 'Failed to create event' }
  }
}

export async function deleteEvent(eventId: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    await prisma.event.delete({
      where: { id: eventId }
    })
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return { error: 'Failed to delete event' }
  }
}




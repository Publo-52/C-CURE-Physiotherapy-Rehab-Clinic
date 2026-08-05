/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateVisitDate(visitId: string, newDateStr: string) {
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
  try {
    await prisma.visit.delete({
      where: { id: visitId }
    })
    revalidatePath('/calendar')
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




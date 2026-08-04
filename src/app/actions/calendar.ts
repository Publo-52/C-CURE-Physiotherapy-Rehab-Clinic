'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateVisitDate(visitId: string, newDateStr: string) {
  try {
    const newDate = new Date(newDateStr)
    // Preserve the original time if possible, or just set to midnight if it's a pure date drop.
    // HTML5 drag and drop on a calendar usually moves it to a new day.
    
    // Fetch original visit to preserve time
    const originalVisit = await prisma.visit.findUnique({
      where: { id: visitId }
    })

    if (originalVisit) {
      const originalTime = new Date(originalVisit.date)
      newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds())
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { date: newDate }
    })
    
    revalidatePath('/calendar')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating visit date:', error?.message || error)
    return { error: 'Failed to update visit date' }
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


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

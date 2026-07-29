'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createVisit(patientId: string, formData: FormData) {
  const type = formData.get('type') as string
  const date = new Date(formData.get('date') as string)
  const duration = parseInt(formData.get('duration') as string) || 30
  const painBefore = parseInt(formData.get('painBefore') as string) || 0
  const painAfter = parseInt(formData.get('painAfter') as string) || 0
  const treatmentGiven = formData.get('treatmentGiven') as string
  const exerciseGiven = formData.get('exerciseGiven') as string
  const notes = formData.get('notes') as string

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

    revalidatePath(`/patients/${patientId}`)
    return { success: true, visitId: visit.id }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to record visit.' }
  }
}

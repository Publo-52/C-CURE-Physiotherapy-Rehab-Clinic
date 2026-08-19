/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

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

    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/calendar`)
    revalidatePath(`/`)
    return { success: true, visitId: visit.id }
  } catch (error: any) {
    console.error('Error creating visit:', error?.message || error)
    return { error: `Failed to record visit: ${error?.message || 'Database error'}` }
  }
}



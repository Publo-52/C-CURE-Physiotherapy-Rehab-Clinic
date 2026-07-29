'use server'

import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPatient(formData: FormData) {
  // Extract all fields
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const age = formData.get('age') ? parseInt(formData.get('age') as string) : null
  const gender = formData.get('gender') as string
  const disease = formData.get('disease') as string
  const address = formData.get('address') as string

  if (!name || !phone) {
    return { error: 'Name and Phone are required.' }
  }

  // Auto-generate Patient ID (e.g., P-0001)
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  
  let nextIdNum = 1
  if (lastPatient && lastPatient.patientId.startsWith('P-')) {
    const lastNum = parseInt(lastPatient.patientId.replace('P-', ''))
    if (!isNaN(lastNum)) {
      nextIdNum = lastNum + 1
    }
  }
  const patientId = `P-${nextIdNum.toString().padStart(4, '0')}`

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
        // We can add other fields here based on the form
      }
    })

    revalidatePath('/patients')
    // We can't redirect directly inside a try-catch cleanly if we want to catch DB errors,
    // so we return the success ID and redirect on the client, or redirect after the try block.
    return { success: true, patientId: patient.id }
  } catch (error: any) {
    console.error(error)
    return { error: 'Failed to create patient.' }
  }
}

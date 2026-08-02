'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function safeInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const parsed = parseInt(String(val), 10)
  return isNaN(parsed) ? null : parsed
}

export async function createPatient(formData: FormData) {
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

  if (!name || !phone) {
    return { error: 'Name and Phone are required.' }
  }

  // Auto-generate Patient ID (e.g., P-0001)
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  
  let nextIdNum = 1
  if (lastPatient && lastPatient.patientId.startsWith('P-')) {
    const lastNum = parseInt(lastPatient.patientId.replace('P-', ''), 10)
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
      }
    })

    revalidatePath(`/patients/${id}`)
    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true, patientId: patient.id }
  } catch (error: any) {
    console.error('Error updating patient:', error?.message || error)
    return { error: `Failed to update patient: ${error?.message || 'Database error'}` }
  }
}

export async function deletePatient(id: string) {
  try {
    // Delete all child relations explicitly first to prevent foreign key errors in SQLite
    await prisma.treatmentPlan.deleteMany({ where: { patientId: id } })
    await prisma.payment.deleteMany({ where: { patientId: id } })
    await prisma.visit.deleteMany({ where: { patientId: id } })
    await prisma.patient.delete({
      where: { id }
    })

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
  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: { 
        presentStatus: status,
        visitDoneToday: false
      }
    })
    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true, presentStatus: patient.presentStatus }
  } catch (error: any) {
    console.error('Error toggling present status:', error?.message || error)
    return { error: `Failed to update status: ${error?.message || 'Database error'}` }
  }
}

export async function markVisitDone(id: string) {
  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        presentStatus: false,
        visitDoneToday: true
      }
    })
    revalidatePath('/patients')
    revalidatePath('/')
    return { success: true, visitDoneToday: patient.visitDoneToday }
  } catch (error: any) {
    console.error('Error marking visit as done:', error?.message || error)
    return { error: `Failed to mark visit done: ${error?.message || 'Database error'}` }
  }
}

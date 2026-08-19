/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

function safeInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  const parsed = parseInt(String(val), 10)
  return isNaN(parsed) ? null : parsed
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

  if (!name || !phone) {
    return { error: 'Name and Phone are required.' }
  }

  // Auto-generate Patient ID (e.g., P-0001) with concurrency collision handling
  let patientId = ''
  let attempts = 0
  while (attempts < 5) {
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: 'desc' },
    })
    
    let nextIdNum = 1 + attempts
    if (lastPatient && lastPatient.patientId.startsWith('P-')) {
      const lastNum = parseInt(lastPatient.patientId.replace('P-', ''), 10)
      if (!isNaN(lastNum)) {
        nextIdNum = lastNum + 1 + attempts
      }
    }
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
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

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
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

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
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        presentStatus: false,
        visitDoneToday: true
      }
    })

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
    } else {
      const lastVisit = await prisma.visit.findFirst({
        where: { patientId: id },
        orderBy: { visitNumber: 'desc' }
      })
      const visitNumber = lastVisit ? lastVisit.visitNumber + 1 : 1

      await prisma.visit.create({
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
    }

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}`)
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


'use server'

import { cache } from 'react'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const getClinicProfile = cache(async () => {
  try {
    let profile = await prisma.clinicProfile.findFirst()
    if (!profile) {
      profile = await prisma.clinicProfile.create({
        data: {
          practitionerName: 'Sanatan Manna',
          clinicName: 'C-CURE Physiotherapy & Rehab Clinic',
          phone: '7942688985',
          email: 'sanatan.manna28072015@gmail.com',
          address: 'Moyna Hospital, More Moyna, Tamluk, Moyna, Midnapore-721629, West Bengal',
          about: 'C Cure Physiotherapy & Rehab Clinic is a dedicated clinic in Moyna, Midnapore, that offers high-quality healthcare services to patients of all ages. The clinic operates 24 hours, 7 days a week.',
          workingHours: 'Open 24 Hours — Monday to Sunday',
          defaultFee: 500,
        }
      })
    }
    return profile
  } catch (error) {
    return null
  }
})

export async function updateClinicProfile(formData: FormData) {
  try {
    const practitionerName = (formData.get('practitionerName') as string)?.trim()
    const clinicName = (formData.get('clinicName') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim()
    const email = (formData.get('email') as string)?.trim() || 'sanatan.manna28072015@gmail.com'
    const address = (formData.get('address') as string)?.trim()
    const about = (formData.get('about') as string)?.trim()
    const workingHours = (formData.get('workingHours') as string)?.trim()
    const defaultFee = parseInt(formData.get('defaultFee') as string) || 500

    if (!practitionerName || !clinicName || !phone) {
      return { error: 'Name, Clinic Name, and Phone are required.' }
    }

    const existing = await prisma.clinicProfile.findFirst()
    if (existing) {
      await prisma.clinicProfile.update({
        where: { id: existing.id },
        data: { practitionerName, clinicName, phone, email, address, about, workingHours, defaultFee }
      })
    } else {
      await prisma.clinicProfile.create({
        data: { practitionerName, clinicName, phone, email, address, about, workingHours, defaultFee }
      })
    }

    revalidatePath('/settings')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating clinic profile:', error)
    return { error: error.message || 'Failed to update profile.' }
  }
}

'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function updateAdminPassword(formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword) {
    return { error: 'Current and new password are required.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' }
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters.' }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId }
    })

    if (!admin) {
      return { error: 'Admin account not found.' }
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isValid) {
      return { error: 'Incorrect current password.' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    revalidatePath('/settings')
    return { success: true, message: 'Password updated successfully.' }
  } catch (error: any) {
    console.error('Error updating password:', error)
    return { error: 'Failed to update password.' }
  }
}

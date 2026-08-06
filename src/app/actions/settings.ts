/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

export async function getAdminAccounts() {
  const session = await verifySession()
  if (!session || !session.userId) return { currentAdmin: null, currentSessionToken: null, accounts: [] }

  try {
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!currentAdmin) return { currentAdmin: null, currentSessionToken: null, accounts: [] }

    const isSuperAdmin = currentAdmin.role === 'Super Admin'
    const now = new Date()

    const accounts = await prisma.admin.findMany({
      where: isSuperAdmin ? undefined : { id: currentAdmin.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        sessions: {
          where: { expiresAt: { gte: now } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            token: true,
            ipAddress: true,
            userAgent: true,
            deviceType: true,
            createdAt: true,
            expiresAt: true,
          }
        }
      }
    })

    return { 
      currentAdmin, 
      currentSessionToken: session.sessionToken || null, 
      accounts 
    }
  } catch (error) {
    console.error('Error fetching admin accounts:', error)
    return { currentAdmin: null, currentSessionToken: null, accounts: [] }
  }
}

export async function revokeActiveSession(sessionId: string) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  try {
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true }
    })

    if (!currentAdmin) return { error: 'Admin account not found.' }

    const targetSession = await prisma.activeSession.findUnique({
      where: { id: sessionId }
    })

    if (!targetSession) {
      return { error: 'Session not found or already expired.' }
    }

    const isSuperAdmin = currentAdmin.role === 'Super Admin'
    const isSelfSession = targetSession.adminId === currentAdmin.id

    if (!isSuperAdmin && !isSelfSession) {
      return { error: 'Unauthorized to remove another user\'s device session.' }
    }

    await prisma.activeSession.delete({
      where: { id: sessionId }
    })

    revalidatePath('/settings')
    return { success: true, message: 'Device session removed successfully!' }
  } catch (error: any) {
    console.error('Error revoking active session:', error)
    return { error: error?.message || 'Failed to remove device session.' }
  }
}

export async function updateUserAccount(targetId: string, formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const currentAdmin = await prisma.admin.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true }
  })

  if (!currentAdmin) return { error: 'Admin account not found.' }

  const isSuperAdmin = currentAdmin.role === 'Super Admin'
  const isSelf = currentAdmin.id === targetId

  if (!isSuperAdmin && !isSelf) {
    return { error: 'Unauthorized. Only Super Admin can modify other user accounts.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const role = (formData.get('role') as string)?.trim()

  if (!name || !email) {
    return { error: 'Name and Email are required.' }
  }

  try {
    const existing = await prisma.admin.findFirst({
      where: {
        email,
        NOT: { id: targetId }
      }
    })
    if (existing) {
      return { error: 'Email address is already in use by another user.' }
    }

    const updateData: any = { name, email }

    if (isSuperAdmin && role && (role === 'Admin' || role === 'Super Admin')) {
      updateData.role = role
    }

    if (password) {
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.admin.update({
      where: { id: targetId },
      data: updateData,
    })

    revalidatePath('/settings')
    return { success: true, message: 'Account updated successfully!' }
  } catch (error: any) {
    console.error('Error updating user account:', error)
    return { error: error?.message || 'Failed to update user account.' }
  }
}

export async function updateOwnAccount(formData: FormData) {
  const session = await verifySession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized. Please login again.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!name) {
    return { error: 'Name / Username is required.' }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId }
    })

    if (!admin) {
      return { error: 'Account not found.' }
    }

    const updateData: any = { name }

    if (newPassword) {
      if (!currentPassword) {
        return { error: 'Current password is required to set a new password.' }
      }
      const isValid = await bcrypt.compare(currentPassword, admin.password)
      if (!isValid) {
        return { error: 'Incorrect current password.' }
      }
      if (newPassword !== confirmPassword) {
        return { error: 'New passwords do not match.' }
      }
      if (newPassword.length < 6) {
        return { error: 'New password must be at least 6 characters.' }
      }
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData
    })

    revalidatePath('/settings')
    return { success: true, message: 'Your username and account settings have been updated!' }
  } catch (error: any) {
    console.error('Error updating account:', error)
    return { error: error?.message || 'Failed to update account.' }
  }
}


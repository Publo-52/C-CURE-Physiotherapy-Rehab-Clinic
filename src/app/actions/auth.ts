'use server'

import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    return { error: 'Invalid credentials' }
  }

  const isValidPassword = await bcrypt.compare(password, admin.password)

  if (!isValidPassword) {
    return { error: 'Invalid credentials' }
  }

  try {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    })
  } catch (error) {
    console.warn('Could not update lastLogin.', error)
  }

  // createSession enforces the 3-device limit
  const result = await createSession(admin.id)
  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}

export async function logout() {
  await deleteSession()
  // Navigation is handled by the caller (client component via router.push)
}

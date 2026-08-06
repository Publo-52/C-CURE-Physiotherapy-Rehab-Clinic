'use server'

import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

import { headers } from 'next/headers'
import { parseDeviceInfo } from '@/lib/device-parser'

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

  // Extract client device details & IP address
  const reqHeaders = await headers()
  const rawIp = 
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    reqHeaders.get('x-real-ip') ||
    '127.0.0.1'
  const ipAddress = rawIp === '::1' || rawIp === '::ffff:127.0.0.1' ? '127.0.0.1 (Localhost)' : rawIp

  const userAgent = reqHeaders.get('user-agent') || 'Unknown Browser'
  const clientDeviceHint = (formData.get('clientDeviceName') as string)?.trim()

  const parsedInfo = parseDeviceInfo(userAgent)
  const deviceType = clientDeviceHint || parsedInfo.fullLabel

  // createSession enforces device limits and saves device metadata
  const result = await createSession(admin.id, { ipAddress, userAgent, deviceType })
  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

'use server'

import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

import { headers } from 'next/headers'
import { parseDeviceInfo } from '@/lib/device-parser'

interface RateLimitRecord {
  attempts: number
  lockedUntil?: number
  firstAttemptAt: number
}

// In-memory rate limiting map (5 attempts in 15 mins -> 5 min lockout)
const loginAttempts = new Map<string, RateLimitRecord>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(key: string): { blocked: boolean; message?: string } {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record) return { blocked: false }

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
    return {
      blocked: true,
      message: `Too many failed login attempts. Account temporarily locked. Please try again in ${timeStr}.`
    }
  }

  if (now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    loginAttempts.delete(key)
    return { blocked: false }
  }

  return { blocked: false }
}

function recordFailedAttempt(key: string) {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record || now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    loginAttempts.set(key, { attempts: 1, firstAttemptAt: now })
  } else {
    record.attempts += 1
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS
    }
  }

  // Periodic pruning of expired entries
  if (loginAttempts.size > 200) {
    for (const [k, v] of loginAttempts.entries()) {
      if (now - v.firstAttemptAt > WINDOW_DURATION_MS && (!v.lockedUntil || v.lockedUntil <= now)) {
        loginAttempts.delete(k)
      }
    }
  }
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Extract client IP address for rate-limiting key
  const reqHeaders = await headers()
  const rawIp = 
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    reqHeaders.get('x-real-ip') ||
    '127.0.0.1'
  const rateLimitKey = `${rawIp}_${email}`

  // Check rate limit status
  const rateLimitStatus = checkRateLimit(rateLimitKey)
  if (rateLimitStatus.blocked) {
    return { error: rateLimitStatus.message }
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    recordFailedAttempt(rateLimitKey)
    return { error: 'Invalid credentials' }
  }

  const isValidPassword = await bcrypt.compare(password, admin.password)

  if (!isValidPassword) {
    recordFailedAttempt(rateLimitKey)
    return { error: 'Invalid credentials' }
  }

  // Reset rate limit on successful authentication
  loginAttempts.delete(rateLimitKey)

  try {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    })
  } catch (error) {
    console.warn('Could not update lastLogin.', error)
  }

  // Client device details & IP address
  const ipAddress = rawIp === '::1' || rawIp === '::ffff:127.0.0.1' ? '127.0.0.1 (Localhost)' : rawIp

  const userAgent = reqHeaders.get('user-agent') || 'Unknown Browser'
  const secChModel = reqHeaders.get('sec-ch-ua-model')?.replace(/"/g, '')?.trim()
  const clientDeviceHint = (formData.get('clientDeviceName') as string)?.trim() || secChModel

  const parsedInfo = parseDeviceInfo(userAgent, clientDeviceHint)
  const deviceType = parsedInfo.fullLabel

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

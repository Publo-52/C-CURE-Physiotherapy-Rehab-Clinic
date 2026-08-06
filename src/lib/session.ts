/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

const secretKey = process.env.JWT_SECRET || 'super-secret-phisiyo-key'
const key = new TextEncoder().encode(secretKey)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_DEVICES = 3

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function createSession(userId: string): Promise<{ error?: string }> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS)

  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // Clean up any expired sessions for this user first
  await prisma.activeSession.deleteMany({
    where: { adminId: userId, expiresAt: { lt: now } },
  })

  // Enforce 3-device limit ONLY for regular 'Admin' (Super Admin gets unlimited device logins)
  if (admin?.role !== 'Super Admin') {
    const activeCount = await prisma.activeSession.count({
      where: { adminId: userId },
    })

    if (activeCount >= MAX_DEVICES) {
      return {
        error: `Maximum ${MAX_DEVICES} devices are already logged in for this Admin account. Please log out from another device first.`,
      }
    }
  }

  // Generate a unique token to identify this session in the DB
  const sessionToken = randomUUID()

  // Save the session record in DB
  await prisma.activeSession.create({
    data: {
      adminId: userId,
      token: sessionToken,
      expiresAt,
    },
  })

  // Embed the sessionToken & role inside the JWT cookie
  const session = await encrypt({ userId, sessionToken, role: admin?.role || 'Admin', expires: expiresAt })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return {}
}

import { cache } from 'react'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null

  try {
    const payload = await decrypt(sessionCookie)

    // Also verify the session token still exists in the DB (not revoked)
    if (payload.sessionToken) {
      const dbSession = await prisma.activeSession.findUnique({
        where: { token: payload.sessionToken },
        include: {
          admin: { select: { id: true, email: true, name: true, role: true } }
        }
      })
      if (!dbSession || dbSession.expiresAt < new Date()) return null
      return {
        ...payload,
        role: dbSession.admin.role,
        user: dbSession.admin
      }
    }

    return payload
  } catch {
    return null
  }
})

export async function deleteSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie)
      if (payload.sessionToken) {
        // Remove the session from DB so the slot is freed
        await prisma.activeSession.deleteMany({
          where: { token: payload.sessionToken },
        })
      }
    } catch {
      // Cookie is invalid/expired — nothing to clean up in DB
    }
  }

  cookieStore.delete('session')
}


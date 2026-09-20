import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'
import prisma from '@/lib/prisma'

const protectedPrefixes = ['/', '/patients', '/payments', '/calendar', '/settings']
const publicRoutes = ['/login']

interface CachedSession {
  valid: boolean
  cachedUntil: number
}

// In-memory fast path cache to eliminate redundant PostgreSQL network round-trips (60s TTL)
const sessionCache = new Map<string, CachedSession>()
const CACHE_TTL_MS = 60 * 1000

function pruneCache() {
  if (sessionCache.size > 200) {
    const now = Date.now()
    for (const [key, val] of sessionCache.entries()) {
      if (val.cachedUntil <= now) {
        sessionCache.delete(key)
      }
    }
  }
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtectedRoute =
    protectedPrefixes.some((prefix) =>
      prefix === '/' ? path === '/' : path === prefix || path.startsWith(prefix + '/')
    )
  const isPublicRoute = publicRoutes.includes(path)

  const sessionCookie = req.cookies.get('session')?.value

  let session: Record<string, unknown> | null = null
  let isSessionValidInDb = false

  if (sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie)
      if (payload?.sessionToken) {
        const now = Date.now()
        const cached = sessionCache.get(payload.sessionToken)

        if (cached && cached.cachedUntil > now) {
          isSessionValidInDb = cached.valid
          if (cached.valid) {
            session = payload
          }
        } else {
          // Verify session token is STILL in DB and user account still exists
          const dbSession = await prisma.activeSession.findUnique({
            where: { token: payload.sessionToken },
            select: { id: true, expiresAt: true, admin: { select: { id: true } } }
          })
          const isValid = Boolean(dbSession && dbSession.expiresAt > new Date() && dbSession.admin)
          isSessionValidInDb = isValid
          if (isValid) {
            session = payload
          }

          pruneCache()
          sessionCache.set(payload.sessionToken, {
            valid: isValid,
            cachedUntil: now + CACHE_TTL_MS
          })
        }
      }
    } catch {
      session = null
      isSessionValidInDb = false
    }
  }

  // If user has a session cookie but it's revoked/invalid in DB:
  if (sessionCookie && !isSessionValidInDb) {
    if (isProtectedRoute) {
      const res = NextResponse.redirect(new URL('/login', req.nextUrl))
      res.cookies.delete('session')
      return res
    }
    if (isPublicRoute) {
      const res = NextResponse.next()
      res.cookies.delete('session')
      return res
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (!session && isProtectedRoute) {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl))
    res.cookies.delete('session')
    return res
  }

  // Redirect already-logged-in users away from the login page
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  const res = NextResponse.next()
  res.headers.set('Accept-CH', 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version')
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

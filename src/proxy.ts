import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'
import prisma from '@/lib/prisma'

const protectedPrefixes = ['/', '/patients', '/payments', '/calendar', '/settings']
const publicRoutes = ['/login']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtectedRoute =
    protectedPrefixes.some((prefix) =>
      prefix === '/' ? path === '/' : path === prefix || path.startsWith(prefix + '/')
    )
  const isPublicRoute = publicRoutes.includes(path)

  const sessionCookie = req.cookies.get('session')?.value

  let session: any = null
  let isSessionValidInDb = false

  if (sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie)
      if (payload?.sessionToken) {
        // Verify session token is STILL in DB and user account still exists
        const dbSession = await prisma.activeSession.findUnique({
          where: { token: payload.sessionToken },
          select: { id: true, expiresAt: true, admin: { select: { id: true } } }
        })
        if (dbSession && dbSession.expiresAt > new Date() && dbSession.admin) {
          session = payload
          isSessionValidInDb = true
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

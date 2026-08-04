import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedPrefixes = ['/', '/patients', '/payments', '/calendar', '/settings']
const publicRoutes = ['/login']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtectedRoute =
    protectedPrefixes.some((prefix) =>
      prefix === '/' ? path === '/' : path === prefix || path.startsWith(prefix + '/')
    )
  const isPublicRoute = publicRoutes.includes(path)

  // Read the session cookie directly from the request (runtime-safe)
  const sessionCookie = req.cookies.get('session')?.value

  let session = null
  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie)
    } catch {
      // Invalid or expired JWT — treat as unauthenticated
      session = null
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect already-logged-in users away from the login page
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

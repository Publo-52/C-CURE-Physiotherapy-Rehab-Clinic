import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/session'

const protectedRoutes = ['/']
const publicRoutes = ['/login']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Basic path check
  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith('/dashboard') || path.startsWith('/patients')
  const isPublicRoute = publicRoutes.includes(path)
  
  // Exclude static files, API routes (except if we want to protect them), and next internals
  if (path.startsWith('/_next') || path.match(/\.(.*)$/)) {
    return NextResponse.next()
  }

  const session = await verifySession()

  // Redirect to login if accessing a protected route without a session
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect to dashboard if logged in and accessing login page
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

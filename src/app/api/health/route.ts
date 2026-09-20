import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Health & Keep-Alive Endpoint
 * Performs an ultra-lightweight SELECT 1 query to keep Supabase PostgreSQL connection pool alive
 * and prevent inactivity-based project pausing. Does NOT consume any database storage (0 bytes).
 */
export async function GET() {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
    console.error('Health check database ping failed:', errorMessage)
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    )
  }
}

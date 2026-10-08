'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error Caught:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="card-handmade max-w-md w-full p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {error?.message || 'An unexpected error occurred while loading this page. Please try refreshing.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold gap-2 active-press shadow-md shadow-primary/20"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full font-bold gap-2 active-press">
              <Home className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

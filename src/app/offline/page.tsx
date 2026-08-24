'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WifiOff, RefreshCw, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-lg bg-card/90 border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-6 animate-modal-pop relative z-10">
        {/* Animated Brand Logo & Status */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent border border-primary/20 flex items-center justify-center shadow-lg">
              <Image
                src="/mobile-logo.png"
                alt="C-CURE Physiotherapy & Rehab Clinic"
                width={64}
                height={64}
                className="drop-shadow-md"
                priority
              />
            </div>
            <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center shadow-lg border-2 border-card">
              <WifiOff className="h-4.5 w-4.5 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            You&apos;re Currently Offline
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
            We couldn&apos;t connect to the internet. Please verify your network connection to sync clinic data.
          </p>
        </div>

        {/* Informational Diagnosis Cards */}
        <div className="bg-muted/40 border rounded-2xl p-4 text-left space-y-3 text-xs sm:text-sm font-medium text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <span>Check if your <strong>Wi-Fi</strong> or <strong>Mobile Data</strong> is turned on.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Your local patient records and active session remain completely safe.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <span>Once reconnected, real-time sync will resume automatically.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 font-bold shadow-lg hover:shadow-primary/25 active:scale-95 transition-all py-2.5 h-auto flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking Network...' : 'Retry Connection'}
          </Button>
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full font-bold active:scale-95 h-auto py-2.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Footer Clinic Tag */}
        <p className="text-[11px] font-medium text-muted-foreground/70">
          C-CURE Physiotherapy &amp; Rehab Clinic Management Portal
        </p>
      </main>
    </div>
  )
}

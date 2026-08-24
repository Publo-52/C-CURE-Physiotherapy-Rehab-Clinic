'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const isInitialMount = useRef(true)

  const checkConnection = async () => {
    setIsChecking(true)
    if (!navigator.onLine) {
      setTimeout(() => {
        setIsChecking(false)
      }, 500)
      return
    }

    try {
      const res = await fetch(`/favicon.ico?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })
      if (res.ok || res.status === 304) {
        setIsOffline(false)
        setIsDismissed(false)
        setShowOnlineToast(true)
        setTimeout(() => setShowOnlineToast(false), 3000)
      } else {
        setIsOffline(true)
      }
    } catch {
      setIsOffline(true)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOffline = () => {
      setIsOffline(true)
      setIsDismissed(false)
      setShowOnlineToast(false)
    }

    const handleOnline = () => {
      if (isInitialMount.current) return
      setIsOffline(false)
      setIsDismissed(false)
      setShowOnlineToast(true)
      setTimeout(() => {
        setShowOnlineToast(false)
      }, 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Check initial status
    if (!navigator.onLine) {
      setIsOffline(true)
    }

    isInitialMount.current = false

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <>
      {/* ── 1. Full-Screen Branded Offline UI Overlay (Mobile & Laptop) ── */}
      {isOffline && !isDismissed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Offline Mode"
          className="fixed inset-0 z-[99999] bg-slate-950/95 dark:bg-slate-950/95 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-xl animate-modal-pop overflow-y-auto"
        >
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md relative z-10 space-y-5">
            {/* Centered Glowing Logo & Icon */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent border border-primary/30 flex items-center justify-center shadow-xl">
                  <Image
                    src="/mobile-logo.png"
                    alt="C-CURE Physiotherapy & Rehab Clinic"
                    width={56}
                    height={56}
                    className="drop-shadow-lg"
                    priority
                  />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 h-8 w-8 sm:h-9 sm:w-9 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <WifiOff className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                You&apos;re Currently Offline
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
                No active internet connection found on this device. Reconnect to sync clinic data.
              </p>
            </div>

            {/* Diagnostic helper tips card */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300 font-medium">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Check your <strong>Wi-Fi</strong> or <strong>Mobile Data</strong> switch.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Your opened patient records and session data remain safe.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Auto-reconnect will trigger as soon as internet is back.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                onClick={checkConnection}
                disabled={isChecking}
                className="flex-1 font-bold py-2.5 h-auto shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking Connection...' : 'Retry Connection'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDismissed(true)}
                className="flex-1 font-bold py-2.5 h-auto bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 active:scale-95 cursor-pointer"
              >
                Continue Viewing
              </Button>
            </div>

            <p className="text-[11px] font-medium text-slate-500">
              C-CURE Physiotherapy &amp; Rehab Clinic
            </p>
          </div>
        </div>
      )}

      {/* ── 2. "Back Online" Single Toast (When reconnecting) ── */}
      {showOnlineToast && (
        <aside
          aria-label="Online notification"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[90%] max-w-sm pointer-events-auto animate-modal-pop"
        >
          <div className="bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 border border-emerald-500/40 rounded-2xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Wifi className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate text-emerald-400">Back Online!</p>
                <p className="text-[11px] text-slate-300 truncate">Connection restored</p>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          </div>
        </aside>
      )}
    </>
  )
}

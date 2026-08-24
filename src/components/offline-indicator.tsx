'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [wasOffline, setWasOffline] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [dismissBanner, setDismissBanner] = useState<boolean>(false)

  // Function to verify actual internet connectivity
  const checkConnectivity = useCallback(async () => {
    if (typeof window === 'undefined') return
    setIsChecking(true)

    // Check navigator.onLine first
    if (!navigator.onLine) {
      setIsOnline(false)
      setWasOffline(true)
      setIsChecking(false)
      return
    }

    try {
      // Ping favicon or lightweight endpoint with cache-busting timestamp
      const response = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      })
      if (response.ok || response.status === 304) {
        if (!isOnline) {
          setWasOffline(true)
        }
        setIsOnline(true)
        setDismissBanner(false)
      } else {
        setIsOnline(false)
        setWasOffline(true)
      }
    } catch {
      setIsOnline(false)
      setWasOffline(true)
    } finally {
      setIsChecking(false)
    }
  }, [isOnline])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial check
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      checkConnectivity()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setDismissBanner(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      checkConnectivity()
    }, 15000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [checkConnectivity])

  // Automatically hide "Back Online" success toast after 3.5 seconds
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  return (
    <>
      {/* ── 1. Top Notification Floating Banner ─────────────────────── */}
      {!isOnline && !dismissBanner && (
        <aside 
          aria-label="Offline Mode Notification"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-modal-pop"
        >
          <div className="bg-amber-950/90 dark:bg-amber-950/95 text-amber-100 border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <WifiOff className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">You are currently offline</p>
                <p className="text-[10px] text-amber-200/70 truncate">Check your internet connection</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Details
              </button>
              <button
                onClick={checkConnectivity}
                disabled={isChecking}
                aria-label="Retry connection"
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setDismissBanner(true)}
                aria-label="Dismiss offline banner"
                className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300/70 hover:text-amber-100 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── 2. "Back Online" Success Toast ─────────────────────────── */}
      {isOnline && wasOffline && (
        <aside 
          aria-label="Online Status Restored"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-modal-pop"
        >
          <div className="bg-emerald-950/90 dark:bg-emerald-950/95 text-emerald-100 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Wifi className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Back Online!</p>
                <p className="text-[10px] text-emerald-200/70">Connection successfully restored</p>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          </div>
        </aside>
      )}

      {/* ── 3. Full Rich Offline Details Modal Dialog ───────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-modal-pop"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative overflow-hidden text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Background ambient glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors border cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing Icon & Logo Header */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 via-primary/10 to-transparent flex items-center justify-center border border-amber-500/30 shadow-inner">
                  <Image
                    src="/mobile-logo.png"
                    alt="C-CURE Clinic"
                    width={48}
                    height={48}
                    className="opacity-90 drop-shadow"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center shadow-md border-2 border-card">
                  <WifiOff className="h-3.5 w-3.5" />
                </div>
              </div>

              <h2 className="text-xl font-black tracking-tight text-foreground">No Internet Connection</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                You appear to be offline. Don&apos;t worry, your current session and open pages are safe.
              </p>
            </div>

            {/* Diagnostic Tips Card */}
            <div className="bg-muted/40 border rounded-2xl p-4 text-left space-y-2.5 text-xs text-muted-foreground font-medium">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Make sure your <strong>Wi-Fi</strong> or <strong>Mobile Data</strong> is turned on.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Once reconnected, data sync will resume automatically.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                onClick={checkConnectivity}
                disabled={isChecking}
                className="w-full font-bold shadow-md hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking Connection...' : 'Retry Connection'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="w-full font-bold active:scale-95 cursor-pointer"
              >
                Continue Offline
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { WifiOff, Wifi, X } from 'lucide-react'

type ToastType = 'offline' | 'online' | null

export function OfflineIndicator() {
  const [toast, setToast] = useState<ToastType>(null)
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef<boolean>(false)

  const triggerToast = useCallback((type: 'offline' | 'online') => {
    // Clear any active timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setToast(type)

    // Auto-dismiss after 4 seconds (offline) or 3 seconds (online)
    const duration = type === 'offline' ? 4000 : 3000
    timeoutRef.current = setTimeout(() => {
      setToast(null)
    }, duration)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial status without triggering toast on first load
    isOnlineRef.current = navigator.onLine
    isMountedRef.current = true

    const handleOffline = () => {
      if (isOnlineRef.current) {
        isOnlineRef.current = false
        triggerToast('offline')
      }
    }

    const handleOnline = () => {
      if (!isOnlineRef.current) {
        isOnlineRef.current = true
        triggerToast('online')
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Fast 1.5s state check to catch OS-buffered connectivity changes instantly on mobile/laptop
    const interval = setInterval(() => {
      const currentStatus = navigator.onLine
      if (currentStatus !== isOnlineRef.current) {
        if (!currentStatus && isOnlineRef.current) {
          isOnlineRef.current = false
          triggerToast('offline')
        } else if (currentStatus && !isOnlineRef.current) {
          isOnlineRef.current = true
          triggerToast('online')
        }
      }
    }, 1500)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [triggerToast])

  if (!toast) return null

  return (
    <aside 
      aria-label={toast === 'offline' ? 'Offline notification' : 'Online notification'}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-sm pointer-events-auto animate-modal-pop"
    >
      {toast === 'offline' ? (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 border border-amber-500/40 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <WifiOff className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate text-amber-300">You&apos;re Offline</p>
              <p className="text-[11px] text-slate-300 truncate">No internet connection detected</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 border border-emerald-500/40 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wifi className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate text-emerald-400">Back Online!</p>
              <p className="text-[11px] text-slate-300 truncate">Connection restored successfully</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { WifiOff, Wifi, X } from 'lucide-react'

type ToastType = 'offline' | 'online' | null

export function OfflineIndicator() {
  const [toast, setToast] = useState<ToastType>(null)
  const isInitialMount = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showNotification = (type: 'offline' | 'online') => {
    // Clear any active timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setToast(type)

    // Auto-dismiss: 4s for offline, 3s for online
    const duration = type === 'offline' ? 4000 : 3000
    timeoutRef.current = setTimeout(() => {
      setToast(null)
    }, duration)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track online/offline status transitions
    const handleOffline = () => {
      showNotification('offline')
    }

    const handleOnline = () => {
      // Don't fire on initial mount if already online
      if (isInitialMount.current) return
      showNotification('online')
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Mark initial mount as completed
    isInitialMount.current = false

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!toast) return null

  return (
    <aside 
      aria-label={toast === 'offline' ? 'Offline notification' : 'Online notification'}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm pointer-events-auto animate-modal-pop"
    >
      {toast === 'offline' ? (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 border border-amber-500/40 rounded-2xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate text-amber-300">You&apos;re Offline</p>
              <p className="text-[11px] text-slate-300 truncate">No internet connection</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
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
          <button
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  )
}

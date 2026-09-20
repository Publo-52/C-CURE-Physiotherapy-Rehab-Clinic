'use client'

import { useEffect } from 'react'

/**
 * MobileAntiZoom
 * Prevents accidental double-tap zoom and Safari pinch-to-zoom gestures
 * while keeping 100% smooth, natural scrolling and tactile tap response.
 */
export function MobileAntiZoom() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Prevent iOS Safari multi-touch pinch gesture zooming
    const handleGestureStart = (e: Event) => {
      e.preventDefault()
    }

    const handleGestureChange = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener('gesturestart', handleGestureStart, { passive: false })
    document.addEventListener('gesturechange', handleGestureChange, { passive: false })

    // 2. Prevent rapid double-tap zooming on iOS Safari / Chrome Mobile
    let lastTouchEnd = 0
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 280) {
        // Prevent zoom if double tap is within 280ms on non-form elements
        const target = e.target as HTMLElement | null
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
        if (!isInput) {
          e.preventDefault()
        }
      }
      lastTouchEnd = now
    }

    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart)
      document.removeEventListener('gesturechange', handleGestureChange)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return null
}

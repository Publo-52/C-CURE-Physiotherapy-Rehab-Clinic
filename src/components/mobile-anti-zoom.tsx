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

    // 2. Prevent multi-finger pinch zooming on touch devices (Android & iOS)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    }

    // 3. Prevent rapid double-tap zooming on iOS Safari / Chrome Mobile
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

    // 4. Prevent Ctrl + Wheel zoom on hybrid / mobile devices
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    document.addEventListener('gesturestart', handleGestureStart, { passive: false })
    document.addEventListener('gesturechange', handleGestureChange, { passive: false })
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart)
      document.removeEventListener('gesturechange', handleGestureChange)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return null
}

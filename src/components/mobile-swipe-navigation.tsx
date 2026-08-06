'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect } from 'react'

const routes = ['/', '/patients', '/payments', '/calendar', '/settings']

export function MobileSwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number>(0)

  // Prefetch all main routes immediately for zero delay
  useEffect(() => {
    routes.forEach(r => {
      try {
        router.prefetch(r)
      } catch {
        // Safe fallback
      }
    })
  }, [router])

  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignore swipe gesture on interactive components, buttons, inputs, links, and forms
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, form, button, a, [role="button"], [role="dialog"], .no-swipe, .overflow-y-auto')) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const duration = Date.now() - touchStartTime.current

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    // Reset touch refs
    touchStartX.current = null
    touchStartY.current = null

    // Require fast, deliberate horizontal swipe:
    // 1. Gesture completed within 450ms (prevents slow vertical scroll triggers)
    // 2. Horizontal distance > 90px
    // 3. Horizontal movement is at least 2.5x greater than vertical movement
    if (duration < 450 && Math.abs(deltaX) > 90 && Math.abs(deltaX) > Math.abs(deltaY) * 2.5) {
      const currentIndex = routes.findIndex(r => r === pathname || (r !== '/' && pathname.startsWith(r)))
      if (currentIndex === -1) return

      if (deltaX < -90 && currentIndex < routes.length - 1) {
        // Deliberate Swipe Left -> Next Page
        router.push(routes[currentIndex + 1])
      } else if (deltaX > 90 && currentIndex > 0) {
        // Deliberate Swipe Right -> Previous Page
        router.push(routes[currentIndex - 1])
      }
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 flex flex-col min-h-0 w-full overflow-hidden"
    >
      {children}
    </div>
  )
}

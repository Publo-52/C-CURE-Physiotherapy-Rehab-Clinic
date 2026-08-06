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
    // Ignore swipe gesture only when directly interacting with form input fields or modals
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, form, [role="dialog"], .no-swipe')) {
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

    // Require comfortable horizontal swipe:
    // 1. Gesture completed within 600ms
    // 2. Horizontal distance > 50px
    // 3. Horizontal movement greater than vertical movement (* 1.3)
    if (duration < 600 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const currentIndex = routes.findIndex(r => r === pathname || (r !== '/' && pathname.startsWith(r)))
      if (currentIndex === -1) return

      if (deltaX < -50 && currentIndex < routes.length - 1) {
        // Swipe Left -> Next Page
        router.push(routes[currentIndex + 1])
      } else if (deltaX > 50 && currentIndex > 0) {
        // Swipe Right -> Previous Page
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

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect } from 'react'

const routes = ['/', '/patients', '/payments', '/calendar', '/settings']

export function MobileSwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isSwiped = useRef<boolean>(false)

  // Prefetch all main routes immediately for 0ms latency
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
    // Ignore swipe gesture if touching interactive form fields, modals, or buttons
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea, select, form, button, [role="dialog"], .no-swipe')) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isSwiped.current = false
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || isSwiped.current) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY

    const deltaX = currentX - touchStartX.current
    const deltaY = currentY - touchStartY.current

    // Require deliberate horizontal movement (> 85px & 2.2x vertical distance)
    if (Math.abs(deltaX) > 85 && Math.abs(deltaX) > Math.abs(deltaY) * 2.2) {
      const currentIndex = routes.findIndex(r => r === pathname || (r !== '/' && pathname.startsWith(r)))
      if (currentIndex === -1) return

      if (deltaX < 0 && currentIndex < routes.length - 1) {
        // Swipe Left -> Instant Next Page
        isSwiped.current = true
        router.push(routes[currentIndex + 1])
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe Right -> Instant Prev Page
        isSwiped.current = true
        router.push(routes[currentIndex - 1])
      }
    }
  }

  const handleTouchEnd = () => {
    touchStartX.current = null
    touchStartY.current = null
    isSwiped.current = false
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 flex flex-col min-h-0 w-full overflow-hidden"
    >
      {children}
    </div>
  )
}

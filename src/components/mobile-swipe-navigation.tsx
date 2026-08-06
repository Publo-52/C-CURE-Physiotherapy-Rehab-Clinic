'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect } from 'react'

const routes = ['/', '/patients', '/payments', '/calendar', '/settings']

export function MobileSwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Prefetch all main routes on client load for instant zero-delay navigation
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
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    // Reset touch refs
    touchStartX.current = null
    touchStartY.current = null

    // Ensure horizontal gesture dominant (horizontal distance > 70px & 1.5x vertical movement)
    if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      // Find current route index
      const currentIndex = routes.findIndex(r => r === pathname || (r !== '/' && pathname.startsWith(r)))
      if (currentIndex === -1) return

      if (deltaX < 0 && currentIndex < routes.length - 1) {
        // Swipe Left -> Next Page
        const nextRoute = routes[currentIndex + 1]
        router.push(nextRoute)
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe Right -> Previous Page
        const prevRoute = routes[currentIndex - 1]
        router.push(prevRoute)
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

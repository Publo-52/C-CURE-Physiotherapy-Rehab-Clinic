'use client'

import { usePathname } from 'next/navigation'
import { useRef } from 'react'

const routes = ['/', '/patients', '/payments', '/calendar', '/settings']

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)

  const getRouteIndex = (path: string) => {
    const idx = routes.findIndex(r => r === path || (r !== '/' && path.startsWith(r)))
    return idx === -1 ? 0 : idx
  }

  const prevIdx = getRouteIndex(prevPathRef.current)
  const currIdx = getRouteIndex(pathname)

  let animationClass = 'animate-mobile-page'
  if (currIdx > prevIdx) {
    animationClass = 'animate-shift-left'
  } else if (currIdx < prevIdx) {
    animationClass = 'animate-shift-right'
  }

  if (prevPathRef.current !== pathname) {
    prevPathRef.current = pathname
  }

  return (
    <div
      key={pathname}
      className={`flex-1 ${animationClass}`}
    >
      {children}
    </div>
  )
}

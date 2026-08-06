'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayPath, setDisplayPath] = useState(pathname)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (pathname !== displayPath) {
      setAnimating(true)
      const timer = setTimeout(() => {
        setDisplayPath(pathname)
        setAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [pathname, displayPath])

  return (
    <div
      key={pathname}
      className={`flex-1 transition-all duration-300 ease-out transform ${
        animating ? 'opacity-60 scale-[0.99] translate-y-1' : 'opacity-100 scale-100 translate-y-0'
      } animate-mobile-page`}
    >
      {children}
    </div>
  )
}

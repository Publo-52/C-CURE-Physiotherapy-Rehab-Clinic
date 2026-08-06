'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

const routes = ['/', '/patients', '/payments', '/calendar', '/settings']

function getRouteIndex(path: string) {
  const idx = routes.findIndex(r => r === path || (r !== '/' && path.startsWith(r)))
  return idx === -1 ? 0 : idx
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [prevPath, setPrevPath] = useState(pathname)
  const [animClass, setAnimClass] = useState('animate-mobile-page')

  if (prevPath !== pathname) {
    const prevIdx = getRouteIndex(prevPath)
    const currIdx = getRouteIndex(pathname)

    setPrevPath(pathname)
    if (currIdx > prevIdx) {
      setAnimClass('animate-shift-left')
    } else if (currIdx < prevIdx) {
      setAnimClass('animate-shift-right')
    } else {
      setAnimClass('animate-mobile-page')
    }
  }

  return (
    <div key={pathname} className={`flex-1 ${animClass}`}>
      {children}
    </div>
  )
}

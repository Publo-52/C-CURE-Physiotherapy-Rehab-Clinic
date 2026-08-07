'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Stethoscope } from 'lucide-react'

export function OpeningSplashScreen() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const hasSeen = localStorage.getItem('c_cure_splash_seen_v1')
      if (!hasSeen) {
        localStorage.setItem('c_cure_splash_seen_v1', 'true')
        setVisible(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!visible) return

    const timer1 = setTimeout(() => {
      setFading(true)
    }, 1100)

    const timer2 = setTimeout(() => {
      setVisible(false)
    }, 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [visible])

  if (!mounted || !visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl transition-all duration-500 ease-out ${
        fading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Glow aura */}
      <div className="absolute h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-pulse" />

      <div className="relative flex flex-col items-center space-y-5 px-6 text-center">
        {/* Brand Logo Container */}
        <div className="relative p-4 rounded-3xl bg-card border border-border/80 shadow-2xl ring-1 ring-primary/20 animate-in zoom-in-90 duration-500">
          <Image
            src="/mobile-logo.png"
            alt="C-CURE Clinic"
            width={72}
            height={72}
            className="h-16 w-16 object-contain"
            priority
          />
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight gradient-text">
            C-CURE Physiotherapy
          </h1>
          <p className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            &amp; Rehab Clinic Management Portal
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-44 h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full animate-[splashLoading_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}

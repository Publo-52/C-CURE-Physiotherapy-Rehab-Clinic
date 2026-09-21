/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Stethoscope, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // Capture precise client device model via Client Hints API when supported
    if (typeof window !== 'undefined' && (navigator as any).userAgentData?.getHighEntropyValues) {
      try {
        const hints = await (navigator as any).userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion'])
        if (hints?.model) {
          const platform = hints.platform || 'Device'
          formData.set('clientDeviceName', `${hints.model} (${platform})`)
        }
      } catch {
        // Fallback to server-side User-Agent parsing
      }
    }
    
    try {
      const result = await login(formData)
      
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Session cookie is set — navigate straight to Dashboard Overview
        window.location.href = '/'
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred during login.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background overflow-hidden transition-colors">
      
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/10 dark:bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

      {/* Main Login Card - Compact for Mobile & Desktop */}
      <div className="w-full max-w-[340px] sm:max-w-[370px] relative z-10 card-handmade overflow-hidden shadow-xl">
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500" />
        
        <div className="p-4 sm:p-5 space-y-4">
          {/* Logo container */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="bg-white dark:bg-card border border-border/80 rounded-xl p-1.5 sm:p-2 shadow-xs">
              {/* Desktop Logo */}
              <Image
                src="/logo.jpg"
                alt="C-CURE Logo"
                width={180}
                height={90}
                className="hidden md:block h-14 w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
              {/* Mobile Logo */}
              <Image
                src="/mobile-logo.png"
                alt="C-CURE Logo"
                width={180}
                height={90}
                className="block md:hidden h-12 w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight gradient-text">
                C-CURE Physiotherapy
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5 mt-0.5">
                <Stethoscope className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                Clinic Management Portal
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] sm:text-xs font-bold text-foreground">
                Email Address
              </Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="Enter doctor or admin email" 
                required 
                autoComplete="email"
                className="h-9 sm:h-9.5 text-xs sm:text-sm rounded-lg sm:rounded-xl bg-background/80 border-border/80 focus:bg-background"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[11px] sm:text-xs font-bold text-foreground">
                Password
              </Label>
              <PasswordInput 
                id="password" 
                name="password"
                required 
                autoComplete="current-password"
                placeholder="Enter password"
                className="h-9 sm:h-9.5 text-xs sm:text-sm rounded-lg sm:rounded-xl bg-background/80 border-border/80 focus:bg-background"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-9 sm:h-9.5 text-xs sm:text-sm font-bold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all rounded-lg sm:rounded-xl active-press mt-1" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Sign In to Clinic
                </span>
              )}
            </Button>
          </form>

          {/* Security badge */}
          <div className="pt-1 text-center border-t border-border/60">
            <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1 font-medium">
              <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary/70" />
              Secured Clinical Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

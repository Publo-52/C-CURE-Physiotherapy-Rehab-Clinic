"use client"

import { Stethoscope, ShieldCheck, User } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  profile?: {
    practitionerName: string
    clinicName?: string
    phone: string
    email: string
  } | null
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export function Header({ profile, currentUser }: HeaderProps) {
  const name = profile?.practitionerName || 'Sanatan Manna'
  const clinicName = profile?.clinicName || 'C-CURE Physiotherapy & Rehab Clinic'
  const isSuperAdmin = currentUser?.role === 'Super Admin'

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between px-3 sm:px-5 md:px-7 bg-background/85 backdrop-blur-xl border-b border-border/70 shadow-[0_2px_16px_rgba(0,0,0,0.02)] transition-colors">
      
      {/* Left — Logo + Clinic name on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 md:hidden min-w-0">
        <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm ring-1 ring-border/80">
          <Image
            src="/mobile-logo.png"
            alt="C-CURE Logo"
            fill
            sizes="32px"
            className="object-contain p-0.5"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black leading-tight gradient-text truncate max-w-[130px] sm:max-w-[210px]">
            C-CURE Physiotherapy
          </span>
          <span className="text-[9.5px] text-muted-foreground font-medium leading-tight truncate">
            &amp; Rehab Clinic
          </span>
        </div>
      </div>

      {/* Center/Left — Clinic name & practitioner on desktop */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold gradient-text tracking-tight leading-tight">
              {clinicName}
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="radar-wave absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Clinic Active</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Stethoscope className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              {name} <span className="opacity-60">·</span> Chief Physiotherapist &amp; Rehab Specialist
            </span>
          </div>
        </div>
      </div>

      {/* Right — Role Badge + Artisanal Day/Night Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {currentUser && (
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-muted/60 dark:bg-muted/40 px-2 sm:px-3 py-1 rounded-full border border-border/70 shadow-xs">
            {isSuperAdmin ? (
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 shadow-xs">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> SUPER ADMIN
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-bold gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> ADMIN
              </Badge>
            )}
            <span className="text-xs font-semibold text-foreground hidden lg:inline-block max-w-[160px] truncate">
              {currentUser.email}
            </span>
          </div>
        )}

        {/* Artisanal Day & Night Luxury Switcher */}
        <ThemeToggle />
      </div>
    </header>
  )
}

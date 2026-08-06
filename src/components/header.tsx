"use client"


import { useTheme } from "next-themes"
import { Moon, Sun, Stethoscope, ShieldCheck, User } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function Header({ profile, currentUser }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  const name = profile?.practitionerName || 'Sanatan Manna'
  const clinicName = profile?.clinicName || 'C-CURE Physiotherapy & Rehab Clinic'

  const isSuperAdmin = currentUser?.role === 'Super Admin'

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 md:px-6 bg-background/92 backdrop-blur-md border-b border-border/60 shadow-sm">
      
      {/* Left — Logo + Clinic name on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:hidden min-w-0">
        <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm ring-1 ring-border">
          <Image
            src="/mobile-logo.png"
            alt="C-CURE Logo"
            fill
            sizes="32px"
            className="object-contain p-0.5"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold leading-tight gradient-text truncate max-w-[120px] sm:max-w-[200px]">
            C-CURE Physiotherapy
          </span>
          <span className="text-[9px] text-muted-foreground leading-tight truncate">&amp; Rehab Clinic</span>
        </div>
      </div>

      {/* Center — Clinic name on desktop */}
      <div className="hidden md:flex flex-col items-start justify-center">
        <span className="text-sm font-bold gradient-text leading-tight">{clinicName}</span>
        <div className="flex items-center gap-1 mt-0.5">
          <Stethoscope className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">{name} · Physiotherapist</span>
        </div>
      </div>

      {/* Right — User Role Badge + Theme controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/60 px-1.5 sm:px-2.5 py-1 rounded-full border border-border/60">
            {isSuperAdmin ? (
              <Badge className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> SUPER ADMIN
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-bold gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> ADMIN
              </Badge>
            )}
            <span className="text-xs font-semibold text-foreground hidden sm:inline-block max-w-[160px] truncate">
              {currentUser.email}
            </span>
          </div>
        )}

        {/* Dark / Light mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              theme === "dark" ? "bg-zinc-700" : "bg-zinc-200"
            )}
            aria-label="Toggle theme"
          >
            <span
              className={cn(
                "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              )}
            >
              <span className={cn("absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200", theme === "dark" ? "opacity-0 ease-out" : "opacity-100 ease-in")}>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              </span>
              <span className={cn("absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200", theme === "dark" ? "opacity-100 ease-in" : "opacity-0 ease-out")}>
                <Moon className="h-3 w-3 text-indigo-500" />
              </span>
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

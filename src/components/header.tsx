"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu, Stethoscope, Phone, Mail } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet"
import { navItems } from "./sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface HeaderProps {
  profile?: {
    practitionerName: string
    phone: string
    email: string
  } | null
}

export function Header({ profile }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const name = profile?.practitionerName || 'Sanatan Manna'
  const phone = profile?.phone || '7942688985'
  const email = profile?.email || 'sanatan.manna28072015@gmail.com'

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-6 bg-background/90 dark:bg-background/95 backdrop-blur-md border-b border-primary/15 shadow-sm">
      <div className="flex items-center md:hidden w-full justify-between">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="mr-2" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            
            {/* Mobile Clinic Header */}
            <div className="flex flex-col border-b bg-gradient-to-b from-primary/10 to-primary/5 px-4 pt-12 pb-5 space-y-4 relative">
              {/* Logo */}
              <div className="flex justify-center bg-white border border-slate-200/60 rounded-3xl p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-black/5 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                <Image
                  src="/logo.jpg"
                  alt="C-CURE Logo"
                  width={180}
                  height={72}
                  className="h-16 w-auto object-contain"
                  style={{ width: 'auto' }}
                  priority
                />
              </div>

              {/* Profile details */}
              <div className="bg-background/90 backdrop-blur-md rounded-2xl border border-border/50 p-4 space-y-2.5 shadow-sm mt-2">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-muted shadow-sm ring-2 ring-primary/10">
                    <Image
                      src="/doctor-sonatan.png"
                      alt={name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold truncate leading-tight text-foreground">{name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs text-primary font-bold">Physiotherapist</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/60 my-2" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
                    <span className="text-xs font-semibold truncate">{phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
                    <span className="text-xs font-semibold truncate leading-tight">{email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto py-4">
              <nav className="space-y-1 px-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-4.5 w-4.5 flex-shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

      </div>
      {/* Center branding (All screens) */}
      <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-[60%] sm:w-auto">
        <span className="text-sm font-semibold gradient-text leading-tight truncate w-full sm:w-auto">C-CURE Physiotherapy</span>
        <span className="text-xs font-semibold gradient-text leading-tight truncate w-full sm:w-auto">&amp; Rehab Clinic</span>
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 dark:bg-zinc-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Toggle theme"
          >
            <span
              className={cn(
                "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200",
                  theme === "dark" ? "opacity-0 ease-out" : "opacity-100 ease-in"
                )}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              </span>
              <span
                className={cn(
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200",
                  theme === "dark" ? "opacity-100 ease-in" : "opacity-0 ease-out"
                )}
              >
                <Moon className="h-3 w-3 text-indigo-500" />
              </span>
            </span>
          </button>
        )}
      </div>
    </header>
  )
}


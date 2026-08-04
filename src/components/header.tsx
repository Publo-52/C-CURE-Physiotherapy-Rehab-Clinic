"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Menu } from "lucide-react"
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
    clinicName: string
    phone: string
    email: string
    address: string
    workingHours: string
  } | null
}

export function Header({ profile }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const name = profile?.practitionerName || 'Sanatan Manna'
  const clinicName = profile?.clinicName || 'C-CURE Physiotherapy & Rehab Clinic'
  const phone = profile?.phone || '7942688985'
  const email = profile?.email || 'sanatan.manna28072015@gmail.com'
  const address = profile?.address || 'Moyna, Midnapore, West Bengal'
  const workingHours = profile?.workingHours || 'Open 24 Hours'

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
            <div className="flex flex-col border-b bg-gradient-to-b from-primary/10 to-primary/5 px-4 pt-4 pb-4 space-y-3">
              {/* Logo */}
              <div className="flex justify-center bg-white border border-border/40 rounded-2xl p-2 shadow-sm">
                <Image
                  src="/logo.jpg"
                  alt="C-CURE Logo"
                  width={140}
                  height={56}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>

              {/* Profile details */}
              <div className="bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 p-2.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    <Image
                      src="/doctor-sonatan.png"
                      alt={name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{name}</p>
                    <p className="text-[9px] text-primary font-semibold mt-0.5">Physiotherapist</p>
                  </div>
                </div>
                <div className="border-t border-border/50 my-1" />
                <p className="text-[9px] text-muted-foreground font-semibold">📞 {phone}</p>
                <p className="text-[9px] text-muted-foreground font-semibold truncate">✉️ {email}</p>
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

        {/* Mobile Navbar Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={28}
            height={28}
            className="h-7 w-auto object-contain bg-white p-0.5 rounded-lg border shadow-sm"
          />
        </div>
      </div>
      {/* Desktop center branding */}
      <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <span className="text-sm font-semibold gradient-text">C-CURE Physiotherapy &amp; Rehab Clinic</span>
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}


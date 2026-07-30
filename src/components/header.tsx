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

export function Header() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="mr-2" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            {/* Mobile Clinic Header */}
            <div className="flex flex-col items-center border-b px-4 py-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3 w-full">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-[10px] font-bold">CC</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary leading-tight uppercase tracking-wide">C-CURE</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">Physiotherapy & Rehab Clinic</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full bg-background/50 rounded-lg p-2 border">
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/30">
                  <Image src="/doctor-sonatan.png" alt="Dr. Sonatan Manna" width={32} height={32} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">Dr. Sonatan Manna</p>
                  <p className="text-[10px] text-muted-foreground">Physiotherapist</p>
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
                        "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
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
        {/* Mobile title */}
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-[9px] font-bold">CC</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wide leading-tight">C-CURE</p>
            <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block">Physiotherapy & Rehab</p>
          </div>
        </div>
      </div>
      {/* Desktop center branding */}
      <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <span className="text-sm font-semibold text-muted-foreground">C-CURE Physiotherapy & Rehab Clinic</span>
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


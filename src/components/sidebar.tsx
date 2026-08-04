"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  IndianRupee, 
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { logout } from "@/app/actions/auth"
import Image from "next/image"

export const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Payments", href: "/payments", icon: IndianRupee },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-card border-r shadow-sm">
      {/* Clinic Branding */}
      <div className="flex flex-col items-center border-b px-4 py-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground text-xs font-bold">CC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary leading-tight uppercase tracking-wide">C-CURE</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Physiotherapy & Rehab Clinic</p>
          </div>
        </div>
        {/* Doctor Info */}
        <div className="flex items-center gap-2 w-full bg-background/50 rounded-lg p-2 border">
          <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/30">
            <Image
              src="/doctor-sonatan.png"
              alt="Dr. Sonatan Manna"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">Dr. Sonatan Manna</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Physiotherapist</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) && item.href !== "/"
            return (
              <Link
                key={item.name}
                href={item.href}
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
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  IndianRupee, 
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Payments", href: "/payments", icon: IndianRupee },
  { name: "Scheduler", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

// Mobile bottom nav bar for small screens
export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border/80 shadow-[0_-2px_24px_rgba(0,0,0,0.08)] safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 px-1 py-2 transition-all duration-200 relative active-press",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-1 rounded-b-full bg-primary shadow-xs transition-all duration-300 animate-in fade-in zoom-in-75" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 ease-out",
                  isActive ? "scale-110 -translate-y-0.5 text-primary" : "scale-100"
                )}
                aria-hidden="true"
              />
              <span className={cn(
                "text-[10px] leading-none transition-all duration-200",
                isActive ? "text-primary font-extrabold" : "text-muted-foreground font-medium"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/88 backdrop-blur-xl border-t border-border/70 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] safe-area-inset-bottom transition-colors">
      <div className="flex items-stretch h-16 max-w-md mx-auto px-1 sm:px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              onTouchStart={() => {
                try { router.prefetch(item.href) } catch {}
              }}
              onMouseEnter={() => {
                try { router.prefetch(item.href) } catch {}
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 sm:gap-1 px-0.5 sm:px-1 py-2 transition-all duration-200 relative active-press select-none min-w-0",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-1 rounded-b-full bg-primary shadow-xs shadow-primary/40 transition-all duration-300" />
              )}
              <item.icon
                className={cn(
                  "h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-200 ease-out shrink-0",
                  isActive ? "scale-110 -translate-y-0.5 text-primary" : "scale-100 opacity-80"
                )}
                aria-hidden="true"
              />
              <span className={cn(
                "text-[9px] xs:text-[10px] leading-tight transition-all duration-200 truncate max-w-full",
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

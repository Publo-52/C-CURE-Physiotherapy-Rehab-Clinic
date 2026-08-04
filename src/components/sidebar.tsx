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
  Phone,
  MapPin,
  Clock,
  Stethoscope,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { logout } from "@/app/actions/auth"

export const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Payments", href: "/payments", icon: IndianRupee },
  { name: "Scheduler", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  profile?: {
    practitionerName: string
    clinicName: string
    phone: string
    email: string
    address: string
    workingHours: string
  } | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
    router.refresh()
  }

  const name = profile?.practitionerName || 'Sanatan Manna'
  const clinicName = profile?.clinicName || 'C-CURE Physiotherapy & Rehab Clinic'
  const phone = profile?.phone || '7942688985'
  const email = profile?.email || 'sanatan.manna28072015@gmail.com'
  const address = profile?.address || 'Moyna, Midnapore, West Bengal'
  const workingHours = profile?.workingHours || 'Open 24 Hours'

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-card border-r shadow-sm">
      
      {/* === Profile Section === */}
      <div className="flex flex-col border-b bg-gradient-to-b from-primary/10 to-primary/5 px-4 pt-4 pb-4 space-y-3">

        {/* Clinic Logo Header */}
        <div className="flex justify-center bg-white border border-border/40 rounded-2xl p-2.5 shadow-sm">
          <img
            src="/logo.jpg"
            alt="C-CURE Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Practitioner Profile Card */}
        <div className="bg-background/70 backdrop-blur-sm rounded-xl border border-border/60 p-3 space-y-2 shadow-sm">
          
          {/* Avatar + Name */}
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0 shadow-md ring-2 ring-primary/20 bg-muted">
              <img
                src="/doctor-sonatan.png"
                alt={name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold leading-tight truncate text-foreground">{name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Stethoscope className="h-3 w-3 text-primary" />
                <p className="text-[10px] text-primary font-bold">Physiotherapist</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Contact & Location info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0 text-primary/70" />
              <span className="text-[10px] font-semibold truncate">{phone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0 text-primary/70" />
              <span className="text-[9px] font-semibold truncate leading-tight">{email}</span>
            </div>
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0 text-primary/70 mt-0.5" />
              <span className="text-[10px] font-semibold leading-tight line-clamp-2">{address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3 flex-shrink-0 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{workingHours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Navigation === */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
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

      {/* === Logout === */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all rounded-xl font-semibold"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  )
}

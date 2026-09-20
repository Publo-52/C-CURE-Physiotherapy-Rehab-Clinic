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
  Mail,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { logout } from "@/app/actions/auth"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export function Sidebar({ profile, currentUser }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
    router.refresh()
  }

  const name = currentUser?.name || profile?.practitionerName || 'Sanatan Manna'
  const phone = profile?.phone || '7942688985'
  const email = currentUser?.email || profile?.email || 'sanatan.manna28072015@gmail.com'
  const address = profile?.address || 'Moyna, Midnapore, West Bengal'
  const workingHours = profile?.workingHours || 'Open 24 Hours'
  const role = currentUser?.role || 'Admin'
  const isSuperAdmin = role === 'Super Admin'

  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-xs select-none transition-colors">
      
      {/* === Header Branding & Doctor Card === */}
      <div className="flex flex-col border-b border-sidebar-border bg-sidebar/50 p-4 space-y-3.5">
        
        {/* Clinic Logo Card */}
        <div className="flex justify-center bg-white dark:bg-card border border-border/80 rounded-2xl p-2.5 shadow-xs transition-all duration-300 hover:shadow-md">
          <Image
            src="/logo.jpg"
            alt="C-CURE Logo"
            width={180}
            height={68}
            className="h-14 w-auto object-contain"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>

        {/* Doctor Clinical ID Card */}
        <div className="bg-card/90 dark:bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/80 p-3.5 space-y-2.5 shadow-xs">
          
          {/* Avatar + Name + Verification */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-11 w-11 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-primary/30 dark:ring-primary/40 bg-muted">
              <Image
                src="/doctor-sonatan.png"
                alt={name}
                fill
                sizes="44px"
                className="object-cover"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-extrabold leading-tight truncate text-foreground">{name}</p>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant={isSuperAdmin ? "default" : "secondary"} 
                  className={cn(
                    "text-[9px] px-1.5 py-0 font-bold tracking-tight rounded-md",
                    isSuperAdmin ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {isSuperAdmin ? <ShieldCheck className="h-2.5 w-2.5 mr-0.5 inline" /> : null}
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Contact & Clinic Location Details */}
          <div className="space-y-1.5 text-[10.5px]">
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-3 w-3 flex-shrink-0 text-primary" />
              <span className="font-semibold tabular-num truncate">{phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-3 w-3 flex-shrink-0 text-primary" />
              <span className="font-semibold truncate leading-tight">{email}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="h-3 w-3 flex-shrink-0 text-primary mt-0.5" />
              <span className="font-semibold leading-snug line-clamp-2">{address}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="font-bold truncate">{workingHours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Navigation Items === */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => {
                  try { router.prefetch(item.href) } catch {}
                }}
                className={cn(
                  "group relative flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active-press",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:translate-x-1"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary-foreground/90 shadow-xs" />
                )}
                <item.icon
                  className={cn(
                    "mr-3 h-4.5 w-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* === Logout Section === */}
      <div className="border-t border-sidebar-border p-3.5">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-all rounded-xl font-semibold active-press"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          {loggingOut ? 'Logging out...' : 'Sign Out'}
        </Button>
      </div>
    </aside>
  )
}

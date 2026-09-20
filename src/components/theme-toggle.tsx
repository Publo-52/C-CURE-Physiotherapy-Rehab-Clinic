"use client"

import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Sun, Moon, Sparkles } from "lucide-react"
import { useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <div 
        className={cn(
          "h-8 w-[68px] rounded-full bg-muted/60 border border-border/60 animate-pulse",
          className
        )} 
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      root.classList.add("theme-transition")
      const nextTheme = isDark ? "light" : "dark"
      setTheme(nextTheme)
      window.setTimeout(() => {
        root.classList.remove("theme-transition")
      }, 400)
    } else {
      setTheme(isDark ? "light" : "dark")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
      className={cn(
        "group relative inline-flex h-8 w-[68px] items-center rounded-full p-1 cursor-pointer select-none outline-none",
        "transition-all duration-300 ease-out active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isDark 
          ? "bg-slate-900 border border-indigo-500/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_0_12px_rgba(99,102,241,0.2)]" 
          : "bg-amber-50/95 hover:bg-amber-100/90 border border-amber-200/90 shadow-[inset_0_2px_4px_rgba(245,158,11,0.1),0_2px_8px_rgba(245,158,11,0.12)]",
        className
      )}
    >
      {/* Background ambient decorative indicators */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {/* Day rays ambient glow */}
        <span 
          className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none",
            isDark ? "opacity-0 scale-50" : "opacity-100 scale-100"
          )}
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-amber-400/25 blur-xs" />
        </span>
        
        {/* Night sparkle ambient glow */}
        <span 
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none",
            isDark ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
        >
          <Sparkles className="h-3 w-3 text-indigo-400/80 animate-pulse" />
        </span>
      </span>

      {/* Static track companion icon guides */}
      <span 
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300",
          isDark ? "opacity-0 scale-75" : "opacity-45 scale-100"
        )}
      >
        <Moon className="h-3.5 w-3.5 text-amber-800/70" />
      </span>
      <span 
        className={cn(
          "absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300",
          isDark ? "opacity-40 scale-100" : "opacity-0 scale-75"
        )}
      >
        <Sun className="h-3.5 w-3.5 text-slate-400" />
      </span>

      {/* GPU-accelerated tactile sliding knob */}
      <motion.span
        initial={false}
        animate={{
          x: isDark ? 36 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 480,
          damping: 30,
          mass: 0.8,
        }}
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-colors duration-300 ease-out",
          isDark 
            ? "bg-slate-800 border border-indigo-400/50 text-indigo-300 shadow-[0_2px_8px_rgba(0,0,0,0.6),0_0_10px_rgba(129,140,248,0.35)]" 
            : "bg-white border border-amber-200 text-amber-500 shadow-[0_2px_6px_rgba(217,119,6,0.25)]"
        )}
      >
        {/* Morphing cross-fade dual icons */}
        <div className="relative h-3.5 w-3.5">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              scale: isDark ? 0 : 1,
              rotate: isDark ? 90 : 0,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sun className="h-3.5 w-3.5 fill-amber-400/35 text-amber-500 shrink-0" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{
              scale: isDark ? 1 : 0,
              rotate: isDark ? 0 : -90,
              opacity: isDark ? 1 : 0,
            }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Moon className="h-3.5 w-3.5 fill-indigo-400/25 text-indigo-300 shrink-0" />
          </motion.div>
        </div>
      </motion.span>

      {showLabel && (
        <span className="sr-only">
          {isDark ? "Night Mode Active" : "Day Mode Active"}
        </span>
      )}
    </button>
  )
}

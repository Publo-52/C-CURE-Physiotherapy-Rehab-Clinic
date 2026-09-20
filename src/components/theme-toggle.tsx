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
          "h-8 w-16 rounded-full bg-muted/60 border border-border/60 animate-pulse",
          className
        )} 
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
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
        "transition-colors duration-400 ease-out",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "active:scale-95 transition-transform",
        isDark 
          ? "bg-slate-900 border border-indigo-500/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_0_12px_rgba(99,102,241,0.15)]" 
          : "bg-amber-50/90 border border-amber-200/80 shadow-[inset_0_2px_4px_rgba(245,158,11,0.1),0_2px_8px_rgba(245,158,11,0.12)]",
        className
      )}
    >
      {/* Background ambient accents */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {/* Day rays ambient */}
        <span 
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-300",
            isDark ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="inline-block h-4 w-4 rounded-full bg-amber-400/20 blur-xs" />
        </span>
        
        {/* Night star ambient */}
        <span 
          className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 transition-opacity duration-300",
            isDark ? "opacity-100" : "opacity-0"
          )}
        >
          <Sparkles className="h-3 w-3 text-indigo-300/60 animate-pulse" />
        </span>
      </span>

      {/* Floating tactile knob */}
      <motion.span
        layout
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 28,
        }}
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-colors duration-300",
          isDark 
            ? "bg-slate-800 border border-indigo-400/40 text-indigo-300 shadow-[0_2px_8px_rgba(0,0,0,0.6),0_0_8px_rgba(129,140,248,0.35)]" 
            : "bg-white border border-amber-200 text-amber-500 shadow-[0_2px_6px_rgba(217,119,6,0.2)]"
        )}
        style={{
          marginLeft: isDark ? "34px" : "0px",
        }}
      >
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0.5, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 40, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Moon className="h-3.5 w-3.5 fill-indigo-400/20 text-indigo-300" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0.5, rotate: 40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: -40, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Sun className="h-3.5 w-3.5 fill-amber-400/30 text-amber-500" />
          </motion.div>
        )}
      </motion.span>

      {/* Static background companion icons */}
      <span 
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-opacity duration-300",
          isDark ? "opacity-30" : "opacity-0"
        )}
      >
        <Sun className="h-3.5 w-3.5 text-zinc-500" />
      </span>
      <span 
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-35"
        )}
      >
        <Moon className="h-3.5 w-3.5 text-amber-700/60" />
      </span>

      {showLabel && (
        <span className="sr-only">
          {isDark ? "Night Mode Active" : "Day Mode Active"}
        </span>
      )}
    </button>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full opacity-70">
        <span className="sr-only">Toggle theme</span>
        <div className="w-5 h-5 bg-muted-foreground/30 rounded-full animate-pulse"></div>
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-10 h-10 rounded-full overflow-hidden",
        "transition-all duration-300 ease-in-out",
        "bg-gradient-to-br",
        isDark
          ? "from-indigo-900/20 to-purple-900/30 hover:from-indigo-800/30 hover:to-purple-800/40"
          : "from-amber-100 to-yellow-200 hover:from-amber-200 hover:to-yellow-300",
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className="sr-only">Toggle theme</span>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-transform duration-500",
          isDark ? "rotate-0" : "-rotate-90 opacity-0",
        )}
      >
        <Moon className="h-5 w-5 text-indigo-100" />
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-transform duration-500",
          isDark ? "rotate-90 opacity-0" : "rotate-0",
        )}
      >
        <Sun className="h-5 w-5 text-amber-600" />
      </div>
      <div
        className={cn(
          "absolute inset-0 opacity-20 transition-opacity duration-500",
          isDark ? "opacity-20" : "opacity-0",
        )}
      >
        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white/80"></div>
        <div className="absolute top-2 left-6 w-0.5 h-0.5 rounded-full bg-white/60"></div>
        <div className="absolute top-4 left-3 w-0.5 h-0.5 rounded-full bg-white/60"></div>
        <div className="absolute top-6 left-7 w-1 h-1 rounded-full bg-white/80"></div>
      </div>
    </Button>
  )
}

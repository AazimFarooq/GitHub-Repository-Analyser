"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"

// Animation variants for better organization
const iconVariants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
}

const starVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.2 },
  exit: { opacity: 0 },
}

const sunbeamVariants = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
}

type ThemeToggleProps = {
  className?: string
  showSystemOption?: boolean
}

export function ThemeToggle({ className, showSystemOption = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")

  // Determine if we're in dark mode for styling
  const isDark = resolvedTheme === "dark"

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault()
        if (showSystemOption) {
          if (theme === "light") setTheme(e.key === "ArrowRight" ? "system" : "dark")
          else if (theme === "dark") setTheme(e.key === "ArrowRight" ? "light" : "system")
          else setTheme(e.key === "ArrowRight" ? "dark" : "light") // system
        } else {
          setTheme(isDark ? "light" : "dark")
        }
      }
    },
    [theme, setTheme, isDark, showSystemOption],
  )

  // Cycle through themes
  const cycleTheme = useCallback(() => {
    if (showSystemOption) {
      if (theme === "light") setTheme("system")
      else if (theme === "system") setTheme("dark")
      else setTheme("light")
    } else {
      setTheme(isDark ? "light" : "dark")
    }
  }, [theme, setTheme, isDark, showSystemOption])

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle haptic feedback on mobile
  const handleClick = () => {
    cycleTheme()

    // Haptic feedback for supported devices
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("w-10 h-10 rounded-full opacity-70", className)}
        disabled
        aria-label="Loading theme toggle"
      >
        <span className="sr-only">Toggle theme</span>
        <div className="w-5 h-5 bg-muted-foreground/30 rounded-full animate-pulse"></div>
      </Button>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative w-10 h-10 rounded-full overflow-hidden",
          "transition-all duration-300 ease-out",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
          isDark
            ? "bg-gradient-to-br from-indigo-900/20 to-purple-900/30 hover:from-indigo-800/30 hover:to-purple-800/40"
            : "bg-gradient-to-br from-amber-100 to-yellow-200 hover:from-amber-200 hover:to-yellow-300",
          className,
        )}
        aria-label={
          showSystemOption
            ? `Current theme: ${theme}. Click to cycle between light, system, and dark themes.`
            : `Switch to ${isDark ? "light" : "dark"} theme`
        }
        role="button"
        aria-pressed={isDark}
        data-state={theme}
        tabIndex={0}
      >
        <span className="sr-only">
          {showSystemOption
            ? `Current theme: ${theme}. Click to cycle between light, system, and dark themes.`
            : `Switch to ${isDark ? "light" : "dark"} theme`}
        </span>

        {/* Theme icon with animation */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10"
          >
            {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
            {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
            {theme === "system" && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
          </motion.div>
        </AnimatePresence>

        {/* Sun rays animation for light theme */}
        <AnimatePresence initial={false}>
          {theme === "light" && (
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`ray-${i}`}
                  className="absolute w-[1px] bg-amber-500/40"
                  style={{
                    height: "10px",
                    left: "50%",
                    top: "50%",
                    transformOrigin: "bottom center",
                    transform: `rotate(${i * 45}deg) translateY(-12px)`,
                  }}
                  variants={sunbeamVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stars animation for dark theme */}
        <AnimatePresence initial={false}>
          {theme === "dark" && (
            <motion.div
              variants={starVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {[
                { top: 1, left: 1, size: 1, delay: 0, duration: 3 },
                { top: 2, left: 6, size: 0.5, delay: 0.3, duration: 2 },
                { top: 4, left: 3, size: 0.5, delay: 0.5, duration: 2.5 },
                { top: 6, left: 7, size: 1, delay: 0.7, duration: 3.5 },
                { top: 5, left: 2, size: 0.7, delay: 0.2, duration: 2.8 },
                { top: 7, left: 4, size: 0.6, delay: 0.6, duration: 3.2 },
              ].map((star, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/80"
                  style={{
                    top: `${star.top}px`,
                    left: `${star.left}px`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: star.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    delay: star.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* System theme indicator */}
        <AnimatePresence initial={false}>
          {theme === "system" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full" />
              <motion.div
                className={cn("absolute w-4 h-4 rounded-full", prefersDark ? "bg-indigo-900/50" : "bg-amber-300/50")}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </MotionConfig>
  )
}

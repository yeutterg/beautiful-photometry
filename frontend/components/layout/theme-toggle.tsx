"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-14 h-7 rounded-full bg-muted animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors hover:bg-muted/80"
        aria-label="Toggle theme"
      >
        <span
          className={`${
            theme === "dark" ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-background shadow-sm ring-0 transition-transform`}
        />
        <span className="sr-only">Toggle theme</span>
      </button>
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
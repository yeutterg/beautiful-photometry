"use client"

import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function PageTitle() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  
  const getTitleForPath = (path: string) => {
    switch(path) {
      case "/spd":
        return "Spectral Power Distribution"
      case "/cri":
        return "Color Rendering Index"
      case "/tm30":
        return "TM-30"
      case "/flicker":
        return "Flicker"
      case "/library":
      case "/":
        return "Library"
      default:
        return ""
    }
  }
  
  const title = getTitleForPath(pathname)
  
  if (!title) return null
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleSidebar}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <h1 className="text-base font-normal">{title}</h1>
    </div>
  )
}
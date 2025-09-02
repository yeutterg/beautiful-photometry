"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function PageTitle() {
  const pathname = usePathname()
  
  const getTitleForPath = (path: string) => {
    switch(path) {
      case "/spd":
        return "Spectral Power Distribution"
      case "/cri":
        return "Color Rendering Index"
      case "/tm30":
        return "TM-30-15"
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
    <div className="flex items-center gap-2 h-full">
      <SidebarTrigger className="-ml-1" />
      <h1 className="text-base font-normal">{title}</h1>
    </div>
  )
}
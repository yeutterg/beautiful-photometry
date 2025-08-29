"use client"

import { usePathname } from "next/navigation"

export function PageTitle() {
  const pathname = usePathname()
  
  const getTitleForPath = (path: string) => {
    switch(path) {
      case "/spd":
        return "Spectral Power Distribution"
      case "/cri":
        return "CRI"
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
    <h1 className="text-base font-normal">{title}</h1>
  )
}
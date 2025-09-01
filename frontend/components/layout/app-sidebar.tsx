"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { Library, LineChart, Activity, Sun, Palette, X } from "lucide-react"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { currentSPDs, aliases, removeCurrentSPD, setAlias } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const { setOpen } = useSidebar()

  // Auto-expand sidebar when items get loaded
  useEffect(() => {
    if (currentSPDs.length > 0) {
      setOpen(true)
    }
  }, [currentSPDs.length, setOpen])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-3">
        <h1 className="text-base font-normal group-data-[collapsible=icon]:hidden">Beautiful Photometry</h1>
      </SidebarHeader>
      <SidebarContent>
        {/* Library Section */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/library" || pathname === "/"}>
                <Link href="/library">
                  <Library className="h-4 w-4" />
                  <span>Library</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Photometrics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Photometrics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/spd"}>
                  <Link href="/spd">
                    <LineChart className="h-4 w-4" />
                    <span>SPD</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/cri"}>
                  <Link href="/cri">
                    <Palette className="h-4 w-4" />
                    <span>CRI</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tm30"}>
                  <Link href="/tm30">
                    <Sun className="h-4 w-4" />
                    <span>TM-30</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Loaded Items Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Loaded Items
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentSPDs.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">
                  No items loaded
                </div>
              ) : (
                currentSPDs.map((id) => {
                  const libItem = getItem(id)
                  const defaultTitle = libItem?.title || id
                  const displayTitle = aliases[id] || defaultTitle
                  const isEditing = editingId === id
                  return (
                    <SidebarMenuItem key={id}>
                      {isEditing ? (
                        <div className="px-2 py-1">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => {
                              const trimmed = editingText.trim()
                              if (trimmed && trimmed !== defaultTitle) setAlias(id, trimmed)
                              if (!trimmed) setAlias(id, defaultTitle)
                              setEditingId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = editingText.trim()
                                if (trimmed && trimmed !== defaultTitle) setAlias(id, trimmed)
                                if (!trimmed) setAlias(id, defaultTitle)
                                setEditingId(null)
                              }
                              if (e.key === 'Escape') {
                                setEditingId(null)
                              }
                            }}
                            className="h-7 text-xs"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          tooltip={displayTitle}
                        >
                          <Link href="/spd" onDoubleClick={(e) => {
                            e.preventDefault()
                            setEditingId(id)
                            setEditingText(displayTitle)
                          }}>
                            <LineChart className="h-4 w-4" />
                            <span className="truncate" title={displayTitle}>{displayTitle}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                      {!isEditing && (
                        <SidebarMenuAction
                          title="Unload"
                          onClick={() => removeCurrentSPD(id)}
                          aria-label={`Unload ${displayTitle}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Temporal Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Temporal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/flicker"}>
                  <Link href="/flicker">
                    <Activity className="h-4 w-4" />
                    <span>Flicker</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

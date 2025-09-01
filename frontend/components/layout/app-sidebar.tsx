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
import { Library, LineChart, Activity, Sun, Palette, X, GripVertical, Pencil } from "lucide-react"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AppSidebar() {
  const pathname = usePathname()
  const { currentSPDs, aliases, spdColors, removeCurrentSPD, setAlias, setSpdColor, reorderCurrentSPDs } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)
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

        {/* Loaded Items Section - moved right after Library */}
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
                currentSPDs.map((id, index) => {
                  const libItem = getItem(id)
                  const defaultTitle = libItem?.title || id
                  const displayTitle = aliases[id] || defaultTitle
                  const isEditing = editingId === id
                  const itemColor = spdColors[id] || '#808080'
                  
                  const handleDragStart = (e: React.DragEvent) => {
                    setDraggedIndex(index)
                    e.dataTransfer.effectAllowed = "move"
                  }
                  
                  const handleDragOver = (e: React.DragEvent) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                  }
                  
                  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
                    e.preventDefault()
                    if (draggedIndex === null || draggedIndex === dropIndex) return
                    
                    const newSPDs = [...currentSPDs]
                    const [removed] = newSPDs.splice(draggedIndex, 1)
                    newSPDs.splice(dropIndex, 0, removed)
                    reorderCurrentSPDs(newSPDs)
                    setDraggedIndex(null)
                  }
                  
                  return (
                    <SidebarMenuItem 
                      key={id}
                      draggable
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onMouseEnter={() => setHoveredId(id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {isEditing ? (
                        <div className="px-2 py-1 flex items-center gap-1">
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
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <SidebarMenuButton
                            asChild
                            tooltip={displayTitle}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {hoveredId === id && (
                                <GripVertical className="h-4 w-4 cursor-move flex-shrink-0" />
                              )}
                              <Popover open={colorPickerOpen === id} onOpenChange={(open) => setColorPickerOpen(open ? id : null)}>
                                <PopoverTrigger asChild>
                                  <button
                                    className="h-4 w-4 rounded border border-border hover:scale-110 transition-transform flex-shrink-0"
                                    style={{ backgroundColor: itemColor }}
                                    title="Change color"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setColorPickerOpen(colorPickerOpen === id ? null : id)
                                    }}
                                  />
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="start">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Choose a color</p>
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
                                        '#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e',
                                        '#a29bfe', '#fab1a0', '#e17055', '#74b9ff',
                                        '#55efc4', '#ffeaa7', '#ff7675', '#636e72'
                                      ].map(color => (
                                        <button
                                          key={color}
                                          className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                                          style={{ backgroundColor: color }}
                                          onClick={() => {
                                            setSpdColor(id, color)
                                            setColorPickerOpen(null)
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <Input
                                        type="color"
                                        value={itemColor}
                                        onChange={(e) => setSpdColor(id, e.target.value)}
                                        className="h-8 w-20 p-1"
                                      />
                                      <Input
                                        type="text"
                                        value={itemColor}
                                        onChange={(e) => setSpdColor(id, e.target.value)}
                                        className="h-8 flex-1"
                                        placeholder="#000000"
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Link 
                                href="/spd" 
                                className="flex items-center flex-1 min-w-0"
                                onDoubleClick={(e) => {
                                  e.preventDefault()
                                  setEditingId(id)
                                  setEditingText(displayTitle)
                                }}
                              >
                                <span className="truncate" title={displayTitle}>{displayTitle}</span>
                              </Link>
                            </div>
                          </SidebarMenuButton>
                          {hoveredId === id && (
                            <>
                              <SidebarMenuAction
                                title="Rename"
                                onClick={() => {
                                  setEditingId(id)
                                  setEditingText(displayTitle)
                                }}
                                aria-label={`Rename ${displayTitle}`}
                                className="!right-7"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </SidebarMenuAction>
                              <SidebarMenuAction
                                title="Unload"
                                onClick={() => removeCurrentSPD(id)}
                                aria-label={`Unload ${displayTitle}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </SidebarMenuAction>
                            </>
                          )}
                        </>
                      )}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
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

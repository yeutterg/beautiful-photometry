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
} from "@/components/ui/sidebar"
import { Library, LineChart, Activity, Sun } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="border-b px-6 py-4">
        <h1 className="text-xl">Beautiful Photometry</h1>
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
                <SidebarMenuButton asChild isActive={pathname === "/photometrics"}>
                  <Link href="/photometrics">
                    <LineChart className="h-4 w-4" />
                    <span>Spectral Power Distribution</span>
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
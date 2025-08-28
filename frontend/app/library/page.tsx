"use client"

import { useState } from "react"
import { ImportSection } from "@/components/library/import-section"
import { DataLibrary } from "@/components/library/data-library"

export default function LibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <ImportSection onDataChange={handleDataChange} />
      <DataLibrary key={refreshKey} />
    </div>
  )
}
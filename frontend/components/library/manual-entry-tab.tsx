"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useLibraryStore } from "@/lib/store"

interface ManualEntryTabProps {
  dataType: string
}

export function ManualEntryTab({ dataType }: ManualEntryTabProps) {
  const [data, setData] = useState("")
  const [name, setName] = useState("")
  const { addItem } = useLibraryStore()

  const handleImport = async () => {
    if (!data.trim()) {
      toast.error("Please enter some data to import")
      return
    }
    
    try {
      toast.loading("Importing CSV data...")
      const result = await api.pasteCSV(data, name || undefined)
      
      if (result.success && result.spd_data) {
        addItem({
          title: result.metrics?.name || name || 'Pasted SPD',
          type: 'SPD',
          data: result.spd_data,
        })
        toast.success(result.message || "Data imported successfully")
        setData("")
        setName("")
        
        // Refresh the page to reload library from filesystem
        window.location.reload()
      } else {
        toast.error("Failed to import data")
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error("Failed to import data")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="spd-name" className="block text-sm font-medium mb-2">
          SPD Name (optional)
        </Label>
        <Input
          id="spd-name"
          type="text"
          placeholder="Enter a name for this SPD"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Textarea
        className="min-h-[300px] font-mono text-sm"
        placeholder={dataType === "spd" 
          ? "Wavelength (nm), Value\n380, 0.005\n381, 0.01\n..." 
          : "Time (ms), Value\n0, 100\n10, 98\n..."}
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <Button 
        className="w-full" 
        onClick={handleImport}
        disabled={!data.trim()}
      >
        Import Data
      </Button>
    </div>
  )
}
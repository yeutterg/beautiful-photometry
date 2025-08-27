"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ManualEntryTabProps {
  dataType: string
}

export function ManualEntryTab({ dataType }: ManualEntryTabProps) {
  const [data, setData] = useState("")

  const handleImport = () => {
    if (!data.trim()) {
      toast.error("Please enter some data to import")
      return
    }
    
    // TODO: Implement data import to backend
    console.log("Importing manual data:", data)
    toast.success("Data imported successfully")
    setData("")
  }

  return (
    <div className="space-y-4">
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
"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { UploadTab } from "./upload-tab"
import { ManualEntryTab } from "./manual-entry-tab"

interface ImportSectionProps {
  onDataChange?: () => void
}

export function ImportSection({ onDataChange }: ImportSectionProps) {
  const [dataType, setDataType] = useState("spd")

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-2xl font-bold mb-4">Import Data</h2>
      
      {/* Data Type Dropdown */}
      <div className="mb-4">
        <Label htmlFor="data-type" className="block text-sm font-medium mb-2">
          Data Type
        </Label>
        <Select defaultValue="spd" value={dataType} onValueChange={setDataType}>
          <SelectTrigger id="data-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spd">Spectral Power Distribution</SelectItem>
            <SelectItem value="flicker">Flicker Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Import Method Tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manual">Manual Data Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-4">
          <UploadTab dataType={dataType} onUploadComplete={onDataChange} />
        </TabsContent>
        <TabsContent value="manual" className="mt-4">
          <ManualEntryTab dataType={dataType} onEntryComplete={onDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
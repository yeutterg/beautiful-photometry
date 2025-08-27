"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Trash2, BarChart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"

// Mock data - will be replaced with real data from API
const mockData = [
  {
    id: "1",
    title: "LED 2700K Sample",
    type: "SPD" as const,
    createdDate: new Date("2024-01-15"),
    data: Object.fromEntries(
      Array.from({length: 81}, (_, i) => [
        (380 + i * 5).toString(),
        Math.random() * 100
      ])
    )
  },
  {
    id: "2",
    title: "Daylight Measurement",
    type: "SPD" as const,
    createdDate: new Date("2024-01-16"),
    data: Object.fromEntries(
      Array.from({length: 81}, (_, i) => [
        (380 + i * 5).toString(),
        Math.random() * 100
      ])
    )
  },
]

export function DataLibrary() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [data, setData] = useState(mockData)
  const { setCurrentSPDs } = useAnalysisStore()
  const { addItem, items } = useLibraryStore()
  
  // Use library items instead of mock data when available
  useEffect(() => {
    if (items.length > 0) {
      setData(items.filter(item => item.type === 'SPD').map(item => ({
        id: item.id,
        title: item.title,
        type: 'SPD' as const,
        createdDate: item.createdDate,
        data: item.data
      })))
    } else {
      // Initialize with mock data
      mockData.forEach(item => {
        addItem({
          title: item.title,
          type: item.type,
          data: item.data
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItems(selectedIds)
  }

  const handleDelete = () => {
    if (selectedItems.length === 0) return
    
    const confirmDelete = confirm(`Delete ${selectedItems.length} item(s)?`)
    if (confirmDelete) {
      setData(data.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`Deleted ${selectedItems.length} item(s)`)
    }
  }

  const handleAnalyze = () => {
    if (selectedItems.length === 0) return
    
    const selectedData = data.filter(item => selectedItems.includes(item.id))
    const hasFlicker = selectedData.some(item => item.type !== "SPD")
    
    if (hasFlicker) {
      router.push("/flicker")
    } else {
      // Load selected SPDs into analysis store
      const spdIds = selectedData.filter(item => item.type === "SPD").map(item => item.id)
      setCurrentSPDs(spdIds)
      router.push("/photometrics")
      toast.success(`Loaded ${spdIds.length} SPD(s) for analysis`)
    }
  }

  const handleRowClick = (item: { id: string; title: string; type: string; createdDate: Date; data?: Record<string, number> }) => {
    if (item.type === "SPD") {
      // Load single SPD into analysis store  
      setCurrentSPDs([item.id])
      router.push("/photometrics")
      toast.success(`Loaded ${item.title} for analysis`)
    } else if (item.type === "Flicker") {
      router.push("/flicker")
    }
  }

  const handleRename = (id: string, newTitle: string) => {
    setData(data.map(item => 
      item.id === id ? { ...item, title: newTitle } : item
    ))
  }

  const handleDateChange = (id: string, newDate: Date) => {
    setData(data.map(item => 
      item.id === id ? { ...item, createdDate: newDate } : item
    ))
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Data Library</h2>
        {selectedItems.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedItems.length})
            </Button>
            <Button 
              size="sm"
              onClick={handleAnalyze}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Analyze ({selectedItems.length})
            </Button>
          </div>
        )}
      </div>
      
      <DataTable
        data={data}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onRowClick={handleRowClick}
        onRename={handleRename}
        onDateChange={handleDateChange}
      />
    </div>
  )
}
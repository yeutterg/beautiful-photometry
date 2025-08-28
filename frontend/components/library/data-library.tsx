"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Trash2, BarChart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"

export function DataLibrary() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [data, setData] = useState<Array<{
    id: string
    title: string
    type: 'SPD'
    createdDate: Date
    data?: Record<string, number>
  }>>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentSPDs } = useAnalysisStore()
  const { addItem, items } = useLibraryStore()
  
  // Load library items from API on mount (only if empty)
  useEffect(() => {
    const loadLibraryItems = async () => {
      try {
        setLoading(true)
        
        // If we already have items in the store, use them
        if (items.length > 0) {
          setData(items.filter(item => item.type === 'SPD').map(item => ({
            id: item.id,
            title: item.title,
            type: 'SPD' as const,
            createdDate: item.createdDate,
            data: item.data,
            filepath: item.metadata?.filepath,
            folder: item.metadata?.folder
          })))
          setLoading(false)
          return
        }
        
        // Otherwise load from API
        const response = await api.getLibraryItems()
        const libraryItems = response.items || []
        
        // Convert API items to library format and add to store
        const formattedItems = libraryItems.map(item => ({
          id: item.id,
          title: item.title,
          type: 'SPD' as const,
          createdDate: new Date(item.createdDate),
          data: item.data || {},
          filepath: item.filepath,
          folder: item.folder
        }))
        
        // Add items to store and set local data
        formattedItems.forEach(item => {
          addItem({
            title: item.title,
            type: item.type,
            data: item.data || {},
            metadata: {
              filepath: item.filepath,
              folder: item.folder
            }
          })
        })
        
        setData(formattedItems)
      } catch (error) {
        console.error('Failed to load library items:', error)
        toast.error('Failed to load library items')
      } finally {
        setLoading(false)
      }
    }
    
    loadLibraryItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Sync with library store changes
  useEffect(() => {
    if (!loading && items.length > 0) {
      setData(items.filter(item => item.type === 'SPD').map(item => ({
        id: item.id,
        title: item.title,
        type: 'SPD' as const,
        createdDate: item.createdDate,
        data: item.data
      })))
    }
  }, [items, loading])

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
      console.log('Row clicked:', item)
      console.log('SPD data available:', !!item.data, 'Data keys:', item.data ? Object.keys(item.data).length : 0)
      
      // Ensure item is in the library store with the same ID
      const storeItem = items.find(i => i.id === item.id)
      if (!storeItem) {
        console.log('Item not in store, checking by title...')
        // Try to find by title as fallback
        const titleMatch = items.find(i => i.title === item.title)
        if (titleMatch) {
          console.log('Found by title, using ID:', titleMatch.id)
          setCurrentSPDs([titleMatch.id])
          router.push("/photometrics")
          toast.success(`Loaded ${item.title} for analysis`)
          return
        }
      }
      
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
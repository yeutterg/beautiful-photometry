"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Trash2, BarChart, RefreshCw } from "lucide-react"
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
  const { addItem, addItemWithId, items, clearItems } = useLibraryStore()
  const [forceRefresh, setForceRefresh] = useState(0)
  
  // Load library items from API on mount (only if empty)
  useEffect(() => {
    const loadLibraryItems = async () => {
      try {
        setLoading(true)
        
        // Check if we already have items loaded and not forcing refresh
        if (items.length > 0 && forceRefresh === 0) {
          console.log('Using existing items from store:', items.length)
          setData(items.filter(item => item.type === 'SPD').map(item => ({
            id: item.id,
            title: item.title,
            type: 'SPD' as const,
            createdDate: item.createdDate,
            data: item.data
          })))
          setLoading(false)
          return
        }
        
        // Load from API
        console.log('Loading from API (force refresh or empty store)')
        clearItems() // Clear before loading to ensure clean state
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
        
        console.log('=== LOADING LIBRARY ITEMS FROM API ===')
        console.log('Received items:', libraryItems.map(item => ({ 
          id: item.id, 
          title: item.title,
          filepath: item.filepath,
          hasData: !!item.data 
        })))
        
        // Add items to store with their original IDs
        formattedItems.forEach(item => {
          console.log(`Adding to store: ID=${item.id}, Title=${item.title}`)
          addItemWithId({
            id: item.id,
            title: item.title,
            type: item.type,
            data: item.data || {},
            metadata: {
              filepath: item.filepath,
              folder: item.folder
            }
          })
        })
        
        // Sort items by ID for consistent ordering
        const sortedItems = [...formattedItems].sort((a, b) => a.id.localeCompare(b.id))
        setData(sortedItems)
      } catch (error) {
        console.error('Failed to load library items:', error)
        toast.error('Failed to load library items')
      } finally {
        setLoading(false)
      }
    }
    
    loadLibraryItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceRefresh])
  
  // Don't sync automatically - we manage data state independently
  // This prevents conflicts between API-loaded items and store items

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
      console.log('Item ID:', item.id, 'Title:', item.title)
      console.log('SPD data available:', !!item.data, 'Data keys:', item.data ? Object.keys(item.data).length : 0)
      
      // Log all store items to debug
      console.log('Store items:', items.map(i => ({ id: i.id, title: i.title })))
      
      // Ensure item is in the library store with the same ID
      const storeItem = items.find(i => i.id === item.id)
      if (!storeItem) {
        console.log('WARNING: Item not found in store by ID:', item.id)
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
        console.log('ERROR: Item not found in store at all')
        toast.error(`Could not find ${item.title} in library`)
        return
      }
      
      console.log('Found in store, setting current SPD to:', item.id)
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
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForceRefresh(prev => prev + 1)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
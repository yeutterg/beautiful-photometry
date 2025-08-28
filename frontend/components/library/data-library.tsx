"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, BarChart, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"

export function DataLibrary() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [allData, setAllData] = useState<Array<{
    id: string
    title: string
    type: 'SPD'
    createdDate: Date
    data?: Record<string, number>
    source?: string // 'examples' or 'user'
    filepath?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentSPDs } = useAnalysisStore()
  const { addItemWithId, items, clearItems } = useLibraryStore()
  const [forceRefresh, setForceRefresh] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  
  // Load library items from API on mount (only if empty)
  useEffect(() => {
    const loadLibraryItems = async () => {
      try {
        setLoading(true)
        
        // Check if we already have items loaded and not forcing refresh
        if (items.length > 0 && forceRefresh === 0) {
          console.log('Using existing items from store:', items.length)
          setAllData(items.filter(item => item.type === 'SPD').map(item => ({
            id: item.id,
            title: item.title,
            type: 'SPD' as const,
            createdDate: item.createdDate,
            data: item.data,
            source: item.metadata?.filepath?.includes('examples') ? 'examples' : 
                    item.metadata?.filepath?.includes('user') ? 'user' : 'other',
            filepath: item.metadata?.filepath
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
          folder: item.folder,
          source: item.filepath?.includes('examples') ? 'examples' : 
                  item.filepath?.includes('user') ? 'user' : 'other'
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
        setAllData(sortedItems)
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
  
  // Filter data based on active tab
  const filteredData = allData.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'examples') return item.source === 'examples'
    if (activeTab === 'my-data') return item.source === 'user'
    return true
  })

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItems(selectedIds)
  }

  const handleDelete = () => {
    if (selectedItems.length === 0) return
    
    const confirmDelete = confirm(`Delete ${selectedItems.length} item(s)?`)
    if (confirmDelete) {
      setAllData(allData.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`Deleted ${selectedItems.length} item(s)`)
    }
  }

  const handleAnalyze = () => {
    if (selectedItems.length === 0) return
    
    const selectedData = filteredData.filter(item => selectedItems.includes(item.id))
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

  const handleRename = async (id: string, newTitle: string) => {
    const item = allData.find(i => i.id === id)
    if (!item || !item.filepath) {
      toast.error("Cannot rename: item filepath not found")
      return
    }
    
    try {
      const response = await api.renameLibraryItem(item.filepath, newTitle)
      if (response.success && response.newFilepath && response.newId) {
        // Update the item with new ID and filepath
        setAllData(allData.map(i => 
          i.id === id ? { 
            ...i, 
            id: response.newId as string,  // Type assertion since we checked it exists
            title: newTitle,
            filepath: response.newFilepath as string  // Type assertion since we checked it exists
          } : i
        ))
        // Also update in store
        const storeItem = items.find(i => i.id === id)
        if (storeItem) {
          // Remove old item and add with new ID
          clearItems()
          setForceRefresh(prev => prev + 1) // Force refresh to reload from API
        }
        toast.success("File renamed successfully")
      } else {
        toast.error(response.error || "Failed to rename file")
      }
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename file")
    }
  }

  const handleDateChange = (id: string, newDate: Date) => {
    setAllData(allData.map(item => 
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">
            All ({allData.length})
          </TabsTrigger>
          <TabsTrigger value="examples">
            Examples ({allData.filter(d => d.source === 'examples').length})
          </TabsTrigger>
          <TabsTrigger value="my-data">
            My Data ({allData.filter(d => d.source === 'user').length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <DataTable
            data={filteredData}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
            onRowClick={handleRowClick}
            onRename={handleRename}
            onDateChange={handleDateChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
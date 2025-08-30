"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CRIBarChart } from "@/components/cri/cri-bar-chart"
import { CRITable } from "@/components/cri/cri-table"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CRIData {
  id: string
  name: string
  values: {
    ra?: number
    r1?: number
    r2?: number
    r3?: number
    r4?: number
    r5?: number
    r6?: number
    r7?: number
    r8?: number
    r9?: number
    r10?: number
    r11?: number
    r12?: number
    r13?: number
    r14?: number
    r15?: number
  }
}

export default function CRIPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [criData, setCriData] = useState<CRIData[]>([])
  const { currentSPDs } = useAnalysisStore()
  const { getItem } = useLibraryStore()

  useEffect(() => {
    const fetchCRIData = async () => {
      if (currentSPDs.length === 0) {
        setCriData([])
        return
      }

      setIsLoading(true)
      try {
        const spds = currentSPDs.map(id => getItem(id)).filter(Boolean)
        if (spds.length === 0) {
          setIsLoading(false)
          return
        }

        // Mock CRI data for now - will be replaced with actual API call
        const mockCriResults = spds.map(spd => ({
          id: spd!.id,
          name: spd!.title,
          values: {
            ra: 85 + Math.random() * 15,
            r1: 80 + Math.random() * 20,
            r2: 80 + Math.random() * 20,
            r3: 80 + Math.random() * 20,
            r4: 80 + Math.random() * 20,
            r5: 80 + Math.random() * 20,
            r6: 80 + Math.random() * 20,
            r7: 80 + Math.random() * 20,
            r8: 80 + Math.random() * 20,
            r9: 70 + Math.random() * 30,
            r10: 80 + Math.random() * 20,
            r11: 80 + Math.random() * 20,
            r12: 80 + Math.random() * 20,
            r13: 80 + Math.random() * 20,
            r14: 80 + Math.random() * 20,
            r15: 80 + Math.random() * 20
          }
        }))

        setCriData(mockCriResults)
      } catch (error) {
        console.error('Error fetching CRI data:', error)
        toast.error('Failed to fetch CRI data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCRIData()
  }, [currentSPDs, getItem])

  if (currentSPDs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No SPDs Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select SPDs from the library to view CRI analysis
          </p>
          <a href="/library" className="text-primary hover:underline">
            Go to Library →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Color Rendering Index</h1>
      </div>

      {/* Bar Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">CRI Values Comparison</h2>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Loading CRI data...</p>
            </div>
          </div>
        ) : (
          <CRIBarChart data={criData} />
        )}
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">CRI Values Table</h2>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Loading table...</p>
            </div>
          </div>
        ) : (
          <CRITable data={criData} />
        )}
      </Card>
    </div>
  )
}
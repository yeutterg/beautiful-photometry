"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { MetricBarChart } from "@/components/shared/metric-bar-chart"
import { TM30Table } from "@/components/tm30/tm30-table"
import { Checkbox } from "@/components/ui/checkbox"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { toPng } from "html-to-image"
import { TM30_COLORS } from "@/lib/tm30-constants"

const TS_API_BASE_URL = process.env.NEXT_PUBLIC_TS_API_URL || 'http://localhost:8081'

interface TM30Data {
  id: string
  name: string
  values: Record<string, number | undefined> // Dynamic to handle all 99 TCS values
}

export default function TM30Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [tm30Data, setTm30Data] = useState<TM30Data[]>([])
  const [exportWidth, setExportWidth] = useState(1920)
  const [exportHeight, setExportHeight] = useState(1080)
  const [showValues, setShowValues] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const { currentSPDs, spdColors, aliases } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const chartRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTM30Data = async () => {
      if (currentSPDs.length === 0) {
        setTm30Data([])
        return
      }

      setIsLoading(true)
      try {
        const spds = currentSPDs.map(id => getItem(id)).filter(Boolean)
        if (spds.length === 0) {
          setIsLoading(false)
          return
        }

        // Call TypeScript backend for TM-30 calculations
        const response = await fetch(`${TS_API_BASE_URL}/api/tm30/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spds: spds.map(spd => ({
              id: spd!.id,
              name: aliases[spd!.id] || spd!.title,
              data: spd!.data
            }))
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch TM-30 data: ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success && result.results) {
          // Transform the results for our chart format
          const formattedResults = result.results.map((spdResult: {
            id: string;
            name: string;
            tm30: {
              Rf?: number;
              Rg?: number;
              Rf_hue?: Record<string, number>;
              TCS?: Record<string, number>;
            } | null;
          }) => {
            const values: TM30Data['values'] = {}
            
            // Use the individual TCS values from the backend
            if (spdResult.tm30 && spdResult.tm30.TCS) {
              Object.keys(spdResult.tm30.TCS).forEach((tcsKey: string) => {
                values[tcsKey] = spdResult.tm30!.TCS![tcsKey]
              })
            }
            
            return {
              id: spdResult.id,
              name: spdResult.name,
              values
            }
          })

          setTm30Data(formattedResults)
        } else {
          console.error('Failed to fetch TM-30 data:', result.error)
          toast.error('Failed to fetch TM-30 data')
        }
      } catch (error) {
        console.error('Error fetching TM-30 data:', error)
        toast.error('Failed to fetch TM-30 data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTM30Data()
  }, [currentSPDs, getItem, aliases])

  const exportChart = async () => {
    if (!chartRef.current || tm30Data.length === 0) {
      toast.error("Chart is not ready for export")
      return
    }
    
    try {
      const element = chartRef.current
      element.classList.add('exporting')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: exportWidth,
        height: exportHeight,
        style: {
          transform: previewMode ? undefined : `scale(${exportWidth / element.offsetWidth}, ${exportHeight / element.offsetHeight})`,
          transformOrigin: 'top left',
          width: previewMode ? undefined : `${element.offsetWidth}px`,
          height: previewMode ? undefined : `${element.offsetHeight}px`
        },
        filter: (node) => {
          const element = node as HTMLElement
          return !element.classList?.contains('export-controls') && 
                 !element.classList?.contains('edit-button')
        }
      })
      
      element.classList.remove('exporting')
      
      const link = document.createElement('a')
      link.download = `tm30-chart-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Chart exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export chart')
    }
  }
  
  const exportChartAsCSV = () => {
    if (tm30Data.length === 0) return
    
    // Create CSV content
    const headers = ['Metric', ...tm30Data.map(d => d.name)]
    const rows = []
    
    // Add TCS rows for all 99 samples
    for (let i = 1; i <= 99; i++) {
      const key = `TCS${i.toString().padStart(2, '0')}`
      rows.push([key, ...tm30Data.map(d => 
        d.values[key] !== undefined ? d.values[key]!.toFixed(1) : '-'
      )])
    }
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tm30-data-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.info('Exported as CSV file')
  }

  const exportTable = async () => {
    if (!tableRef.current || tm30Data.length === 0) {
      toast.error("Table is not ready for export")
      return
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const element = tableRef.current
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      const link = document.createElement('a')
      link.download = `tm30-table-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Table exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      exportChartAsCSV() // Fallback to CSV
    }
  }

  if (currentSPDs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No SPDs Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select SPDs from the library to view TM-30 analysis
          </p>
          <a href="/library" className="text-primary hover:underline">
            Go to Library →
          </a>
        </div>
      </div>
    )
  }

  // Define the metric keys for all 99 TM-30 TCS values
  const tm30MetricKeys = Array.from({ length: 99 }, (_, i) => 
    `TCS${(i + 1).toString().padStart(2, '0')}`
  )

  const formatTM30Label = (key: string) => {
    // TCS keys are already in the right format
    return key
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Bar Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">TM-30 Chart</h2>
          <div className="flex items-center gap-4 export-controls">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && tm30Data.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="export-width" className="text-sm">Width:</Label>
                  <Input
                    id="export-width"
                    type="number"
                    value={exportWidth}
                    onChange={(e) => {
                      setExportWidth(Number(e.target.value))
                      setPreviewMode(true)
                    }}
                    className="w-20 h-8"
                    min="100"
                    max="10000"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="export-height" className="text-sm">Height:</Label>
                  <Input
                    id="export-height"
                    type="number"
                    value={exportHeight}
                    onChange={(e) => {
                      setExportHeight(Number(e.target.value))
                      setPreviewMode(true)
                    }}
                    className="w-20 h-8"
                    min="100"
                    max="10000"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
                <Button 
                  onClick={() => setPreviewMode(!previewMode)} 
                  variant="outline" 
                  size="sm"
                  className="mr-2"
                >
                  {previewMode ? 'Reset View' : 'Preview'}
                </Button>
                <Button onClick={exportChart} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Loading TM-30 data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Checkbox outside the exportable area */}
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="show-values" 
                checked={showValues}
                onCheckedChange={(checked) => setShowValues(checked as boolean)}
              />
              <Label htmlFor="show-values" className="text-sm font-normal cursor-pointer">
                Show values on chart
              </Label>
            </div>
            <div 
              ref={chartRef} 
              className="rounded-lg p-4 overflow-auto"
              style={{
                backgroundColor: 'var(--background)',
                ...(previewMode ? {
                  width: `${Math.min(exportWidth, typeof window !== 'undefined' ? window.innerWidth - 100 : 1920)}px`,
                  height: `${Math.min(exportHeight, typeof window !== 'undefined' ? window.innerHeight - 200 : 1080)}px`
                } : {})
              }}
            >
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <MetricBarChart 
                  data={tm30Data}
                  title="TM-30 Test Color Samples (99 CES)"
                  exportMode={false} 
                  showValues={false} // Don't show values for 99 samples - too crowded
                  width={previewMode ? exportWidth : Math.max(3000, tm30MetricKeys.length * 35)}
                  height={previewMode ? exportHeight : 400}
                  colors={tm30Data.map(d => spdColors[d.id] || '#808080')}
                  barColors={TM30_COLORS}
                  yDomain={[0, 100]}
                  metricKeys={tm30MetricKeys}
                  formatXLabel={formatTM30Label}
                />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">TM-30 Values</h2>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && tm30Data.length > 0 && (
              <Button onClick={exportTable} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Loading table...</p>
            </div>
          </div>
        ) : (
          <div ref={tableRef} className="bg-card p-4">
            <TM30Table data={tm30Data} />
          </div>
        )}
      </Card>
    </div>
  )
}
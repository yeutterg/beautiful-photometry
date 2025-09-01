"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { CRIBarChart } from "@/components/cri/cri-bar-chart"
import { Checkbox } from "@/components/ui/checkbox"
import { CRITable } from "@/components/cri/cri-table"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { toPng } from "html-to-image"

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
  const [exportWidth, setExportWidth] = useState(1920)
  const [exportHeight, setExportHeight] = useState(1080)
  const [showValues, setShowValues] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const { currentSPDs, visibleSPDs, spdColors } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const chartRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCRIData = async () => {
      // Filter to only visible SPDs
      const visibleIds = currentSPDs.filter(id => visibleSPDs[id] !== false)
      
      if (visibleIds.length === 0) {
        setCriData([])
        return
      }

      setIsLoading(true)
      try {
        const spds = visibleIds.map(id => getItem(id)).filter(Boolean)
        if (spds.length === 0) {
          setIsLoading(false)
          return
        }

        // Use mock CRI data for now - backend integration needs work
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
  }, [currentSPDs, visibleSPDs, getItem])

  const exportChart = async () => {
    if (!chartRef.current || criData.length === 0) {
      toast.error("Chart is not ready for export")
      return
    }
    
    try {
      const element = chartRef.current
      
      // Add a temporary class to force export styles
      element.classList.add('exporting')
      
      // Wait for chart to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Use html-to-image with scaling
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
          // Exclude controls and edit buttons
          const element = node as HTMLElement
          return !element.classList?.contains('export-controls') && 
                 !element.classList?.contains('edit-button')
        }
      })
      
      // Remove the export class
      element.classList.remove('exporting')
      
      // Download the image
      const link = document.createElement('a')
      link.download = `cri-chart-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Chart exported successfully')
    } catch (error) {
      console.error('PNG export failed:', error)
      
      // Try fallback method
      try {
        await exportChartFallback()
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError)
        toast.error('Unable to export chart as PNG. Please try using browser screenshot or export as CSV.')
      }
    }
  }
  
  const exportChartFallback = async () => {
    if (!chartRef.current) throw new Error('Chart not ready')
    
    // Get the SVG element from Recharts
    const svg = chartRef.current.querySelector('svg.recharts-surface')
    if (!svg) throw new Error('No chart SVG found')
    
    // Create canvas with user-defined dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get canvas context')
    
    canvas.width = exportWidth
    canvas.height = exportHeight
    
    // Draw white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Get SVG dimensions
    const svgRect = svg.getBoundingClientRect()
    const scale = Math.min(
      exportWidth / svgRect.width,
      exportHeight / svgRect.height
    )
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    // Draw SVG on canvas
    const img = new Image()
    img.onload = () => {
      ctx.save()
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      URL.revokeObjectURL(svgUrl)
      
      // Download canvas as PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob')
        }
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `cri-chart-${new Date().toISOString().split('T')[0]}.png`
        link.href = url
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('Chart exported successfully (fallback method)')
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      throw new Error('Failed to load SVG image')
    }
    img.src = svgUrl
  }
  
  const exportChartAsCSV = () => {
    if (criData.length === 0) return
    
    // Create CSV content
    const headers = ['R-Value', ...criData.map(d => d.name)]
    const rows = []
    
    // Add Ra row
    rows.push(['Ra', ...criData.map(d => Math.round(d.values.ra || 0))])
    
    // Add R1-R15 rows
    for (let i = 1; i <= 15; i++) {
      const key = `r${i}` as keyof typeof criData[0]['values']
      rows.push([`R${i}`, ...criData.map(d => Math.round(d.values[key] || 0))])
    }
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cri-data-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.info('Exported as CSV file')
  }

  const exportTable = async () => {
    if (!tableRef.current || criData.length === 0) {
      toast.error("Table is not ready for export")
      return
    }
    
    try {
      // Wait a bit for table to fully render
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const element = tableRef.current
      
      // Use html-to-image for table export too
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = `cri-table-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
      
      toast.success('Table exported successfully')
    } catch (error) {
      console.error('Export error details:', error)
      
      // Fallback to CSV export
      try {
        exportChartAsCSV()
      } catch (csvError) {
        console.error('CSV export also failed:', csvError)
        toast.error('Failed to export table. Please try using a screenshot tool.')
      }
    }
  }

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
      {/* Bar Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">CRI Chart</h2>
          <div className="flex items-center gap-4 export-controls">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && criData.length > 0 && (
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
              <p className="text-muted-foreground">Loading CRI data...</p>
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
              <CRIBarChart 
                data={criData} 
                exportMode={false} 
                showValues={showValues}
                width={previewMode ? exportWidth : undefined}
                height={previewMode ? exportHeight : undefined}
                colors={criData.map(d => spdColors[d.id] || '#808080')}
              />
            </div>
          </>
        )}
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">CRI Values</h2>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && criData.length > 0 && (
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
            <CRITable data={criData} />
          </div>
        )}
      </Card>
    </div>
  )
}
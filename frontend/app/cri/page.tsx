"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { CRIBarChart } from "@/components/cri/cri-bar-chart"
import { CRITable } from "@/components/cri/cri-table"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import html2canvas from "html2canvas"

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
  const chartRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

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
  }, [currentSPDs, getItem])

  const exportChart = async () => {
    if (!chartRef.current || criData.length === 0) {
      toast.error("Chart is not ready for export")
      return
    }
    
    try {
      // Wait for chart animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const element = chartRef.current
      
      // Force a specific background color for export
      const isDarkMode = document.documentElement.classList.contains('dark')
      const bgColor = isDarkMode ? '#0a0a0a' : '#ffffff'
      
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement
      clonedElement.style.backgroundColor = bgColor
      clonedElement.style.padding = '20px'
      
      // Temporarily append to body (hidden)
      clonedElement.style.position = 'absolute'
      clonedElement.style.left = '-9999px'
      document.body.appendChild(clonedElement)
      
      try {
        const canvas = await html2canvas(clonedElement, {
          backgroundColor: bgColor,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            // Ensure SVG elements are properly rendered
            const svgElements = clonedDoc.querySelectorAll('svg')
            svgElements.forEach(svg => {
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
            })
          }
        })
        
        // Remove cloned element
        document.body.removeChild(clonedElement)
        
        // Create download link
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `cri-chart-${new Date().toISOString().split('T')[0]}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Chart exported successfully')
      } catch (innerError) {
        // Clean up cloned element if error occurs
        if (document.body.contains(clonedElement)) {
          document.body.removeChild(clonedElement)
        }
        throw innerError
      }
    } catch (error) {
      console.error('PNG export failed:', error)
      
      // Show user-friendly error message
      toast.error('Unable to export chart as image. This may be due to browser security settings. Please try using your browser\'s screenshot feature or export as CSV.')
      
      // Offer CSV as alternative
      const confirmCSV = window.confirm('Would you like to export the data as CSV instead?')
      if (confirmCSV) {
        exportChartAsCSV()
      }
    }
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
      
      // Get computed styles for theme
      const computedStyle = window.getComputedStyle(element)
      const bgColor = computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : computedStyle.backgroundColor
      
      const canvas = await html2canvas(element, {
        backgroundColor: bgColor,
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
      
      // Create download link
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `cri-table-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!isLoading && criData.length > 0 && (
              <Button onClick={exportChart} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
          <div ref={chartRef} className="bg-card p-4">
            <CRIBarChart data={criData} />
          </div>
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
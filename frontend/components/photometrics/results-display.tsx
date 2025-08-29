"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"
import Image from "next/image"

import { useEffect, useState } from "react"

interface MetricsData {
  id: string
  name: string
  metrics: {
    name: string
    cct?: number | string
    duv?: number
    cri?: number
    r9?: number
    rf?: number
    rg?: number
    melanopicRatio?: number
    melanopicResponse?: number
    scotopicPhotopicRatio?: number
    melanopicPhotopicRatio?: number
    bluePercentage?: number
    peakWavelength?: number
    dominantWavelength?: number
  }
}

export function ResultsDisplay({ isLoading = false }: { isLoading?: boolean }) {
  const { results, currentSPDs } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const [metricsData, setMetricsData] = useState<MetricsData[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)
  
  // Fetch metrics when SPDs change
  useEffect(() => {
    const fetchMetrics = async () => {
      if (currentSPDs.length === 0) {
        setMetricsData([])
        return
      }
      
      setMetricsLoading(true)
      try {
        // Get SPD data from library
        const spds = currentSPDs
          .map(id => getItem(id))
          .filter(Boolean)
          .map(item => ({
            id: item!.id,
            name: item!.title,
            data: item!.data
          }))
        
        if (spds.length === 0) {
          setMetricsData([])
          return
        }
        
        // Fetch metrics from TypeScript backend
        console.log('Sending SPDs to metrics API:', spds)
        const response = await api.calculateMetrics(spds)
        console.log('Metrics API response:', response)
        
        if (response.success && response.results) {
          console.log('Setting metrics data:', response.results)
          setMetricsData(response.results)
        } else {
          console.error('Failed to fetch metrics:', response.error)
          setMetricsData([])
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
        setMetricsData([])
      } finally {
        setMetricsLoading(false)
      }
    }
    
    fetchMetrics()
  }, [currentSPDs, getItem])
  
  const handleExportChart = async () => {
    if (!results?.chart) {
      toast.error("No chart available to export")
      return
    }
    
    try {
      // Convert base64 to blob
      const base64Data = results.chart.replace(/^data:image\/\w+;base64,/, '')
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `spd_chart_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Chart exported successfully")
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Failed to export chart")
    }
  }

  const handleExportData = () => {
    if (metricsData.length === 0) {
      toast.error("No metrics available to export")
      return
    }
    
    try {
      // Convert metrics to CSV format
      const headers = ['Metric', ...metricsData.map(spd => spd.name)]
      const rows = [
        ['CCT', ...metricsData.map(spd => spd.metrics.cct || 'N/A')],
        ['Duv', ...metricsData.map(spd => spd.metrics.duv !== undefined ? spd.metrics.duv.toFixed(4) : 'N/A')],
        ['CRI Ra', ...metricsData.map(spd => spd.metrics.cri !== undefined ? Math.round(spd.metrics.cri).toString() : 'N/A')],
        ['R9', ...metricsData.map(spd => spd.metrics.r9 !== undefined ? Math.round(spd.metrics.r9).toString() : 'N/A')],
        ['Rf (Fidelity)', ...metricsData.map(spd => spd.metrics.rf !== undefined ? Math.round(spd.metrics.rf).toString() : 'N/A')],
        ['Rg (Gamut)', ...metricsData.map(spd => spd.metrics.rg !== undefined ? Math.round(spd.metrics.rg).toString() : 'N/A')],
        ['Melanopic Ratio', ...metricsData.map(spd => spd.metrics.melanopicRatio !== undefined ? spd.metrics.melanopicRatio.toFixed(3) : 'N/A')],
        ['S/P Ratio', ...metricsData.map(spd => spd.metrics.scotopicPhotopicRatio !== undefined ? spd.metrics.scotopicPhotopicRatio.toFixed(3) : 'N/A')],
        ['M/P Ratio', ...metricsData.map(spd => spd.metrics.melanopicPhotopicRatio !== undefined ? spd.metrics.melanopicPhotopicRatio.toFixed(3) : 'N/A')],
        ['Blue %', ...metricsData.map(spd => spd.metrics.bluePercentage !== undefined ? `${spd.metrics.bluePercentage.toFixed(1)}%` : 'N/A')],
        ['Peak Wavelength', ...metricsData.map(spd => spd.metrics.peakWavelength !== undefined ? `${Math.round(spd.metrics.peakWavelength)}nm` : 'N/A')],
        ['Dominant Wavelength', ...metricsData.map(spd => spd.metrics.dominantWavelength !== undefined ? `${Math.round(spd.metrics.dominantWavelength)}nm` : 'N/A')]
      ]
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `spd_metrics_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Metrics exported successfully")
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Failed to export metrics")
    }
  }

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <Card className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Spectral Power Distribution</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportChart}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Generating chart...</p>
              </div>
            </div>
          ) : results?.chart ? (
            <div className="relative h-96">
              <Image 
                src={`data:image/png;base64,${results.chart}`} 
                alt="Spectral Power Distribution Chart"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-lg mb-2">
                  {currentSPDs.length > 0 ? "Loading chart..." : "Select SPDs from the library to analyze"}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Table */}
      <Card className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Data</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading metrics...</p>
              </div>
            </div>
          ) : metricsData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Metric</TableHead>
                  {metricsData.map((spd) => (
                    <TableHead key={spd.id}>{spd.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">CCT</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.cct || '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Duv</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.duv !== undefined ? spd.metrics.duv.toFixed(4) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CRI Ra</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.cri !== undefined ? Math.round(spd.metrics.cri) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">R9</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.r9 !== undefined ? Math.round(spd.metrics.r9) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Rf (Fidelity)</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.rf !== undefined ? Math.round(spd.metrics.rf) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Rg (Gamut)</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.rg !== undefined ? Math.round(spd.metrics.rg) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Melanopic Ratio</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.melanopicRatio !== undefined ? spd.metrics.melanopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">S/P Ratio</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.scotopicPhotopicRatio !== undefined ? spd.metrics.scotopicPhotopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">M/P Ratio</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.melanopicPhotopicRatio !== undefined ? spd.metrics.melanopicPhotopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Blue %</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.bluePercentage !== undefined ? `${spd.metrics.bluePercentage.toFixed(1)}%` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Peak Wavelength</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.peakWavelength !== undefined ? `${Math.round(spd.metrics.peakWavelength)}nm` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dominant Wavelength</TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.dominantWavelength !== undefined ? `${Math.round(spd.metrics.dominantWavelength)}nm` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {currentSPDs.length > 0 ? "Loading metrics..." : "Select SPDs from the library to analyze"}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
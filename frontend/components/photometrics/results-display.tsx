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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Download, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"
import Image from "next/image"

import { useEffect, useState } from "react"

// Metric descriptions for tooltips
const METRIC_DESCRIPTIONS = {
  CCT: "Correlated Color Temperature: The color appearance of the light source, measured in Kelvin (K). Lower values (2700-3000K) appear warm/yellow, higher values (5000-6500K) appear cool/blue.",
  Duv: "Delta u,v: Distance from the black body locus in CIE 1960 color space. Positive values indicate a greenish tint, negative values indicate a pinkish/magenta tint.",
  "CRI Ra": "Color Rendering Index (average): Measures how accurately the light source renders colors compared to a reference light. Scale 0-100, with higher values indicating better color rendering.",
  R9: "CRI R9: Specific test for rendering of strong red colors. Important for skin tones and red objects. Often lower than Ra, values above 50 are considered good.",
  "Rf (Fidelity)": "TM-30 Fidelity Index: Modern color rendering metric that uses 99 color samples. Scale 0-100, measures average color fidelity compared to reference.",
  "Rg (Gamut)": "TM-30 Gamut Index: Measures color saturation/vividness. 100 = same as reference, >100 = increased saturation, <100 = decreased saturation.",
  "Melanopic Ratio": "Ratio of melanopic to photopic response. Indicates the light's biological impact on circadian rhythms. Higher values = more biologically active light.",
  "S/P Ratio": "Scotopic/Photopic Ratio: Compares sensitivity under low light (rod vision) vs normal light (cone vision). Higher values appear brighter in peripheral/night vision.",
  "M/P Ratio": "Melanopic/Photopic Ratio: Similar to Melanopic Ratio, indicates circadian impact relative to visual brightness.",
  "Blue %": "Percentage of visible light in the blue region (380-500nm). Calculated using integration: (∫₃₈₀⁵⁰⁰ SPD(λ)dλ) / (∫₃₈₀⁷⁸⁰ SPD(λ)dλ) × 100%. Uses trapezoidal integration for accurate area calculation across the spectral power distribution.",
  "Peak Wavelength": "The wavelength with the highest intensity in the spectrum. Indicates the dominant color component of the light.",
  "Dominant Wavelength": "The monochromatic wavelength that appears the same color as the light source when mixed with white. Represents perceived color."
}

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
  const { results, currentSPDs, aliases } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  const [metricsData, setMetricsData] = useState<MetricsData[]>([])
  
  // Fetch metrics when SPDs change
  useEffect(() => {
    const fetchMetrics = async () => {
      if (currentSPDs.length === 0) {
        setMetricsData([])
        return
      }
      
      try {
        // Get SPD data from library
        const spds = currentSPDs
          .map(id => getItem(id))
          .filter(Boolean)
          .map(item => ({
            id: item!.id,
            name: aliases[item!.id] || item!.title,
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
      }
    }
    
    fetchMetrics()
  }, [currentSPDs, getItem, aliases])
  
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
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            CCT
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS.CCT}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.cct || '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Duv
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS.Duv}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.duv !== undefined ? spd.metrics.duv.toFixed(4) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            CRI Ra
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["CRI Ra"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.cri !== undefined ? Math.round(spd.metrics.cri) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            R9
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS.R9}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.r9 !== undefined ? Math.round(spd.metrics.r9) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Rf (Fidelity)
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Rf (Fidelity)"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.rf !== undefined ? Math.round(spd.metrics.rf) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Rg (Gamut)
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Rg (Gamut)"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.rg !== undefined ? Math.round(spd.metrics.rg) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Melanopic Ratio
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Melanopic Ratio"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.melanopicRatio !== undefined ? spd.metrics.melanopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            S/P Ratio
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["S/P Ratio"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.scotopicPhotopicRatio !== undefined ? spd.metrics.scotopicPhotopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            M/P Ratio
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["M/P Ratio"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.melanopicPhotopicRatio !== undefined ? spd.metrics.melanopicPhotopicRatio.toFixed(3) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Blue %
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Blue %"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.bluePercentage !== undefined ? `${spd.metrics.bluePercentage.toFixed(1)}%` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Peak Wavelength
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Peak Wavelength"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {metricsData.map((spd) => (
                    <TableCell key={spd.id}>
                      {spd.metrics.peakWavelength !== undefined ? `${Math.round(spd.metrics.peakWavelength)}nm` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            Dominant Wavelength
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{METRIC_DESCRIPTIONS["Dominant Wavelength"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
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

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { AnalysisOptions } from "@/components/photometrics/analysis-options"
import { ResultsDisplay } from "@/components/photometrics/results-display"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"
import { toast } from "sonner"

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

export default function PhotometricsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { currentSPDs, analysisOptions, setResults } = useAnalysisStore()
  const { getItem } = useLibraryStore()
  
  // Debounce the analysis options to prevent rapid re-renders
  const debouncedOptions = useDebounce(analysisOptions, 300)

  const analyzeData = useCallback(async () => {
    if (currentSPDs.length === 0) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      // Get SPD data from library
      const spds = currentSPDs.map(id => getItem(id)).filter(Boolean)
      console.log('=== PHOTOMETRICS ANALYSIS ===')
      console.log('Current SPD IDs:', currentSPDs)
      console.log('Retrieved SPDs:', spds.map(s => ({ id: s?.id, title: s?.title })))
      console.log('Full SPD details:', spds)
      if (spds.length === 0) {
        console.log('No SPDs found in library')
        setIsLoading(false)
        return
      }

      // Map our options to API format - use debouncedOptions
      const apiOptions = {
        normalize: debouncedOptions.normalize,
        melanopic_curve: debouncedOptions.showMelanopic,
        melanopic_stimulus: false,
        hideyaxis: debouncedOptions.hideYAxis,
        show_legend: debouncedOptions.showLegend,
        show_spectral_ranges: debouncedOptions.showSpectralRanges,
        x_min: debouncedOptions.minWavelength,
        x_max: debouncedOptions.maxWavelength,
        title: debouncedOptions.showTitle ? debouncedOptions.chartTitle : undefined,
        chart_width: debouncedOptions.chartWidth,
        chart_height: debouncedOptions.chartHeight,
        show_spd_line: debouncedOptions.showSpdLine,
        spd_line_color: debouncedOptions.spdLineColor,
        spd_line_weight: debouncedOptions.spdLineWeight
      }
      
      // Call API to analyze
      const result = await api.analyze({
        spds: spds.map(s => ({ id: s!.id, title: s!.title, data: s!.data })),
        options: apiOptions
      })
      
      console.log('API result:', result)
      console.log('Plot image available:', !!result.plot_image)
      console.log('Plot image length:', result.plot_image ? result.plot_image.length : 0)

      // Convert API result to our store format
      const analysisResults = {
        chart: result.plot_image, // Base64 encoded image
        metrics: {
          cct: result.metrics.cct,
          cri: result.metrics.cri,
          rf: result.metrics.rf,
          rg: result.metrics.rg,
          melanopicRatio: result.metrics.melanopic_ratio,
          spRatio: result.metrics.scotopic_photopic_ratio,
          mpRatio: result.metrics.melanopic_photopic_ratio,
          bluePercentage: result.metrics.blue_percentage
        }
      }

      setResults(analysisResults)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze SPD data')
    } finally {
      setIsLoading(false)
    }
  }, [currentSPDs, debouncedOptions, getItem, setResults])

  // Auto-update when SPDs or debounced options change
  useEffect(() => {
    if (currentSPDs.length > 0) {
      analyzeData()
    }
  }, [currentSPDs, debouncedOptions, analyzeData])
  return (
    <div className="flex h-full">
      {/* Left Panel - Options */}
      <div className="w-80 border-r p-6 overflow-y-auto bg-muted/10">
        <AnalysisOptions />
      </div>
      
      {/* Right Panel - Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        <ResultsDisplay isLoading={isLoading} />
      </div>
    </div>
  )
}
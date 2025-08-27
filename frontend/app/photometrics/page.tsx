"use client"

import { useState, useCallback, useEffect } from "react"
import { AnalysisOptions } from "@/components/photometrics/analysis-options"
import { ResultsDisplay } from "@/components/photometrics/results-display"
import { useAnalysisStore, useLibraryStore } from "@/lib/store"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function PhotometricsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { currentSPDs, analysisOptions, setResults } = useAnalysisStore()
  const { getItem } = useLibraryStore()

  const analyzeData = useCallback(async () => {
    if (currentSPDs.length === 0) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      // Get SPD data from library
      const spds = currentSPDs.map(id => getItem(id)).filter(Boolean)
      console.log('Current SPD IDs:', currentSPDs)
      console.log('Retrieved SPDs:', spds)
      if (spds.length === 0) {
        console.log('No SPDs found in library')
        setIsLoading(false)
        return
      }

      // Map our options to API format
      const apiOptions = {
        normalize: analysisOptions.normalize,
        melanopic_curve: analysisOptions.showMelanopic,
        melanopic_stimulus: false,
        hideyaxis: analysisOptions.hideYAxis,
        x_min: analysisOptions.minWavelength,
        x_max: analysisOptions.maxWavelength,
        title: analysisOptions.showTitle ? analysisOptions.chartTitle : undefined,
        chart_width: analysisOptions.chartWidth,
        chart_height: analysisOptions.chartHeight
      }
      
      // Call API to analyze
      const result = await api.analyze({
        spds: spds.map(s => ({ id: s!.id, title: s!.title, data: s!.data })),
        options: apiOptions
      })

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
  }, [currentSPDs, analysisOptions, getItem, setResults])

  // Auto-update when SPDs change
  useEffect(() => {
    analyzeData()
  }, [currentSPDs, analyzeData])

  const handleOptionsChange = useCallback(() => {
    analyzeData()
  }, [analyzeData])
  return (
    <div className="flex h-full">
      {/* Left Panel - Options */}
      <div className="w-80 border-r p-6 overflow-y-auto bg-muted/10">
        <AnalysisOptions onOptionsChange={handleOptionsChange} />
      </div>
      
      {/* Right Panel - Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        <ResultsDisplay isLoading={isLoading} />
      </div>
    </div>
  )
}
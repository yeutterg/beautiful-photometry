"use client"

import { useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAnalysisStore } from "@/lib/store"

export function AnalysisOptions({ onOptionsChange }: { onOptionsChange?: () => void }) {
  const { analysisOptions, updateOptions } = useAnalysisStore()
  
  const handleChange = (updates: Partial<typeof analysisOptions>) => {
    updateOptions(updates)
    onOptionsChange?.()
  }

  useEffect(() => {
    // Trigger initial update when component mounts
    onOptionsChange?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Chart Configuration */}
      <div>
        <h3 className="font-medium mb-3 text-base text-primary">Chart Configuration</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-title" 
              checked={analysisOptions.showTitle}
              onCheckedChange={(checked) => handleChange({ showTitle: checked as boolean })}
            />
            <Label htmlFor="show-title" className="font-normal">Chart Title:</Label>
            <Input 
              placeholder="Enter title" 
              className="flex-1"
              value={analysisOptions.chartTitle}
              onChange={(e) => handleChange({ chartTitle: e.target.value })}
              disabled={!analysisOptions.showTitle}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-legend"
              checked={analysisOptions.showLegend}
              onCheckedChange={(checked) => handleChange({ showLegend: checked as boolean })}
            />
            <Label htmlFor="show-legend">Show Legend</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hide-y-axis"
              checked={analysisOptions.hideYAxis}
              onCheckedChange={(checked) => handleChange({ hideYAxis: checked as boolean })}
            />
            <Label htmlFor="hide-y-axis">Hide Y Axis</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Wavelength Settings */}
      <div>
        <h3 className="font-medium mb-3 text-base text-primary">Wavelength Settings</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="min-wavelength">Minimum Wavelength (nm)</Label>
            <Input 
              id="min-wavelength"
              type="number" 
              value={analysisOptions.minWavelength}
              onChange={(e) => handleChange({ minWavelength: parseInt(e.target.value) || 380 })}
            />
          </div>
          <div>
            <Label htmlFor="max-wavelength">Maximum Wavelength (nm)</Label>
            <Input 
              id="max-wavelength"
              type="number" 
              value={analysisOptions.maxWavelength}
              onChange={(e) => handleChange({ maxWavelength: parseInt(e.target.value) || 780 })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* SPD Display Options */}
      <div>
        <h3 className="font-medium mb-3 text-base text-primary">SPD Display Options</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="normalize"
              checked={analysisOptions.normalize}
              onCheckedChange={(checked) => handleChange({ normalize: checked as boolean })}
            />
            <Label htmlFor="normalize">Normalize SPD</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="melanopic"
              checked={analysisOptions.showMelanopic}
              onCheckedChange={(checked) => handleChange({ showMelanopic: checked as boolean })}
            />
            <Label htmlFor="melanopic">Show Melanopic Response</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="spectral-ranges"
              checked={analysisOptions.showSpectralRanges}
              onCheckedChange={(checked) => handleChange({ showSpectralRanges: checked as boolean })}
            />
            <Label htmlFor="spectral-ranges">Show Spectral Ranges</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Chart Display Settings */}
      <div>
        <h3 className="font-medium mb-3 text-base text-primary">Chart Display Settings</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="chart-width">Width (px)</Label>
            <Input 
              id="chart-width"
              type="number" 
              value={analysisOptions.chartWidth}
              onChange={(e) => handleChange({ chartWidth: parseInt(e.target.value) || 800 })}
            />
          </div>
          <div>
            <Label htmlFor="chart-height">Height (px)</Label>
            <Input 
              id="chart-height"
              type="number" 
              value={analysisOptions.chartHeight}
              onChange={(e) => handleChange({ chartHeight: parseInt(e.target.value) || 400 })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAnalysisStore } from "@/lib/store"

export function AnalysisOptions() {
  const { analysisOptions, updateOptions } = useAnalysisStore()
  
  // Local state for numeric inputs to prevent updates on every keystroke
  const [localValues, setLocalValues] = useState({
    minWavelength: analysisOptions.minWavelength,
    maxWavelength: analysisOptions.maxWavelength,
    chartWidth: analysisOptions.chartWidth,
    chartHeight: analysisOptions.chartHeight
  })
  
  const handleNumericChange = (field: keyof typeof localValues, value: number) => {
    setLocalValues(prev => ({ ...prev, [field]: value }))
  }
  
  const handleNumericBlur = (field: keyof typeof localValues) => {
    updateOptions({ [field]: localValues[field] })
  }

  // Remove automatic trigger on mount to prevent double rendering
  
  // Sync local values with store when store changes externally
  useEffect(() => {
    setLocalValues({
      minWavelength: analysisOptions.minWavelength,
      maxWavelength: analysisOptions.maxWavelength,
      chartWidth: analysisOptions.chartWidth,
      chartHeight: analysisOptions.chartHeight
    })
  }, [analysisOptions.minWavelength, analysisOptions.maxWavelength, 
      analysisOptions.chartWidth, analysisOptions.chartHeight])

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
              onCheckedChange={(checked) => updateOptions({ showTitle: checked as boolean })}
            />
            <Label htmlFor="show-title" className="font-normal">Chart Title:</Label>
            <Input 
              placeholder="Enter title" 
              className="flex-1"
              value={analysisOptions.chartTitle}
              onChange={(e) => updateOptions({ chartTitle: e.target.value })}
              disabled={!analysisOptions.showTitle}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-legend"
              checked={analysisOptions.showLegend}
              onCheckedChange={(checked) => updateOptions({ showLegend: checked as boolean })}
            />
            <Label htmlFor="show-legend">Show Legend</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hide-y-axis"
              checked={analysisOptions.hideYAxis}
              onCheckedChange={(checked) => updateOptions({ hideYAxis: checked as boolean })}
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
              value={localValues.minWavelength}
              onChange={(e) => handleNumericChange('minWavelength', parseInt(e.target.value) || 380)}
              onBlur={() => handleNumericBlur('minWavelength')}
            />
          </div>
          <div>
            <Label htmlFor="max-wavelength">Maximum Wavelength (nm)</Label>
            <Input 
              id="max-wavelength"
              type="number" 
              value={localValues.maxWavelength}
              onChange={(e) => handleNumericChange('maxWavelength', parseInt(e.target.value) || 780)}
              onBlur={() => handleNumericBlur('maxWavelength')}
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
              onCheckedChange={(checked) => updateOptions({ normalize: checked as boolean })}
            />
            <Label htmlFor="normalize">Normalize SPD</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="melanopic"
              checked={analysisOptions.showMelanopic}
              onCheckedChange={(checked) => updateOptions({ showMelanopic: checked as boolean })}
            />
            <Label htmlFor="melanopic">Show Melanopic Response</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="spectral-ranges"
              checked={analysisOptions.showSpectralRanges}
              onCheckedChange={(checked) => updateOptions({ showSpectralRanges: checked as boolean })}
            />
            <Label htmlFor="spectral-ranges">Show Spectral Ranges</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* SPD Line Settings */}
      <div>
        <h3 className="font-medium mb-3 text-base text-primary">SPD Line Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-spd-line"
              checked={analysisOptions.showSpdLine}
              onCheckedChange={(checked) => updateOptions({ showSpdLine: checked as boolean })}
            />
            <Label htmlFor="show-spd-line">Show SPD Line</Label>
          </div>
          <div>
            <Label htmlFor="spd-line-color">Line Color</Label>
            <div className="flex gap-2 items-center">
              <Input 
                id="spd-line-color"
                type="color"
                value={analysisOptions.spdLineColor}
                onChange={(e) => updateOptions({ spdLineColor: e.target.value })}
                className="w-20 h-10 p-1 cursor-pointer"
                disabled={!analysisOptions.showSpdLine}
              />
              <Input
                type="text"
                value={analysisOptions.spdLineColor}
                onChange={(e) => updateOptions({ spdLineColor: e.target.value })}
                className="flex-1"
                disabled={!analysisOptions.showSpdLine}
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="spd-line-weight">Line Weight (px)</Label>
            <Input 
              id="spd-line-weight"
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={analysisOptions.spdLineWeight}
              onChange={(e) => updateOptions({ spdLineWeight: parseFloat(e.target.value) || 2 })}
              disabled={!analysisOptions.showSpdLine}
            />
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
              value={localValues.chartWidth}
              onChange={(e) => handleNumericChange('chartWidth', parseInt(e.target.value) || 800)}
              onBlur={() => handleNumericBlur('chartWidth')}
            />
          </div>
          <div>
            <Label htmlFor="chart-height">Height (px)</Label>
            <Input 
              id="chart-height"
              type="number" 
              value={localValues.chartHeight}
              onChange={(e) => handleNumericChange('chartHeight', parseInt(e.target.value) || 400)}
              onBlur={() => handleNumericBlur('chartHeight')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CRI_COLORS, CRI_CALCULATION_INFO } from "@/lib/cri-constants"
import { Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

interface CRIBarChartProps {
  data: CRIData[]
  title?: string
  exportMode?: boolean
  showValues?: boolean
  width?: number
  height?: number
  colors?: string[]
}

export function CRIBarChart({ 
  data, 
  title = "Color Rendering Index",
  exportMode = false,
  showValues: showValuesProp = true,
  width,
  height = 400,
  colors
}: CRIBarChartProps) {
  const showValues = showValuesProp
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [chartTitle, setChartTitle] = useState(title)
  const [tempTitle, setTempTitle] = useState(title)

  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  // Transform data for grouped bar chart
  const chartData = ['ra', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'].map(key => {
    const dataPoint: Record<string, string | number> = { 
      name: key === 'ra' ? 'Ra' : key.toUpperCase().replace('R', 'R'),
      criKey: key
    }
    data.forEach((dataset, index) => {
      const value = dataset.values[key as keyof typeof dataset.values]
      // Keep the value as is if it's a valid number (including 0), otherwise default to 0
      dataPoint[`dataset${index}`] = value !== undefined && value !== null ? Math.round(value) : 0
    })
    return dataPoint
  })

  // Custom tooltip with proper background and detailed calculation info
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color?: string; payload?: { criKey: string } }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      // Get the corresponding CRI key from the chart data
      const criKey = payload[0]?.payload?.criKey || label?.toLowerCase()
      const calculationInfo = CRI_CALCULATION_INFO[criKey as keyof typeof CRI_CALCULATION_INFO]

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded border border-border"
                style={{ backgroundColor: CRI_COLORS[criKey as keyof typeof CRI_COLORS] }}
              />
              <p className="font-semibold">{label}</p>
            </div>

            {calculationInfo && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{calculationInfo.description}</p>
                <p className="text-xs text-muted-foreground">{calculationInfo.formula}</p>
              </div>
            )}

            <div className="border-t pt-2">
              {payload.map((entry, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{entry.name}:</span>
                  <span className="font-mono font-medium text-sm">{entry.value}</span>
                </div>
              ))}
            </div>

            {calculationInfo && (
              <div className="text-xs text-muted-foreground pt-1 border-t">
                {calculationInfo.calculation}
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const handleSaveTitle = () => {
    setChartTitle(tempTitle)
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setTempTitle(chartTitle)
    setIsEditingTitle(false)
  }

  // Custom legend with color indicators
  const CustomLegend = (props: { payload?: Array<{ value: string }> }) => {
    const { payload } = props
    if (!payload || data.length <= 1) return null
    
    return (
      <div className="flex justify-center mt-4 gap-4">
        {payload.map((entry, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: colors?.[index] || '#808080' }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      className="space-y-4 export-chart-container" 
      style={exportMode ? { 
        backgroundColor: '#ffffff', 
        color: '#000000',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto'
      } : undefined}>
      {/* Editable Title */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {isEditingTitle && !exportMode ? (
          <div className="flex items-center gap-2">
            <Input 
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="text-lg font-semibold text-center w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveTitle}>Save</Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold" style={exportMode ? { color: '#000000' } : undefined}>
              {chartTitle}
            </h3>
            {!exportMode && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 edit-button"
                onClick={() => setIsEditingTitle(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width={width || "100%"} height={height}>
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 12, fill: exportMode ? "#000000" : "currentColor" }}
            stroke={exportMode ? "#000000" : "currentColor"}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: exportMode ? "#000000" : "currentColor" }}
            stroke={exportMode ? "#000000" : "currentColor"}
          />
          <Tooltip content={<CustomTooltip />} />
          {data.length > 1 && <Legend content={<CustomLegend />} />}
          
          {/* Render bars for each dataset */}
          {data.map((dataset, datasetIndex) => (
            <Bar
              key={dataset.id}
              dataKey={`dataset${datasetIndex}`}
              name={dataset.name}
              label={showValues ? { position: "top", fontSize: 10, fill: exportMode ? "#000000" : "currentColor" } : undefined}
            >
              {/* Apply CRI colors to each bar segment */}
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={CRI_COLORS[entry.criKey as keyof typeof CRI_COLORS]}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
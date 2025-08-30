"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CRI_COLORS } from "@/lib/cri-constants"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
}

export function CRIBarChart({ data }: CRIBarChartProps) {
  const [showValues, setShowValues] = useState(true)

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
      dataPoint[`dataset${index}`] = value ? Math.round(value) : 0
    })
    return dataPoint
  })

  // Custom tooltip with proper background
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color?: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{entry.name}:</span>
              <span className="font-mono font-medium text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="show-values" 
          checked={showValues}
          onCheckedChange={(checked) => setShowValues(checked as boolean)}
        />
        <Label htmlFor="show-values" className="text-sm font-normal cursor-pointer">
          Show values on chart
        </Label>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "currentColor" }}
            stroke="currentColor"
          />
          <Tooltip content={<CustomTooltip />} />
          {data.length > 1 && <Legend />}
          
          {/* Render bars for each dataset */}
          {data.map((dataset, datasetIndex) => (
            <Bar
              key={dataset.id}
              dataKey={`dataset${datasetIndex}`}
              name={dataset.name}
              label={showValues ? { position: "top", fontSize: 10 } : undefined}
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
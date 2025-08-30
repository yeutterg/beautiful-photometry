"use client"

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CRI_COLORS } from "@/lib/cri-constants"

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

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          domain={[0, 100]}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
          formatter={(value: number | string, name: string) => {
            const datasetIndex = parseInt(name.replace('dataset', ''))
            const datasetName = data[datasetIndex]?.name || name
            return [value, datasetName]
          }}
        />
        {data.length > 1 && <Legend />}
        
        {data.map((dataset, index) => (
          <Bar
            key={dataset.id}
            dataKey={`dataset${index}`}
            name={dataset.name}
          >
            {chartData.map((entry, idx) => (
              <Cell 
                key={`cell-${idx}`} 
                fill={CRI_COLORS[entry.criKey as keyof typeof CRI_COLORS]} 
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
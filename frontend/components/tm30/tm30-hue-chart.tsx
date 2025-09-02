"use client"

import { Card } from "@/components/ui/card"
import { MetricBarChart } from "@/components/shared/metric-bar-chart"

interface TM30HueData {
  id: string
  name: string
  values: Record<string, number | undefined> // h01 to h16 values
}

interface TM30HueChartProps {
  data: TM30HueData[]
  showValues: boolean
  colors: string[]
  exportMode?: boolean
  width?: number
  height?: number
}

// Hue angle bin colors based on TM-30 standard
const HUE_BIN_COLORS: Record<string, string> = {
  h01: '#E4002B', // Red
  h02: '#FF6900', // Red-Orange  
  h03: '#FF8200', // Orange
  h04: '#FFB500', // Orange-Yellow
  h05: '#FFD100', // Yellow
  h06: '#C4D600', // Yellow-Green
  h07: '#84BD00', // Green
  h08: '#00B140', // Green
  h09: '#00A3AD', // Green-Cyan
  h10: '#0099C8', // Cyan
  h11: '#0075BE', // Cyan-Blue
  h12: '#003DA5', // Blue
  h13: '#312783', // Blue-Violet
  h14: '#6E2585', // Violet
  h15: '#951B81', // Violet-Red
  h16: '#CC0066', // Red-Violet
}

const HUE_BIN_LABELS: Record<string, string> = {
  h01: '1',
  h02: '2', 
  h03: '3',
  h04: '4',
  h05: '5',
  h06: '6',
  h07: '7',
  h08: '8',
  h09: '9',
  h10: '10',
  h11: '11',
  h12: '12',
  h13: '13',
  h14: '14',
  h15: '15',
  h16: '16',
}

export function TM30HueChart({ 
  data, 
  showValues, 
  colors,
  exportMode = false,
  width = 800,
  height = 400 
}: TM30HueChartProps) {
  if (data.length === 0) return null

  const hueKeys = Array.from({ length: 16 }, (_, i) => 
    `h${(i + 1).toString().padStart(2, '0')}`
  )

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Rf,h - Fidelity by Hue Angle</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Color fidelity index for 16 hue angle bins
          </p>
        </div>
      </div>
      
      <MetricBarChart
        data={data}
        title="TM-30-18 Fidelity"
        exportMode={exportMode}
        showValues={showValues}
        width={width}
        height={height}
        colors={colors}
        barColors={HUE_BIN_COLORS}
        yDomain={[0, 100]}
        metricKeys={hueKeys}
        formatXLabel={(key) => HUE_BIN_LABELS[key] || key}
      />

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Hue Bins:</span>
            <div className="mt-1 space-y-1">
              <div>1-4: Red to Yellow</div>
              <div>5-8: Yellow to Green</div>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">&nbsp;</span>
            <div className="mt-1 space-y-1">
              <div>9-12: Cyan to Blue</div>
              <div>13-16: Violet to Red</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
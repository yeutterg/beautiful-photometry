"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TM30MetricsProps {
  data: Array<{
    id: string
    name: string
    rf?: number
    rg?: number
    color?: string
  }>
}

export function TM30Metrics({ data }: TM30MetricsProps) {
  if (data.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Rf (Fidelity Index) Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rf - Fidelity Index</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Color fidelity represents the average similarity of test colors under the test source compared to the reference illuminant
        </p>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color || '#808080' }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-lg font-semibold">
                  {item.rf !== undefined ? Math.round(item.rf) : '-'}
                </span>
              </div>
              <Progress 
                value={item.rf || 0} 
                className="h-2"
                style={{
                  '--progress-background': item.color || '#808080'
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scale:</span>
            <span>0 (Poor) - 100 (Excellent)</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Reference:</span>
            <span>≥80 is considered good</span>
          </div>
        </div>
      </Card>

      {/* Rg (Gamut Index) Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rg - Gamut Index</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Color gamut represents the average saturation shift of test colors, where 100 = no change, &gt;100 = increased saturation, &lt;100 = decreased saturation
        </p>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color || '#808080' }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-lg font-semibold">
                  {item.rg !== undefined ? Math.round(item.rg) : '-'}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute h-full transition-all duration-300"
                  style={{
                    backgroundColor: item.color || '#808080',
                    left: item.rg !== undefined && item.rg < 100 ? `${item.rg}%` : '50%',
                    right: item.rg !== undefined && item.rg > 100 ? `${150 - item.rg}%` : '50%',
                    width: item.rg !== undefined ? 
                      (item.rg === 100 ? '2px' : 
                       item.rg < 100 ? `${100 - item.rg}%` : 
                       `${item.rg - 100}%`) : '2px'
                  }}
                />
                {/* Reference line at 100 */}
                <div className="absolute w-0.5 h-4 bg-border -top-1 left-1/2 -translate-x-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scale:</span>
            <span>60 - 140 (100 = no change)</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Reference:</span>
            <span>80-120 is typical range</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
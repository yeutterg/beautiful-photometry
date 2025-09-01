"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MetricData {
  id: string
  name: string
  values: Record<string, number | undefined>
}

interface MetricTableProps {
  data: MetricData[]
  metricKeys: string[] // Keys to display in order
  formatMetricLabel?: (key: string) => string // Format function for metric labels
  formatValue?: (value: number, key: string) => string // Format function for values
  metricColors?: Record<string, string> // Optional colors for each metric
}

export function MetricTable({
  data,
  metricKeys,
  formatMetricLabel = (key) => key.toUpperCase(),
  formatValue = (value) => Math.round(value).toString(),
  metricColors
}: MetricTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Metric</TableHead>
          {data.map((dataset) => (
            <TableHead key={dataset.id}>{dataset.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {metricKeys.map((key) => (
          <TableRow key={key}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {metricColors && metricColors[key] && (
                  <div 
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: metricColors[key] }}
                  />
                )}
                {formatMetricLabel(key)}
              </div>
            </TableCell>
            {data.map((dataset) => (
              <TableCell key={`${dataset.id}-${key}`}>
                {dataset.values[key] !== undefined 
                  ? formatValue(dataset.values[key]!, key)
                  : '-'}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
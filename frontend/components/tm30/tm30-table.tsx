"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TM30_DESCRIPTIONS, TM30_COLORS } from "@/lib/tm30-constants"

interface TM30Data {
  id: string
  name: string
  values: Record<string, number | undefined>
}

interface TM30TableProps {
  data: TM30Data[]
}

export function TM30Table({ data }: TM30TableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    )
  }

  // Generate all TCS keys from TCS01 to TCS99
  const tcsKeys = Array.from({ length: 99 }, (_, i) => 
    `TCS${(i + 1).toString().padStart(2, '0')}`
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">TCS Sample</TableHead>
            <TableHead className="font-semibold min-w-[200px]">Description</TableHead>
            {data.map(dataset => (
              <TableHead key={dataset.id} className="font-semibold text-right">
                {dataset.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tcsKeys.map(tcsKey => (
            <TableRow key={tcsKey}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: TM30_COLORS[tcsKey] }}
                  />
                  {tcsKey}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {TM30_DESCRIPTIONS[tcsKey]}
              </TableCell>
              {data.map(dataset => {
                const value = dataset.values[tcsKey]
                return (
                  <TableCell key={`${dataset.id}-${tcsKey}`} className="text-right font-mono">
                    {value !== undefined ? value.toFixed(1) : '-'}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CRI_DESCRIPTIONS } from "@/lib/cri-constants"

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

interface CRITableProps {
  data: CRIData[]
}

export function CRITable({ data }: CRITableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    )
  }

  const rValues = ['ra', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'] as const

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">R Value</TableHead>
            <TableHead className="font-semibold min-w-[200px]">Description</TableHead>
            {data.map(dataset => (
              <TableHead key={dataset.id} className="font-semibold text-right">
                {dataset.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rValues.map(rValue => (
            <TableRow key={rValue}>
              <TableCell className="font-medium">
                {rValue === 'ra' ? 'Ra' : rValue.toUpperCase().replace('R', 'R')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {CRI_DESCRIPTIONS[rValue]}
              </TableCell>
              {data.map(dataset => {
                const value = dataset.values[rValue]
                return (
                  <TableCell key={`${dataset.id}-${rValue}`} className="text-right font-mono">
                    {value !== undefined ? Math.round(value) : '-'}
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
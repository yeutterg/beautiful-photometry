"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAnalysisStore } from "@/lib/store"
import Image from "next/image"

export function ResultsDisplay({ isLoading = false }: { isLoading?: boolean }) {
  const { results, currentSPDs } = useAnalysisStore()
  
  const handleExportChart = () => {
    // TODO: Implement chart export
    toast.info("Chart export will be implemented")
  }

  const handleExportData = () => {
    // TODO: Implement data export
    toast.info("Data export will be implemented")
  }

  // Mock metrics data
  const metrics = [
    { name: "CCT", label: "Correlated Color Temperature", value: "3000K" },
    { name: "CRI Ra", label: "Color Rendering Index", value: "95" },
    { name: "R9", label: "Red color rendering", value: "92" },
    { name: "Rf", label: "Fidelity Index", value: "93" },
    { name: "Rg", label: "Gamut Index", value: "105" },
    { name: "Peak", label: "Peak Wavelength", value: "450nm" },
    { name: "M/P", label: "M/P Ratio (Melanopic/Photopic)", value: "0.65" },
    { name: "S/P", label: "S/P Ratio (Scotopic/Photopic)", value: "0.72" },
    { name: "Mel", label: "Melanopic Ratio", value: "0.45" },
    { name: "Blue %", label: "% Blue Light", value: "18%" },
  ]

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <Card className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Spectral Power Distribution</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportChart}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Generating chart...</p>
              </div>
            </div>
          ) : results?.chart ? (
            <div className="relative h-96">
              <Image 
                src={`data:image/png;base64,${results.chart}`} 
                alt="Spectral Power Distribution Chart"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-lg mb-2">
                  {currentSPDs.length > 0 ? "Loading chart..." : "Select SPDs from the library to analyze"}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Table */}
      <Card className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Data</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading metrics...</p>
              </div>
            </div>
          ) : results?.metrics ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(results.metrics).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Metric</TableHead>
                  <TableHead>SPD 1</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell className="font-medium">{metric.label}</TableCell>
                    <TableCell>{metric.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
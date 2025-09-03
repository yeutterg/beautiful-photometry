"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLibraryStore, useAnalysisStore } from "@/lib/store"
import { runCRIValidation } from "@/lib/cri-test"
import { Loader2 } from "lucide-react"

export default function TestCRIPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    isValid: boolean
    maxDifference: number
    details: {
      calculated: Record<string, number>
      excel: Record<string, number>
      differences: Record<string, number>
    }
    backend?: { cri?: number; r9?: number; r_values?: Record<string, number> }
  } | null>(null)
  const { currentSPDs } = useAnalysisStore()
  const { getItem } = useLibraryStore()

  const runTest = async () => {
    if (currentSPDs.length === 0) {
      alert("Please load an SPD first")
      return
    }

    setIsLoading(true)
    try {
      const spdId = currentSPDs[0]
      const spd = getItem(spdId)
      
      if (!spd) {
        alert("SPD not found")
        return
      }

      // Run validation - convert spd.data format to expected format
      const spdData = {
        wavelength: Object.keys(spd.data).map(Number).sort((a, b) => a - b),
        values: Object.keys(spd.data).map(Number).sort((a, b) => a - b).map(wl => spd.data[wl])
      }
      const validationResult = await runCRIValidation(spdData)
      setResults(validationResult)

      // Also fetch from backend for comparison
      const response = await fetch('http://localhost:8081/api/cri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: spdId,
          name: spd.title,
          data: spd.data
        })
      })

      if (response.ok) {
        const backendResult = await response.json()
        setResults(prev => prev ? {
          ...prev,
          backend: backendResult
        } : null)
      }
    } catch (error) {
      console.error('Test failed:', error)
      alert('Test failed - check console')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">CRI Calculation Test</h1>
        <p className="text-muted-foreground mb-4">
          This page compares our CRI calculations against the Excel workbook values
        </p>
        
        <Button onClick={runTest} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run CRI Validation Test
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Test Results</h3>
              <div className={`p-4 rounded ${results.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`font-medium ${results.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {results.isValid ? '✓ Calculations match Excel (within tolerance)' : '✗ Calculations differ from Excel'}
                </p>
                <p className="text-sm mt-1">Maximum difference: {results.maxDifference?.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Our Calculation</h4>
                <div className="space-y-1 text-sm font-mono">
                  {results.details && Object.entries(results.details.calculated).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span>{(value as number).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Excel Values</h4>
                <div className="space-y-1 text-sm font-mono">
                  {results.details && Object.entries(results.details.excel).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span>{(value as number).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Differences</h4>
                <div className="space-y-1 text-sm font-mono">
                  {results.details && Object.entries(results.details.differences).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className={(value as number) > 1 ? 'text-red-600' : ''}>
                        {(value as number).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {results.backend && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Backend Calculation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">CRI (Ra): {results.backend.cri?.toFixed(1)}</p>
                    <p className="text-sm">R9: {results.backend.r9?.toFixed(1)}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    {results.backend.r_values && Object.entries(results.backend.r_values).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span>{(value as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• CRI calculations use CIE 13.3-1995 method with 14 test color samples</p>
          <p>• Ra is the average of R1-R8 (general color rendering index)</p>
          <p>• R9 represents saturated red, important for many applications</p>
          <p>• R13 approximates Caucasian skin tone</p>
          <p>• R15 (Asian skin tone) is not in the original CIE standard</p>
          <p>• Color differences are calculated in CIE 1964 W*U*V* color space</p>
          <p>• Reference illuminant is Planckian for CCT &lt; 5000K, D-series for CCT ≥ 5000K</p>
        </div>
      </Card>
    </div>
  )
}
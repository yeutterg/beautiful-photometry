"use client"

import { useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"

interface TM30ColorVectorGraphicProps {
  data: {
    rf: number
    rg: number
    rfHue?: Record<string, number | undefined>
    testCoordinates?: { a: number; b: number }[]
    refCoordinates?: { a: number; b: number }[]
  } | null
  width?: number
  height?: number
  showLabels?: boolean
}

// Hue angle bin colors
const HUE_COLORS = [
  '#E4002B', // h01: Red
  '#FF6900', // h02: Red-Orange  
  '#FF8200', // h03: Orange
  '#FFB500', // h04: Orange-Yellow
  '#FFD100', // h05: Yellow
  '#C4D600', // h06: Yellow-Green
  '#84BD00', // h07: Green
  '#00B140', // h08: Green
  '#00A3AD', // h09: Green-Cyan
  '#0099C8', // h10: Cyan
  '#0075BE', // h11: Cyan-Blue
  '#003DA5', // h12: Blue
  '#312783', // h13: Blue-Violet
  '#6E2585', // h14: Violet
  '#951B81', // h15: Violet-Red
  '#CC0066', // h16: Red-Violet
]

export function TM30ColorVectorGraphic({ 
  data, 
  width = 400, 
  height = 400,
  showLabels = true 
}: TM30ColorVectorGraphicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Center and scale
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35
    
    // Background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)

    // Draw grid circles (20, 40, 60, 80, 100, 120, 140)
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    const gridCircles = [20, 40, 60, 80, 100, 120, 140]
    gridCircles.forEach(value => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, (value / 100) * radius, 0, 2 * Math.PI)
      ctx.stroke()
    })

    // Draw reference circle at 100
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw radial lines for 16 hue bins
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5 - 90) * Math.PI / 180 // 22.5 degrees per bin
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(angle) * radius * 1.4,
        centerY + Math.sin(angle) * radius * 1.4
      )
      ctx.stroke()
    }

    // Generate sample coordinates if not provided
    let testPoints: { a: number; b: number }[] = []
    let refPoints: { a: number; b: number }[] = []

    if (data.testCoordinates && data.refCoordinates) {
      testPoints = data.testCoordinates
      refPoints = data.refCoordinates
    } else {
      // Generate points based on Rf,h values if available
      for (let i = 0; i < 16; i++) {
        const angle = (i * 22.5) * Math.PI / 180
        const hueKey = `h${(i + 1).toString().padStart(2, '0')}`
        const rfh = data.rfHue?.[hueKey] ?? data.rf ?? 80
        
        // Reference point at normalized distance 1.0
        refPoints.push({
          a: Math.cos(angle) * 25,
          b: Math.sin(angle) * 25
        })
        
        // Test point scaled by Rf,h and Rg
        const scale = (rfh / 100) * (data.rg / 100)
        testPoints.push({
          a: Math.cos(angle) * 25 * scale,
          b: Math.sin(angle) * 25 * scale
        })
      }
    }

    // Normalize coordinates to canvas space
    const normalizePoint = (point: { a: number; b: number }) => {
      // Assuming a' b' coordinates range from -30 to 30
      const normX = (point.a / 30) * radius
      const normY = (-point.b / 30) * radius // Negative because canvas Y is inverted
      return {
        x: centerX + normX,
        y: centerY + normY
      }
    }

    // Draw reference polygon (light gray)
    if (refPoints.length > 0) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)'
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      
      const firstRef = normalizePoint(refPoints[0])
      ctx.moveTo(firstRef.x, firstRef.y)
      
      for (let i = 1; i < refPoints.length; i++) {
        const point = normalizePoint(refPoints[i])
        ctx.lineTo(point.x, point.y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // Draw colored background segments for the full circle
    for (let i = 0; i < 16; i++) {
      const startAngle = (i * 22.5 - 90 - 11.25) * Math.PI / 180 // Center each segment
      const endAngle = ((i + 1) * 22.5 - 90 - 11.25) * Math.PI / 180
      
      // Draw background color segment
      ctx.fillStyle = HUE_COLORS[i] + '20' // Very light background
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius * 1.4, startAngle, endAngle)
      ctx.closePath()
      ctx.fill()
    }

    // Draw test polygon with color segments
    if (testPoints.length > 0) {
      for (let i = 0; i < testPoints.length; i++) {
        const point1 = normalizePoint(testPoints[i])
        const point2 = normalizePoint(testPoints[(i + 1) % testPoints.length])
        
        // Draw colored segment with more opacity
        ctx.fillStyle = HUE_COLORS[i] + '60' // More opaque for test area
        ctx.strokeStyle = HUE_COLORS[i]
        ctx.lineWidth = 2
        
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(point1.x, point1.y)
        ctx.lineTo(point2.x, point2.y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Draw test polygon outline
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      const firstTest = normalizePoint(testPoints[0])
      ctx.moveTo(firstTest.x, firstTest.y)
      
      for (let i = 1; i < testPoints.length; i++) {
        const point = normalizePoint(testPoints[i])
        ctx.lineTo(point.x, point.y)
      }
      ctx.closePath()
      ctx.stroke()

      // Draw points
      testPoints.forEach((point, i) => {
        const normalized = normalizePoint(point)
        ctx.fillStyle = HUE_COLORS[i]
        ctx.beginPath()
        ctx.arc(normalized.x, normalized.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw scale labels
    if (showLabels) {
      ctx.fillStyle = '#666'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      
      gridCircles.forEach(value => {
        ctx.fillText(
          value.toString(),
          centerX,
          centerY - (value / 100) * radius - 5
        )
      })

      // Draw Rf and Rg values
      ctx.fillStyle = '#000'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Rf = ${Math.round(data.rf)}`, 10, 25)
      ctx.fillText(`Rg = ${Math.round(data.rg)}`, 10, 45)

      // Draw hue angle labels
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i < 16; i++) {
        const angle = (i * 22.5 - 90) * Math.PI / 180
        const labelRadius = radius * 1.5
        const x = centerX + Math.cos(angle) * labelRadius
        const y = centerY + Math.sin(angle) * labelRadius
        ctx.fillStyle = HUE_COLORS[i]
        ctx.fillText((i + 1).toString(), x, y + 4)
      }
    }

    // Draw center point
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI)
    ctx.fill()

  }, [data, width, height, showLabels])

  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No TM-30 data available</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Color Vector Graphic</h3>
        <p className="text-sm text-muted-foreground mt-1">
          TM-30-15 color fidelity and gamut visualization
        </p>
      </div>
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Interpretation:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Gray polygon: Reference illuminant</li>
              <li>• Colored polygon: Test source</li>
              <li>• Larger area: Higher saturation (Rg &gt; 100)</li>
              <li>• Smaller area: Lower saturation (Rg &lt; 100)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Hue Angles:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 16 hue bins (22.5° each)</li>
              <li>• Distance from center shows fidelity</li>
              <li>• Shape distortion indicates color shifts</li>
              <li>• Uniform shape indicates good color rendering</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}
"use client"

import { useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"

interface TM30AnnulusPlotProps {
  data: {
    rf: number
    rg: number
    cct?: number
    duv?: number
  } | null
  width?: number
  height?: number
}

export function TM30AnnulusPlot({ 
  data, 
  width = 300, 
  height = 300 
}: TM30AnnulusPlotProps) {
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
    const outerRadius = Math.min(width, height) * 0.4
    const innerRadius = outerRadius * 0.6
    
    // Background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)

    // Create gradient for the annulus
    const createAnnulusGradient = (startColor: string, endColor: string, startAngle: number, endAngle: number) => {
      ctx.save()
      
      // Create path for annulus segment
      ctx.beginPath()
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
      ctx.closePath()
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
      gradient.addColorStop(0, startColor)
      gradient.addColorStop(1, endColor)
      
      ctx.fillStyle = gradient
      ctx.fill()
      
      ctx.restore()
    }

    // Draw color segments for Rg representation
    const segments = 36 // Number of segments for smooth gradient
    const rgNormalized = (data.rg - 60) / 80 // Normalize Rg from 60-140 to 0-1
    
    for (let i = 0; i < segments; i++) {
      const startAngle = (i / segments) * 2 * Math.PI - Math.PI / 2
      const endAngle = ((i + 1) / segments) * 2 * Math.PI - Math.PI / 2
      
      // Color based on position and Rg value
      const hue = (i / segments) * 360
      const saturation = 50 + rgNormalized * 50 // Vary saturation based on Rg
      const lightness = 50 + (1 - rgNormalized) * 20 // Vary lightness inversely
      
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      const innerColor = `hsl(${hue}, ${saturation * 0.5}%, ${lightness + 20}%)`
      
      createAnnulusGradient(innerColor, color, startAngle, endAngle)
    }

    // Draw Rf indicator (radial position)
    const rfRadius = innerRadius + (outerRadius - innerRadius) * (data.rf / 100)
    
    // Draw Rf line
    ctx.save()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(centerX, centerY, rfRadius, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.restore()

    // Draw reference circles
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    
    // Draw circles at Rf = 80 and Rf = 100
    const rf80Radius = innerRadius + (outerRadius - innerRadius) * 0.8
    const rf100Radius = outerRadius
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, rf80Radius, 0, 2 * Math.PI)
    ctx.stroke()
    
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(centerX, centerY, rf100Radius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw inner and outer boundaries
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw center circle with CCT info if available
    ctx.fillStyle = '#f0f0f0'
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius * 0.8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw text in center
    ctx.fillStyle = '#000'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.fillText(`Rf = ${Math.round(data.rf)}`, centerX, centerY - 15)
    ctx.fillText(`Rg = ${Math.round(data.rg)}`, centerX, centerY + 5)
    
    if (data.cct) {
      ctx.font = '12px sans-serif'
      ctx.fillText(`${Math.round(data.cct)}K`, centerX, centerY + 25)
    }
    
    if (data.duv !== undefined) {
      ctx.font = '10px sans-serif'
      ctx.fillText(`Duv: ${data.duv.toFixed(4)}`, centerX, centerY + 40)
    }

    // Draw scale labels
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    
    // Rf scale
    ctx.textAlign = 'right'
    ctx.fillText('Rf=60', centerX - outerRadius - 10, centerY)
    ctx.textAlign = 'left'
    ctx.fillText('Rf=100', centerX + outerRadius + 10, centerY)
    
    // Rg scale  
    ctx.textAlign = 'center'
    ctx.fillText('Rg↑', centerX, centerY - outerRadius - 10)
    ctx.fillText('140', centerX, centerY - outerRadius - 25)
    ctx.fillText('60', centerX, centerY + outerRadius + 25)

  }, [data, width, height])

  if (!data) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Rf-Rg Annulus Plot</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fidelity and gamut visualization
        </p>
      </div>
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
        <p className="mb-2">Reading the plot:</p>
        <ul className="space-y-1">
          <li>• Dashed circle: Current Rf value ({Math.round(data.rf)})</li>
          <li>• Color intensity: Rg value ({Math.round(data.rg)})</li>
          <li>• Reference line at Rf = 80 (good fidelity)</li>
          <li>• Outer edge: Rf = 100 (perfect fidelity)</li>
        </ul>
      </div>
    </Card>
  )
}
"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useLibraryStore } from "@/lib/store"

interface UploadTabProps {
  dataType: string
  onUploadComplete?: () => void
}

export function UploadTab({ dataType, onUploadComplete }: UploadTabProps) {
  const { addItem } = useLibraryStore()
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Handle file upload
    for (const file of acceptedFiles) {
      try {
        toast.loading(`Uploading ${file.name}...`)
        const result = await api.uploadFile(file)
        
        // Add to library store
        if (result.spd_data) {
          addItem({
            title: result.metrics?.name || file.name.replace(/\.[^/.]+$/, ''),
            type: 'SPD',
            data: result.spd_data,
          })
          toast.success(`Successfully imported ${file.name}`)
        }
        
        // Trigger refresh callback if provided
        if (onUploadComplete) {
          onUploadComplete()
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }, [addItem, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-medium mb-2">
        {isDragActive 
          ? "Drop the files here..." 
          : "Drag and drop files here, or click to browse"}
      </p>
      <p className="text-sm text-muted-foreground">
        Supported formats: CSV, TXT, XLS
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {dataType === "spd" 
          ? "Upload spectral power distribution data" 
          : "Upload flicker measurement data"}
      </p>
    </div>
  )
}
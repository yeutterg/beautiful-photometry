import { Card } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

export default function CRIPage() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <Lightbulb className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">CRI Analysis</h2>
          <p className="text-muted-foreground">
            CRI analysis coming soon
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            This feature will provide detailed Color Rendering Index analysis and evaluation.
          </p>
      </Card>
    </div>
  )
}
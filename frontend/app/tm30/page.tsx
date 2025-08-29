import { Card } from "@/components/ui/card"
import { Palette } from "lucide-react"

export default function TM30Page() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-4">
            <Palette className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">TM-30 Analysis</h2>
        <p className="text-muted-foreground">
          TM-30 analysis coming soon
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          This feature will provide comprehensive color rendering evaluation using the IES TM-30 method.
        </p>
      </Card>
    </div>
  )
}
import { ImportSection } from "@/components/library/import-section"
import { DataLibrary } from "@/components/library/data-library"

export default function LibraryPage() {
  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <ImportSection />
      <DataLibrary />
    </div>
  )
}
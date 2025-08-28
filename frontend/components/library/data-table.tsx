"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Pencil } from "lucide-react"
import { format } from "date-fns"

interface DataItem {
  id: string
  title: string
  type: string
  createdDate: Date
  data?: Record<string, number>
}

interface DataTableProps {
  data: DataItem[]
  selectedItems: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onRowClick: (item: DataItem) => void
  onRename: (id: string, newTitle: string) => void
  onDateChange: (id: string, newDate: Date) => void
}

export function DataTable({
  data,
  selectedItems,
  onSelectionChange,
  onRowClick,
  onRename,
  onDateChange,
}: DataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id])
    } else {
      onSelectionChange(selectedItems.filter(itemId => itemId !== id))
    }
  }

  const startEditing = (id: string, title: string) => {
    setEditingId(id)
    setEditingTitle(title)
  }

  const saveTitle = (id: string) => {
    onRename(id, editingTitle)
    setEditingId(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No data in library</p>
        <p className="text-sm mt-2">Import data using the section above to get started</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedItems.length === data.length && data.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="w-24">Type</TableHead>
          <TableHead className="w-40">Created Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={item.id}
            className={item.type === "SPD" ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
            title={item.type === "SPD" ? "Click to analyze this SPD" : undefined}
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={(checked) => 
                  handleSelectItem(item.id, checked as boolean)
                }
              />
            </TableCell>
            <TableCell 
              onClick={() => {
                if (item.type === "SPD" && editingId !== item.id) {
                  onRowClick(item)
                }
              }}
              className="relative group"
            >
              {editingId === item.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveTitle(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle(item.id)
                    if (e.key === "Escape") cancelEditing()
                  }}
                  className="h-8"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span
                    className="flex-1 px-2 py-1 rounded"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startEditing(item.id, item.title)
                    }}
                  >
                    {item.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(item.id, item.title)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </TableCell>
            <TableCell
              onClick={() => item.type === "SPD" ? onRowClick(item) : undefined}
            >
              <Badge variant={item.type === "SPD" ? "default" : "secondary"}>
                {item.type}
              </Badge>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(item.createdDate, "PP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={item.createdDate}
                    onSelect={(date) => date && onDateChange(item.id, date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
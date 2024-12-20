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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

interface Location {
  id: string
  aisle: string
  bay: string
  height: string
  label: string
  type: string
}

interface LocationsTableProps {
  locations: Location[]
}

export function LocationsTable({ locations: initialLocations }: LocationsTableProps) {
  const [locations, setLocations] = useState(initialLocations)
  const [selectedLocations, setSelectedLocations] = useState<Record<string, boolean>>({})
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSelected = locations.reduce((acc, location) => {
        acc[location.id] = true
        return acc
      }, {} as Record<string, boolean>)
      setSelectedLocations(allSelected)
    } else {
      setSelectedLocations({})
    }
  }

  const handleSelectLocation = (locationId: string, checked: boolean) => {
    setSelectedLocations(prev => ({
      ...prev,
      [locationId]: checked
    }))
  }

  const handleDelete = async () => {
    const selectedIds = Object.entries(selectedLocations)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)

    if (selectedIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select locations to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} locations?`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/locations/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds: selectedIds })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      // Remove deleted locations from state
      setLocations(prev => prev.filter(loc => !selectedIds.includes(loc.id)))
      setSelectedLocations({})

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} locations`
      })
    } catch (error) {
      console.error('Failed to delete locations:', error)
      toast({
        title: "Error",
        description: "Failed to delete locations",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedCount = Object.values(selectedLocations).filter(Boolean).length

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="bg-muted p-4 flex items-center justify-between">
          <p className="text-sm">{selectedCount} locations selected</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Selected"}
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={locations.length > 0 && locations.every(loc => selectedLocations[loc.id])}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Aisle</TableHead>
            <TableHead>Bay</TableHead>
            <TableHead>Height</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell>
                <Checkbox
                  checked={selectedLocations[location.id] || false}
                  onCheckedChange={(checked) => handleSelectLocation(location.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>{location.label}</TableCell>
              <TableCell>{location.aisle}</TableCell>
              <TableCell>{location.bay}</TableCell>
              <TableCell>{location.height}</TableCell>
              <TableCell>{location.type}</TableCell>
            </TableRow>
          ))}
          {locations.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No locations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CreateLocationsForm() {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    aisle: "",
    bays: "10",
    heights: "5",
    type: "BAY"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!formData.aisle.trim()) {
      toast({
        title: "Error",
        description: "Please enter an aisle code",
        variant: "destructive",
      })
      return
    }

    const bays = parseInt(formData.bays)
    const heights = parseInt(formData.heights)

    if (isNaN(bays) || bays < 1 || bays > 100) {
      toast({
        title: "Error",
        description: "Number of bays must be between 1 and 100",
        variant: "destructive",
      })
      return
    }

    if (isNaN(heights) || heights < 1 || heights > 20) {
      toast({
        title: "Error",
        description: "Number of heights must be between 1 and 20",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Generate all location combinations
      const locations = []
      for (let bay = 1; bay <= bays; bay++) {
        for (let height = 1; height <= heights; height++) {
          locations.push({
            aisle: formData.aisle.toUpperCase(),
            bay: bay.toString().padStart(2, '0'),
            height: height.toString().padStart(2, '0'),
            type: formData.type,
            // Label format: {aisle}-{bay}-{height}
            label: `${formData.aisle.toUpperCase()}-${bay.toString().padStart(2, '0')}-${height.toString().padStart(2, '0')}`
          })
        }
      }

      // Send to API
      const response = await fetch('/api/locations/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Created ${result.count} locations`
      })

      // Reset form
      setFormData(prev => ({
        ...prev,
        aisle: ""
      }))

      // Refresh the page to show new locations
      window.location.reload()

    } catch (error) {
      console.error('Failed to create locations:', error)
      toast({
        title: "Error",
        description: "Failed to create locations",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aisle">Aisle Code</Label>
          <Input
            id="aisle"
            placeholder="e.g., A, B, AJ"
            value={formData.aisle}
            onChange={(e) => setFormData(prev => ({ ...prev, aisle: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bays">Number of Bays</Label>
          <Input
            id="bays"
            type="number"
            min="1"
            max="100"
            value={formData.bays}
            onChange={(e) => setFormData(prev => ({ ...prev, bays: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heights">Heights per Bay</Label>
          <Input
            id="heights"
            type="number"
            min="1"
            max="20"
            value={formData.heights}
            onChange={(e) => setFormData(prev => ({ ...prev, heights: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Location Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAY">Bay</SelectItem>
              <SelectItem value="AISLE">Aisle</SelectItem>
              <SelectItem value="STAGING">Staging</SelectItem>
              <SelectItem value="RECEIVING">Receiving</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Locations"}
        </Button>
        <p className="text-sm text-muted-foreground">
          This will create {parseInt(formData.bays || "0") * parseInt(formData.heights || "0")} locations
        </p>
      </div>
    </form>
  )
} 
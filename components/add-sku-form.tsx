"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Barcode, Building2, Package2, Text } from "lucide-react"
import { useRouter } from "next/navigation"

interface Item {
  id: string
  sku: string
  name: string
  barcode: string
  company: {
    id: string
    code: string
  }
}

export interface AddSkuFormProps {
  companies: {
    id: string
    code: string
  }[]
  onSuccess?: (newItem: Item) => void
  redirectPath?: string
  initialBarcode?: string
}

export function AddSkuForm({ companies, onSuccess, redirectPath, initialBarcode }: AddSkuFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    barcode: initialBarcode || "",
    companyId: companies.length === 1 ? companies[0].id : ""
  })

  useEffect(() => {
    if (initialBarcode) {
      setFormData(prev => ({ ...prev, barcode: initialBarcode }))
    }
  }, [initialBarcode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create item")
      }

      const newItem = await response.json()
      
      toast({
        title: "Success",
        description: "Item created successfully",
        variant: "success",
        duration: 3000,
      })
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(newItem)
        } else if (redirectPath) {
          window.location.href = redirectPath
        }
      }, 500)
      
    } catch (error) {
      console.error("Failed to create item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Barcode className="h-4 w-4" />
            </div>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              placeholder="Enter barcode"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <Select
              value={formData.companyId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Package2 className="h-4 w-4" />
            </div>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="Enter SKU"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Text className="h-4 w-4" />
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={loading || !formData.companyId || !formData.sku || !formData.name}
        >
          {loading ? "Creating..." : "Create SKU"}
        </Button>
      </div>
    </form>
  )
} 
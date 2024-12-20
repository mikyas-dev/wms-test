"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { AddSkuForm } from "@/components/add-sku-form"
import { Button } from "@/components/ui/button"

interface Company {
  id: string
  code: string
}

function AddSKUContent() {
  const searchParams = useSearchParams()
  const barcode = searchParams.get('barcode') || ""
  const returnUrl = searchParams.get('returnUrl') || "/stock/putaway"
  const [companies, setCompanies] = useState<Company[]>([])

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        if (!response.ok) throw new Error('Failed to fetch companies')
        const data = await response.json()
        setCompanies(data)
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      }
    }
    fetchCompanies()
  }, [])

  const handleSuccess = (newItem: any) => {
    // Add the new item ID to the return URL and navigate
    const url = new URL(returnUrl, window.location.origin)
    url.searchParams.append('newItemId', newItem.id)
    window.location.href = url.toString() // Using window.location for a full page refresh
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <h1 className="text-xl font-semibold">Add New SKU</h1>
          <p className="text-sm text-muted-foreground">
            Enter details for the scanned item
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container py-4">
        <AddSkuForm 
          companies={companies}
          onSuccess={handleSuccess}
          initialBarcode={barcode}
        />
      </div>
    </div>
  )
}

export default function AddSKUPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-[100dvh] bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container py-4">
            <h1 className="text-xl font-semibold">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <AddSKUContent />
    </Suspense>
  )
} 
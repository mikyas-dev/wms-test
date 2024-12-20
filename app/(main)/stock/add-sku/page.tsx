"use client"

import { useEffect, useState } from "react"
import { AddSkuForm } from "@/components/add-sku-form"
import { useRouter } from "next/navigation"

interface Company {
  id: string
  code: string
}

export default function AddSkuPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    // Fetch companies on mount
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

  const handleSuccess = () => {
    // Simply redirect back to the SKU page
    router.push("/stock/sku")
  }

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Add New SKU</h1>
        <p className="text-sm text-muted-foreground">Create a new SKU in the system</p>
      </div>
      
      <div className="border rounded-lg p-6 bg-card">
        <AddSkuForm 
          companies={companies} 
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
} 
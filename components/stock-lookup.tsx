"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

interface Company {
  id: string
  code: string
}

interface StockLookupProps {
  companies: Company[]
}

export function StockLookup({ companies }: StockLookupProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [stockResults, setStockResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery && !selectedCompany) {
      toast({
        title: "Error",
        description: "Please enter a SKU to search or select a company",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('sku', searchQuery)
      if (selectedCompany) params.append('companyId', selectedCompany)
      
      const response = await fetch(`/api/stock/lookup?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch stock data')
      
      const data = await response.json()
      setStockResults(data)
    } catch (error) {
      console.error('Failed to search stock:', error)
      toast({
        title: "Error",
        description: "Failed to search stock",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "Please select a company to download the report",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/stock/report?companyId=${selectedCompany}`)
      if (!response.ok) throw new Error('Failed to generate report')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      })
    } catch (error) {
      console.error('Failed to download report:', error)
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
        <div className="space-y-1">
          <label className="text-sm font-medium">Company</label>
          <Select
            value={selectedCompany}
            onValueChange={setSelectedCompany}
          >
            <SelectTrigger>
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

        <div className="space-y-1">
          <label className="text-sm font-medium">Search by SKU</label>
          <Input
            placeholder="Enter SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Button onClick={handleSearch} disabled={isLoading} className="flex-1 sm:flex-none">
            {isLoading ? "Searching..." : "Search"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            disabled={isLoading || !selectedCompany}
            className="flex-1 sm:flex-none"
          >
            Download Report
          </Button>
        </div>
      </div>

      {stockResults.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockResults.map((stock) => (
                <TableRow key={`${stock.id}-${stock.location.label}`}>
                  <TableCell className="whitespace-nowrap">{stock.item.sku}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{stock.item.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{stock.location.label}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{stock.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 
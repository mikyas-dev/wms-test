"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Upload, Plus, Pencil, Trash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
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

interface SKUTableProps {
  items: Item[]
  companies: {
    id: string
    code: string
  }[]
}

export function SKUTable({ items: initialItems, companies }: SKUTableProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<typeof items[0] | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [dependencies, setDependencies] = useState<{
    stockCount: number
    transactionCount: number
  } | null>(null)

  // Filter items based on search term
  const filteredItems = items.filter(
    item =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: editingItem.sku,
          name: editingItem.name,
          barcode: editingItem.barcode,
        }),
      })

      if (!response.ok) throw new Error('Failed to update item')

      const updatedItem = await response.json()
      setItems(items.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ))
      setEditingItem(null)
      toast({
        title: "Success",
        description: "Item updated successfully",
        variant: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to update item:', error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  // Add this function to check dependencies
  const checkDependencies = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}?dependencies=true`)
      if (!response.ok) throw new Error('Failed to get dependencies')
      const deps = await response.json()
      setDependencies(deps)
    } catch (error) {
      console.error('Failed to get dependencies:', error)
    }
  }

  // Update the delete dialog trigger
  const handleDeleteClick = async (itemId: string) => {
    setItemToDelete(itemId)
    await checkDependencies(itemId)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/items/${itemToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete item')

      // Update local state immediately
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete))
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      setDependencies(null)
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    const csv = [
      ["SKU", "Name", "Barcode", "Company"],
      ...items.map(item => [
        item.sku,
        item.name,
        item.barcode,
        item.company.code
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "skus.csv"
    a.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string
        const rows = csvText.split('\n').map(row => row.trim().split(','))
        const headers = rows[0].map(header => header.trim())
        
        // Verify headers match expected format
        const expectedHeaders = ["SKU", "Name", "Barcode", "Company"]
        if (!headers.every((header, i) => header === expectedHeaders[i])) {
          toast({
            title: "Error",
            description: "CSV headers do not match the expected format",
            variant: "destructive",
          })
          return
        }

        const data = rows.slice(1).filter(row => row.length === headers.length)
        const successfulImports: Item[] = []
        const failedImports: { sku: string; reason: string }[] = []

        // Process each row
        for (const row of data) {
          const [sku, name, barcode, companyCode] = row.map(field => field.trim())
          const company = companies.find(c => c.code === companyCode)
          
          if (!company) {
            failedImports.push({ sku, reason: `Company code "${companyCode}" not found` })
            continue
          }

          try {
            const response = await fetch('/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sku,
                name,
                barcode,
                companyId: company.id
              })
            })

            if (!response.ok) {
              const error = await response.text()
              failedImports.push({ sku, reason: error })
              continue
            }

            const newItem = await response.json()
            successfulImports.push(newItem)
          } catch (error) {
            failedImports.push({ 
              sku, 
              reason: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }

        // Update the UI with new items
        if (successfulImports.length > 0) {
          setItems(prevItems => [...prevItems, ...successfulImports])
        }

        // Show results toast
        if (successfulImports.length > 0 || failedImports.length > 0) {
          toast({
            title: "Import Results",
            description: (
              <div className="mt-2">
                <p className="text-green-600">
                  Successfully imported: {successfulImports.length} items
                </p>
                {failedImports.length > 0 && (
                  <div className="mt-2">
                    <p className="text-destructive">Failed to import: {failedImports.length} items</p>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {failedImports.slice(0, 3).map(({ sku, reason }, i) => (
                        <li key={i}>
                          {sku}: {reason}
                        </li>
                      ))}
                      {failedImports.length > 3 && (
                        <li>...and {failedImports.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ),
            variant: "success",
            duration: 3000,
          })
        }

        // Reset the file input
        e.target.value = ''
      } catch (error) {
        console.error('Failed to import items:', error)
        toast({
          title: "Error",
          description: "Failed to process CSV file",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <Button size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button size="sm" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
          <Button size="sm" onClick={() => router.push("/stock/add-sku")} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add SKU
          </Button>
        </div>
      </div>

      {/* Desktop View */}
      <div className="w-full rounded-md border md:block hidden">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">SKU</TableHead>
                <TableHead className="w-[35%]">Name</TableHead>
                <TableHead className="w-[25%]">Barcode</TableHead>
                <TableHead className="w-[15%]">Company</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell>{item.company?.code || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {filteredItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{item.sku}</div>
                <div className="text-sm text-muted-foreground">{item.name}</div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingItem(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => handleDeleteClick(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Barcode</div>
                <div>{item.barcode}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Company</div>
                <div>{item.company?.code || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={editingItem?.sku || ''}
                  onChange={(e) => setEditingItem(prev => 
                    prev ? { ...prev, sku: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={editingItem?.barcode || ''}
                  onChange={(e) => setEditingItem(prev => 
                    prev ? { ...prev, barcode: e.target.value } : null
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this item?</p>
            {dependencies && (dependencies.stockCount > 0 || dependencies.transactionCount > 0) && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-md">
                <p className="font-semibold text-destructive">Warning:</p>
                <p>This will also delete:</p>
                <ul className="list-disc list-inside mt-2">
                  {dependencies.stockCount > 0 && (
                    <li>{dependencies.stockCount} stock record{dependencies.stockCount !== 1 ? 's' : ''}</li>
                  )}
                  {dependencies.transactionCount > 0 && (
                    <li>{dependencies.transactionCount} transaction{dependencies.transactionCount !== 1 ? 's' : ''}</li>
                  )}
                </ul>
              </div>
            )}
            <p className="mt-4 text-muted-foreground">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false)
              setDependencies(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
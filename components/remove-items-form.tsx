"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Minus, Plus, Scan, Keyboard } from "lucide-react"
import { playErrorSound } from "@/lib/play-error-sound"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Stock {
  id: string
  quantity: number
  item: {
    id: string
    sku: string
    name: string
    barcode: string
  }
  location: {
    id: string
    label: string
  }
}

interface RemoveItemsFormProps {
  location: string
  initialStock: Stock[]
}

export function RemoveItemsForm({ location, initialStock }: RemoveItemsFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [manualBarcodeInput, setManualBarcodeInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stock, setStock] = useState(initialStock)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)

  // Function to focus the input
  const focusInput = () => {
    if (inputRef.current && !isDialogOpen) {
      inputRef.current.focus()
      // Force cursor to end of input
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }

  // Keep input focused at all times (except when dialog is open)
  useEffect(() => {
    if (!isDialogOpen) {
      focusInput()
      const interval = setInterval(focusInput, 100)

      // Focus when tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !isDialogOpen) {
          focusInput()
        }
      }

      // Focus when window gains focus
      const handleFocus = () => !isDialogOpen && focusInput()

      // Focus on click anywhere in the document
      const handleClick = () => !isDialogOpen && focusInput()

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
      document.addEventListener('click', handleClick)

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('click', handleClick)
      }
    }
  }, [isDialogOpen])

  // Focus manual input when dialog opens
  useEffect(() => {
    if (isDialogOpen && manualInputRef.current) {
      manualInputRef.current.focus()
    }
  }, [isDialogOpen])

  const processBarcode = async (barcode: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setBarcodeInput("")
    setManualBarcodeInput("")
    setIsDialogOpen(false)

    try {
      console.log("[REMOVE] Processing barcode:", barcode)
      // Find the stock item with this barcode
      const stockItem = stock.find(s => s.item.barcode === barcode)
      
      if (!stockItem) {
        console.log("[REMOVE] Item not found for barcode:", barcode)
        // Play error sound and show error toast
        playErrorSound()
        toast({
          title: "Error",
          description: "Item not found in this location",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Check if we have enough quantity to remove
      const currentQuantity = selectedItems[stockItem.id] || 0
      if (currentQuantity >= stockItem.quantity) {
        console.log("[REMOVE] Insufficient quantity for:", stockItem.item.sku)
        playErrorSound()
        toast({
          title: "Error",
          description: "Cannot remove more items than available",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Update selected items
      setSelectedItems(prev => ({
        ...prev,
        [stockItem.id]: currentQuantity + 1
      }))

      console.log("[REMOVE] Added item to removal list:", stockItem.item.sku)
      toast({
        title: "Item Scanned",
        description: `Added ${stockItem.item.name} to removal list`,
        duration: 3000,
      })
    } catch (error) {
      console.error('[REMOVE] Failed to process barcode:', error)
      toast({
        title: "Error",
        description: "Failed to process barcode",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
      focusInput()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.keys(selectedItems).length === 0) {
      toast({
        title: "Error",
        description: "Please select items to remove",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/stock/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(selectedItems).map(([stockId, quantity]) => ({
            stockId,
            quantity
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to remove stock')
      }

      toast({
        title: "Success",
        description: "Stock removed successfully",
        duration: 3000,
      })

      router.push('/stock/remove')
    } catch (error) {
      console.error('Failed to remove stock:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove stock",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuantityChange = (stockId: string, delta: number) => {
    const stockItem = stock.find(s => s.id === stockId)
    if (!stockItem) return

    const currentQuantity = selectedItems[stockId] || 0
    const newQuantity = Math.max(0, currentQuantity + delta)

    if (newQuantity > stockItem.quantity) {
      playErrorSound()
      toast({
        title: "Error",
        description: "Cannot remove more items than available",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    if (newQuantity === 0) {
      const { [stockId]: _, ...rest } = selectedItems
      setSelectedItems(rest)
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [stockId]: newQuantity
      }))
    }
  }

  // Handle input change - automatically submit if it ends with Enter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBarcodeInput(value)
    
    // If the input ends with a newline character (Enter key from barcode scanner)
    if (value.endsWith('\n')) {
      const cleanValue = value.replace('\n', '').trim()
      if (cleanValue) {
        processBarcode(cleanValue)
      }
    }
  }

  // Handle manual form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = barcodeInput.trim()
    if (value) {
      processBarcode(value)
    }
  }

  // Handle manual barcode submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = manualBarcodeInput.trim()
    if (value) {
      processBarcode(value)
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <h1 className="text-xl font-semibold">Remove Stock from {location}</h1>
          <p className="text-sm text-muted-foreground">
            Scan items to remove from this location
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container py-4 space-y-4">
        {/* Scan Input */}
        <div className="flex gap-2">
          <form onSubmit={handleFormSubmit} className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Scan className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="none"
              value={barcodeInput}
              onChange={handleInputChange}
              placeholder="Ready for scanning..."
              className="w-full h-14 pl-12 pr-4 bg-muted/50 border rounded-lg text-lg"
              disabled={isProcessing}
              autoComplete="off"
              autoFocus
            />
            {isProcessing && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </form>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-14 px-4"
                disabled={isProcessing}
              >
                <Keyboard className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Barcode Manually</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <Input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  placeholder="Enter barcode..."
                  className="text-lg"
                  autoComplete="off"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!manualBarcodeInput.trim()}
                  >
                    Add Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stock List */}
        <div className="rounded-lg border bg-card">
          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">To Remove</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item.sku}</TableCell>
                    <TableCell>{item.item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {selectedItems[item.id] || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={!selectedItems[item.id]}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={selectedItems[item.id] === item.quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="block sm:hidden divide-y">
            {stock.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div>
                  <div className="font-medium">{item.item.sku}</div>
                  <div className="text-sm text-muted-foreground">{item.item.name}</div>
                  <div className="text-sm mt-1">
                    Available: <span className="font-medium">{item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    To Remove: {selectedItems[item.id] || 0}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={!selectedItems[item.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      disabled={selectedItems[item.id] === item.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 border-t bg-background/95">
        <div className="container py-4">
          <div className="flex justify-center gap-4 max-w-sm mx-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/stock/remove')}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || Object.keys(selectedItems).length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Remove Selected Items'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 
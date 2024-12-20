"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Scan, Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const serverLog = async (message: string, data?: any) => {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data })
    })
  } catch (error) {
    // Silently fail if logging fails
  }
}

export function MoveStockForm() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [manualBarcodeInput, setManualBarcodeInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

    try {
      await serverLog("Processing barcode in move form", { barcode })
      
      // Validate the barcode format
      const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
      if (!pattern.test(barcode)) {
        await serverLog("Invalid barcode format", { barcode })
        toast({
          title: "Invalid Format",
          description: "Location code must be in format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // First verify the location exists and has stock
      const locationResponse = await fetch(`/api/locations/${encodeURIComponent(barcode)}`)
      if (!locationResponse.ok) {
        if (locationResponse.status === 404) {
          toast({
            title: "Error",
            description: "Location not found",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to verify location",
            variant: "destructive",
          })
        }
        return
      }

      // Then fetch all stock in this location
      const stockResponse = await fetch(`/api/stock/location/${encodeURIComponent(barcode)}`)
      if (!stockResponse.ok) throw new Error('Failed to fetch stock')
      
      const items = await stockResponse.json()
      if (items.length === 0) {
        toast({
          title: "Error",
          description: "No stock found in this location",
          variant: "destructive",
        })
        return
      }

      // Show success toast
      toast({
        title: "Location Scanned",
        description: `Found ${items.length} items in ${barcode}`,
        duration: 3000,
      })

      const normalizedBarcode = barcode.toUpperCase()
      const url = `/stock/move/items?location=${encodeURIComponent(normalizedBarcode)}`
      
      await serverLog("Navigating to move items page", { 
        barcode: normalizedBarcode,
        url
      })
      
      // Use push instead of replace to maintain history
      router.push(url, { scroll: false })
    } catch (error) {
      await serverLog("Error processing barcode", { error })
      toast({
        title: "Error",
        description: "Failed to process barcode",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
      setBarcodeInput("")
      setManualBarcodeInput("")
      setIsDialogOpen(false)
      // Refocus the input
      focusInput()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    processBarcode(barcodeInput.trim())
  }

  // Handle manual barcode submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = manualBarcodeInput.trim()
    if (value) {
      processBarcode(value)
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
        setBarcodeInput(cleanValue)
        processBarcode(cleanValue)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Move Stock Process</h2>
        <p className="text-sm text-muted-foreground">
          Scan the bay location you are moving stock from
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <form onSubmit={handleSubmit} className="relative flex-1">
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
                <DialogTitle>Enter Location Code Manually</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the location code in the format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)
                  </p>
                  <Input
                    ref={manualInputRef}
                    type="text"
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    placeholder="Enter location code..."
                    className="text-lg"
                    autoComplete="off"
                  />
                </div>
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
                    Continue
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push('/stock/move')}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
} 
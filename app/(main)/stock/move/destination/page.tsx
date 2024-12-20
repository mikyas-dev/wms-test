"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Scan, Keyboard } from "lucide-react"
import { playErrorSound } from "@/lib/play-error-sound"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface MoveData {
  fromLocation: string
  items: {
    stockId: string
    quantity: number
  }[]
}

export default function MoveDestinationPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [manualBarcodeInput, setManualBarcodeInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const [moveData, setMoveData] = useState<MoveData | null>(null)

  // Load move data from localStorage
  useEffect(() => {
    const data = localStorage.getItem('moveStockData')
    if (!data) {
      toast({
        title: "Error",
        description: "No items selected for moving",
        variant: "destructive",
      })
      router.push('/stock/move')
      return
    }

    try {
      setMoveData(JSON.parse(data))
    } catch (error) {
      console.error('Failed to parse move data:', error)
      toast({
        title: "Error",
        description: "Invalid move data",
        variant: "destructive",
      })
      router.push('/stock/move')
    }
  }, [router])

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
    if (isProcessing || !moveData) return
    setIsProcessing(true)
    setBarcodeInput("")
    setManualBarcodeInput("")
    setIsDialogOpen(false)

    try {
      console.log("[MOVE_DESTINATION] Processing barcode:", barcode)
      
      // Validate location format
      const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
      if (!pattern.test(barcode.toUpperCase())) {
        console.log("[MOVE_DESTINATION] Invalid location format:", barcode)
        playErrorSound()
        toast({
          title: "Error",
          description: "Invalid location format. Expected format: A-01-02 or AB-01-02",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Check if destination is same as source
      if (barcode.toUpperCase() === moveData.fromLocation.toUpperCase()) {
        console.log("[MOVE_DESTINATION] Cannot move to same location")
        playErrorSound()
        toast({
          title: "Error",
          description: "Cannot move items to the same location",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Validate location exists
      const locationResponse = await fetch(`/api/locations/validate?label=${encodeURIComponent(barcode)}`)
      if (!locationResponse.ok) {
        throw new Error('Failed to validate location')
      }

      // Move the items
      const response = await fetch('/api/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLocation: moveData.fromLocation,
          toLocation: barcode.toUpperCase(),
          items: moveData.items
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to move stock')
      }

      // Clear move data from localStorage
      localStorage.removeItem('moveStockData')

      toast({
        title: "Success",
        description: "Stock moved successfully",
        duration: 3000,
      })

      router.push('/stock/move')
    } catch (error) {
      console.error('[MOVE_DESTINATION] Error:', error)
      playErrorSound()
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move stock",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
      focusInput()
    }
  }

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

  if (!moveData) {
    return null
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <h1 className="text-xl font-semibold">Scan Destination Location</h1>
          <p className="text-sm text-muted-foreground">
            Moving {moveData.items.reduce((acc, item) => acc + item.quantity, 0)} items from {moveData.fromLocation}
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
              placeholder="Scan destination location..."
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
                <DialogTitle>Enter Location Manually</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <Input
                  ref={manualInputRef}
                  type="text"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  placeholder="Enter location..."
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
                    Move Items
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95">
          <div className="container py-4">
            <div className="flex justify-center gap-4 max-w-sm mx-auto">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('moveStockData')
                  router.push('/stock/move')
                }}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
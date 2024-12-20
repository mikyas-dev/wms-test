"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Loader2, Minus, Plus, Trash2, Scan, Keyboard } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ScannedItem {
  id: string
  sku: string
  name: string
  barcode: string
  quantity: number
}

interface PutawayItemsFormProps {
  location: string
}

const STORAGE_KEY_PREFIX = 'putaway-items-'

export function PutawayItemsForm({ location }: PutawayItemsFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [manualBarcodeInput, setManualBarcodeInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Track failed barcode scans
  const [failedScans, setFailedScans] = useState<{ [barcode: string]: number }>({})
  const REQUIRED_SCANS = 3

  // Initialize scanned items from storage
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>(() => {
    if (typeof window === 'undefined') return []
    const stored = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${location}`)
    return stored ? JSON.parse(stored) : []
  })

  // Use ref for processed items to persist across renders
  const processedItemsRef = useRef<Set<string>>(new Set())

  // Input ref for focus management
  const inputRef = useRef<HTMLInputElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  
  // Focus management with error handling
  const focusInput = useCallback(() => {
    try {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (error) {
      console.error('Error focusing input:', error)
    }
  }, [])

  // Persist scanned items to storage with error handling
  const persistItems = useCallback((items: ScannedItem[]) => {
    try {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${location}`, JSON.stringify(items))
    } catch (error) {
      console.error('Error persisting items:', error)
      toast({
        title: "Warning",
        description: "Failed to save items to browser storage",
        variant: "destructive",
      })
    }
  }, [location])

  // Update items and storage with proper error handling
  const updateScannedItems = useCallback((newItems: ScannedItem[]) => {
    setScannedItems(newItems)
    persistItems(newItems)
  }, [persistItems])

  // Process a newly created item with improved error handling
  const processNewItem = useCallback(async (newItemId: string) => {
    if (processedItemsRef.current.has(newItemId)) return
    
    try {
      setIsProcessing(true)
      const response = await fetch(`/api/items/${newItemId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch item: ${errorText}`)
      }
      
      const item = await response.json()
      
      // Validate item data
      if (!item?.id || !item?.sku || !item?.name) {
        throw new Error('Invalid item data received')
      }
      
      // Add to scanned items
      const newItem = {
        id: item.id,
        sku: item.sku,
        name: item.name,
        barcode: item.barcode,
        quantity: 1
      }
      
      updateScannedItems([...scannedItems, newItem])
      processedItemsRef.current.add(newItemId)
      
      // Clear URL parameter without navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('newItemId')
      window.history.replaceState({}, '', url.toString())
      
      // Don't show a toast here since one was already shown when the item was created
    } catch (error) {
      console.error('Failed to add new item:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add new item to list",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      focusInput()
    }
  }, [scannedItems, updateScannedItems, focusInput])

  // Process scanned barcode with improved validation and error handling
  const processBarcode = useCallback(async (barcode: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setBarcodeInput("")
    setManualBarcodeInput("")
    setIsDialogOpen(false)

    try {
      if (!barcode.trim()) {
        throw new Error('Invalid barcode')
      }

      console.log(`[PUTAWAY] Processing barcode scan: ${barcode}`)
      console.log(`[PUTAWAY] Current failed scans:`, failedScans)
      
      const response = await fetch(`/api/items/barcode/${encodeURIComponent(barcode)}`)
      
      // Handle 404 case first
      if (response.status === 404) {
        const currentScans = (failedScans[barcode] || 0) + 1
        console.log(`[PUTAWAY] Barcode not found (attempt ${currentScans} of ${REQUIRED_SCANS}): ${barcode}`)
        
        const updatedScans = { ...failedScans, [barcode]: currentScans }
        setFailedScans(updatedScans)
        console.log(`[PUTAWAY] Updated failed scans:`, updatedScans)

        if (currentScans < REQUIRED_SCANS) {
          console.log(`[PUTAWAY] Requesting retry for barcode: ${barcode}`)
          toast({
            title: "Unknown Barcode",
            description: (
              <div className="space-y-1">
                <p>This barcode is not in the system.</p>
                <p className="font-medium">
                  Please scan {REQUIRED_SCANS - currentScans} more time{REQUIRED_SCANS - currentScans > 1 ? 's' : ''} to confirm 
                  {currentScans === 1 ? " (2 of 3)" : " (3 of 3)"} and add as new SKU.
                </p>
              </div>
            ),
            variant: "destructive",
            duration: 3000,
          })
          setIsProcessing(false)
          focusInput()
          return
        }

        console.log(`[PUTAWAY] Required scans reached for barcode: ${barcode}, redirecting to add SKU`)
        // Reset scan count and redirect...
        setFailedScans(prev => {
          const newScans = { ...prev }
          delete newScans[barcode]
          return newScans
        })

        const currentUrl = window.location.pathname + window.location.search
        const addSkuUrl = `/stock/putaway/add-sku?barcode=${encodeURIComponent(barcode)}&returnUrl=${encodeURIComponent(currentUrl)}`
        router.push(addSkuUrl)
        return
      }

      // Handle other error responses
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[PUTAWAY] Error fetching barcode ${barcode}:`, errorText)
        throw new Error(`Failed to fetch item: ${errorText}`)
      }

      console.log(`[PUTAWAY] Successfully found item for barcode: ${barcode}`)
      // Reset ALL failed scans on any successful scan
      setFailedScans({})
      console.log(`[PUTAWAY] Reset all failed scans after successful scan`)

      const item = await response.json()
      
      // Validate item data
      if (!item?.id || !item?.sku || !item?.name) {
        throw new Error('Invalid item data received')
      }
      
      const existingItemIndex = scannedItems.findIndex(i => i.id === item.id)
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...scannedItems]
        updatedItems[existingItemIndex].quantity += 1
        updateScannedItems(updatedItems)
        
        toast({
          title: "Quantity Updated",
          description: `Increased quantity of ${item.name}`,
          variant: "success",
          duration: 3000,
        })
      } else {
        // Add new item to list
        const newItem = {
          id: item.id,
          sku: item.sku,
          name: item.name,
          barcode: item.barcode,
          quantity: 1
        }
        updateScannedItems([...scannedItems, newItem])
        
        toast({
          title: "Item Added",
          description: `Added ${item.name} to the list`,
          variant: "success",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error processing barcode:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process item",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
      focusInput()
    }
  }, [isProcessing, router, scannedItems, updateScannedItems, focusInput, failedScans])

  // Optimized handlers with proper types
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.endsWith('\n')) {
      const barcode = value.replace('\n', '').trim()
      if (barcode) processBarcode(barcode)
    } else {
      setBarcodeInput(value)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const barcode = barcodeInput.trim()
      if (barcode) processBarcode(barcode)
    }
  }, [barcodeInput])

  // Memoized item management functions
  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setItemToDelete(itemId)
      return
    }
    
    updateScannedItems(
      scannedItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }, [scannedItems, updateScannedItems])

  const removeItem = useCallback((itemId: string) => {
    const item = scannedItems.find(i => i.id === itemId)
    if (item) {
      updateScannedItems(scannedItems.filter(i => i.id !== itemId))
      toast({
        title: "Item Removed",
        description: `Removed ${item.name} from the list`,
      })
    }
    setItemToDelete(null)
  }, [scannedItems, updateScannedItems])

  // Handle final putaway with improved error handling and validation
  const handleFinalPutaway = async () => {
    if (scannedItems.length === 0) {
      toast({
        title: "Error",
        description: "No items to putaway",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/stock/putaway-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationLabel: location,
          items: scannedItems.map(item => ({
            itemId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      // Clear storage after successful putaway
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${location}`)
      
      toast({
        title: "Success",
        description: `${scannedItems.length} items have been added to ${location}`,
        variant: "success",
        duration: 3000,
      })

      // Return to putaway page after a short delay
      setTimeout(() => {
        router.push('/stock/putaway')
      }, 1500)
    } catch (error) {
      console.error("Error adding stock:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Initialize loading state
  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Check for newly created item
  useEffect(() => {
    const newItemId = searchParams.get('newItemId')
    if (newItemId) {
      processNewItem(newItemId)
    }
  }, [searchParams, processNewItem])

  // Auto-focus management
  useEffect(() => {
    focusInput()
    const interval = setInterval(focusInput, 1000)
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        focusInput()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [focusInput])

  // Focus manual input when dialog opens
  useEffect(() => {
    if (isDialogOpen && manualInputRef.current) {
      manualInputRef.current.focus()
    }
  }, [isDialogOpen])

  // Handle manual barcode submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = manualBarcodeInput.trim()
    if (value) {
      processBarcode(value)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="py-4">
          <h1 className="text-xl font-semibold">Putaway to {location}</h1>
          <p className="text-sm text-muted-foreground">
            Scan items to add to this location
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-4 space-y-4">
        {/* Scan Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Scan className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="none"
              value={barcodeInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ready for scanning..."
              className="w-full h-14 pl-12 pr-4 bg-muted/50 border rounded-lg text-lg"
              disabled={isProcessing}
              autoComplete="off"
            />
            {isProcessing && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

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
                <DialogTitle>Enter Item Barcode Manually</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the item barcode to add to this location
                  </p>
                  <Input
                    ref={manualInputRef}
                    type="text"
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    placeholder="Enter barcode..."
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
                    Add Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scanned Items List */}
        {scannedItems.length > 0 ? (
          <div className="rounded-lg border bg-card">
            {/* Desktop View */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setItemToDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden divide-y">
              {scannedItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.sku}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mt-1"
                      onClick={() => setItemToDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No items scanned yet</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 border-t bg-background/95">
        <div className="py-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${location}`)
                router.push('/stock/putaway')
              }}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalPutaway}
              disabled={isProcessing || scannedItems.length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                `Confirm ${scannedItems.length} Items`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from the list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => itemToDelete && removeItem(itemToDelete)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 

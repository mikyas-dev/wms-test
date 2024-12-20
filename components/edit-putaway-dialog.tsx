"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  quantity: number
  item: {
    sku: string
    name: string
  }
}

interface EditPutawayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  transactions: Transaction[]
  onSuccess?: () => void
}

export function EditPutawayDialog({
  open,
  onOpenChange,
  batchId,
  transactions: initialTransactions,
  onSuccess
}: EditPutawayDialogProps) {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => 
    Object.fromEntries(initialTransactions.map(tx => [tx.id, tx.quantity.toString()]))
  )
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  // Handle keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75
      setIsKeyboardVisible(isKeyboard)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleQuantityChange = (id: string, value: string) => {
    // Remove leading zeros unless the value is just "0"
    const cleanValue = value === "0" ? value : value.replace(/^0+/, '')
    
    // Update the input value
    setInputValues(prev => ({ ...prev, [id]: cleanValue }))

    // Only update the transaction if we have a valid number
    if (cleanValue !== '') {
      const quantity = parseInt(cleanValue)
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === id ? { ...tx, quantity: Math.max(0, quantity) } : tx
        )
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If an input is focused, just blur it and don't submit yet
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur()
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/putaway-batch/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.map(({ id, quantity }) => ({
            id,
            quantity
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to update putaway')
      }

      toast({
        title: "Success",
        description: "Putaway quantities updated successfully",
        variant: "success",
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to update putaway:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update putaway",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[600px] flex flex-col p-0",
          isKeyboardVisible ? "h-screen" : "h-[calc(100vh-2rem)]"
        )}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Edit Putaway Quantities</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <form id="edit-form" onSubmit={handleSubmit}>
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[100px] text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.item.sku}</TableCell>
                        <TableCell>{tx.item.name}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputValues[tx.id]}
                            onChange={(e) => handleQuantityChange(tx.id, e.target.value)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="sticky bottom-0 p-6 pt-4 bg-background border-t mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="edit-form"
            disabled={loading}
            onClick={() => {
              // If no input is focused, submit the form
              if (!(document.activeElement instanceof HTMLInputElement)) {
                const form = document.getElementById('edit-form') as HTMLFormElement
                form.requestSubmit()
              }
            }}
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons"

interface Stock {
  id: string
  quantity: number
  item: {
    id: string
    sku: string
    name: string
    company: {
      code: string
    }
  }
}

interface RemoveStockSelectionProps {
  stock: Stock[]
  bayCode: string
}

export function RemoveStockSelection({ stock, bayCode }: RemoveStockSelectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuantityChange = (stockId: string, delta: number) => {
    const item = stock.find(s => s.id === stockId)
    if (!item) return

    setQuantities(prev => {
      const currentQty = prev[stockId] || 0
      const newQty = currentQty + delta
      
      if (newQty < 0) return prev
      if (newQty > item.quantity) return prev
      if (newQty === 0) {
        const { [stockId]: _, ...rest } = prev
        return rest
      }
      
      return { ...prev, [stockId]: newQty }
    })
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const itemsToRemove = Object.entries(quantities)
        .map(([stockId, quantity]) => ({
          stockId,
          quantity
        }))

      if (itemsToRemove.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one item to remove",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/stock/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToRemove,
          bayCode
        })
      })

      if (!response.ok) throw new Error('Failed to remove stock')

      toast({
        title: "Success",
        description: "Stock removed successfully",
      })

      // Redirect back to remove stock page
      window.location.href = '/stock/remove'
    } catch (error) {
      console.error('Failed to remove stock:', error)
      toast({
        title: "Error",
        description: "Failed to remove stock",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {stock.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{item.item.sku}</div>
                <div className="text-sm text-gray-500">{item.item.name}</div>
              </div>
              <div className="text-sm text-gray-500">
                Available: {item.quantity}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={!quantities[item.id]}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              
              <div className="w-12 text-center font-medium">
                {quantities[item.id] || 0}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(item.id, 1)}
                disabled={quantities[item.id] >= item.quantity}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 sticky bottom-0 bg-white p-4 border-t">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/stock/remove'}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(quantities).length === 0}
        >
          {isSubmitting ? "Removing..." : "Remove Selected"}
        </Button>
      </div>
    </div>
  )
} 
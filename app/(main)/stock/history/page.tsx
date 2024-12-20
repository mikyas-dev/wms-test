'use client'

import { TransactionHistoryTable } from "@/components/transaction-history-table"
import { TransactionHistoryLoading } from "@/components/transaction-history-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

enum TransactionType {
  PUTAWAY = 'PUTAWAY',
  REMOVE = 'REMOVE',
  MOVE = 'MOVE',
}

interface FilterState {
  type?: TransactionType
  status?: 'COMPLETED' | 'UNDONE'
}

export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [filters, setFilters] = useState<FilterState>({})
  const { toast } = useToast()

  // Fetch transactions with filters
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.type) queryParams.set('type', filters.type)
      if (filters.status) queryParams.set('status', filters.status)

      const response = await fetch(`/api/stock/history?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  // Handle undoing a transaction
  const handleUndo = async (transactionId: string) => {
    try {
      const response = await fetch('/api/stock/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.log(error.error)
        const message = error.error || 'Failed'
        console.log(message,"message")
        throw new Error(message)
      }

      // Refresh the transaction list
      fetchTransactions()
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
      throw error // Re-throw to be handled by the table component
    }
  }

  // Fetch transactions on mount and when filters change
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="w-[200px]">
              <Select
                onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, type: value === 'ALL' ? undefined : value as TransactionType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="PUTAWAY">Putaway</SelectItem>
                  <SelectItem value="REMOVE">Remove</SelectItem>
                  <SelectItem value="MOVE">Move</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[200px]">
            <Select
            onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value === 'ALL' ? undefined : value as 'COMPLETED' | 'UNDONE' }))
            }
            >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="UNDONE">Undone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Table */}
          {isLoading ? (
            <TransactionHistoryLoading />
          ) : (
            <TransactionHistoryTable 
              transactions={transactions}
              onUndo={handleUndo}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionType } from "@prisma/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  createdAt: Date
  type: TransactionType
  quantity: number
  status: 'COMPLETED' | 'UNDONE'
  undoneAt?: Date | null
  itemId: string
  item: {
    sku: string
    name: string
  }
  fromLocation?: {
    label: string
  } | null
  toLocation?: {
    label: string
  } | null
  user?: {
    username: string
  } | null
  undoneBy?: {
    username: string
  } | null
}

interface TransactionHistoryTableProps {
  transactions: Transaction[]
  onUndo: (transactionId: string) => Promise<void>
  isLoading?: boolean
}

export function TransactionHistoryTable({
  transactions,
  onUndo,
  isLoading = false
}: TransactionHistoryTableProps) {
  const { toast } = useToast()

  const hasNewerTransactions = (currentTransaction: Transaction): boolean => {
    const newerTransactions = transactions.filter(t => 
      t.itemId === currentTransaction.itemId && 
      t.status === 'COMPLETED' &&
      new Date(t.createdAt) > new Date(currentTransaction.createdAt)
    )
    return newerTransactions.length > 0
  }

  const handleUndo = async (transaction: Transaction) => {
    try {
      await onUndo(transaction.id)
      toast({
        title: "Transaction undone",
        description: `Successfully undid ${transaction.type.toLowerCase()} of ${transaction.quantity} ${transaction.item.sku}`,
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to undo transaction",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge>Completed</Badge>
      case 'UNDONE':
        return <Badge variant="secondary">Undone</Badge>
      default:
        return null
    }
  }

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'PUTAWAY':
        return 'text-green-600'
      case 'REMOVE':
        return 'text-red-600'
      case 'MOVE':
        return 'text-blue-600'
      default:
        return ''
    }
  }

  const getLocationText = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'PUTAWAY':
        return transaction.toLocation?.label || '-'
      case 'REMOVE':
        return transaction.fromLocation?.label || '-'
      case 'MOVE':
        return `${transaction.fromLocation?.label || '-'} → ${transaction.toLocation?.label || '-'}`
      default:
        return '-'
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell className={getTypeColor(transaction.type)}>
                  {transaction.type}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transaction.item.sku}</div>
                  <div className="text-sm text-gray-500">{transaction.item.name}</div>
                </TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>{getLocationText(transaction)}</TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                  {transaction.undoneAt && (
                    <div className="text-sm text-gray-500">
                      Undone by {transaction.undoneBy?.username} on{' '}
                      {format(new Date(transaction.undoneAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  )}
                </TableCell>
                <TableCell>{transaction.user?.username || '-'}</TableCell>
                <TableCell className="text-right">
                  {transaction.status === 'COMPLETED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUndo(transaction)}
                      disabled={isLoading || hasNewerTransactions(transaction)}
                      title={hasNewerTransactions(transaction) 
                        ? "Cannot undo: newer transactions exist for this item" 
                        : "Undo this transaction"}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
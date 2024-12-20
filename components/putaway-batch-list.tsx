"use client"

import { useState } from "react"
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
import { EditPutawayDialog } from "@/components/edit-putaway-dialog"
import { Badge } from "@/components/ui/badge"

interface PutawayBatchListProps {
  batches: {
    id: string
    location: {
      label: string
    }
    transactions: {
      id: string
      item: {
        sku: string
        name: string
      }
      quantity: number
    }[]
    status: string
    createdAt: string
  }[]
}

export function PutawayBatchList({ batches }: PutawayBatchListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editingBatch, setEditingBatch] = useState<typeof batches[0] | null>(null)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success"
      case "EDITED":
        return "warning"
      case "UNDONE":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleUndo = async (batchId: string) => {
    setLoading(batchId)
    try {
      const response = await fetch(`/api/putaway-batch/${batchId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to undo putaway')
      }

      toast({
        title: "Success",
        description: "Putaway has been undone",
        variant: "success",
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to undo putaway",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[150px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.location.label}</TableCell>
              <TableCell>
                {batch.transactions.length} items
                <div className="text-sm text-muted-foreground">
                  {batch.transactions.slice(0, 2).map(tx => (
                    <div key={tx.id}>
                      {tx.quantity}x {tx.item.sku}
                    </div>
                  ))}
                  {batch.transactions.length > 2 && (
                    <div>+{batch.transactions.length - 2} more</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(batch.status)}>
                  {batch.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2 justify-end">
                  {batch.status !== "UNDONE" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBatch(batch)}
                        disabled={loading === batch.id}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUndo(batch.id)}
                        disabled={loading === batch.id}
                      >
                        {loading === batch.id ? "..." : "Undo"}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingBatch && (
        <EditPutawayDialog
          open={true}
          onOpenChange={() => setEditingBatch(null)}
          batchId={editingBatch.id}
          transactions={editingBatch.transactions}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
} 
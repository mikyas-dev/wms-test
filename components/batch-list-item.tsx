"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditPutawayDialog } from "@/components/edit-putaway-dialog"
import { toast } from "@/hooks/use-toast"
import { Pencil, RotateCcw } from "lucide-react"

interface PutawayBatch {
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
}

function getStatusBadgeVariant(status: string) {
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

export function BatchListItem({ batch }: { batch: PutawayBatch }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editingBatch, setEditingBatch] = useState<PutawayBatch | null>(null)

  const handleUndo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/putaway-batch/${batch.id}`, {
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

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to undo putaway",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{batch.location.label}</p>
            <Badge variant={getStatusBadgeVariant(batch.status)}>
              {batch.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {batch.transactions.map((tx, i) => (
              <div key={tx.id} className="line-clamp-1">
                {tx.quantity}x {tx.item.sku}
                {i < 2 && batch.transactions.length > i + 1 && ", "}
                {i === 2 && batch.transactions.length > 3 && ` +${batch.transactions.length - 3} more`}
              </div>
            )).slice(0, 3)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {new Date(batch.createdAt).toLocaleDateString()}
          </div>
          {batch.status !== "UNDONE" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingBatch(batch)}
                disabled={loading}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={loading}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                {loading ? "..." : "Undo"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {editingBatch && (
        <EditPutawayDialog
          open={true}
          onOpenChange={() => setEditingBatch(null)}
          batchId={editingBatch.id}
          transactions={editingBatch.transactions}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
} 
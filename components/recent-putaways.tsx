import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { BatchListItem } from "@/components/batch-list-item"
import type { PutawayBatch as PrismaPutawayBatch } from "@prisma/client"

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

async function getBatches() {
  const batches = await prisma.putawayBatch.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      location: {
        select: {
          label: true
        }
      },
      transactions: {
        select: {
          id: true,
          quantity: true,
          item: {
            select: {
              sku: true,
              name: true
            }
          }
        }
      }
    }
  })

  return batches.map((batch: PrismaPutawayBatch & {
    location: { label: string }
    transactions: {
      id: string
      quantity: number
      item: {
        sku: string
        name: string
      }
    }[]
  }) => ({
    ...batch,
    createdAt: batch.createdAt.toISOString()
  }))
}

export async function RecentPutaways() {
  const batches = await getBatches()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Putaways</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {batches.map((batch: PutawayBatch) => (
          <BatchListItem key={batch.id} batch={batch} />
        ))}
      </CardContent>
    </Card>
  )
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface EditPutawayRequest {
  transactions: {
    id: string
    quantity: number
  }[]
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: EditPutawayRequest = await request.json()
    const { transactions } = body

    const result = await prisma.$transaction(async (tx) => {
      // Update the batch status
      const batch = await tx.putawayBatch.update({
        where: { id: params.id },
        data: { status: "EDITED" }
      })

      // Update each transaction and its corresponding stock
      const updatedTransactions = []
      for (const { id, quantity } of transactions) {
        // Get the original transaction to calculate difference
        const originalTransaction = await tx.transaction.findUnique({
          where: { id },
          include: { toLocation: true }
        })

        if (!originalTransaction) {
          throw new Error(`Transaction ${id} not found`)
        }

        // Calculate the quantity difference
        const quantityDiff = quantity - originalTransaction.quantity

        // Update the transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: { quantity },
          include: {
            item: true,
            toLocation: true
          }
        })

        // Update the stock record
        await tx.stock.update({
          where: {
            itemId_locationId: {
              itemId: originalTransaction.itemId,
              locationId: originalTransaction.toLocationId!
            }
          },
          data: {
            quantity: {
              increment: quantityDiff
            }
          }
        })

        updatedTransactions.push(updatedTransaction)
      }

      return {
        batch,
        transactions: updatedTransactions
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[PUTAWAY_BATCH_EDIT] Error:', error)
    return NextResponse.json(
      {
        error: "Failed to edit putaway batch",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the batch and its transactions
      const batch = await tx.putawayBatch.findUnique({
        where: { id: params.id },
        include: {
          transactions: {
            include: {
              item: true,
              toLocation: true
            }
          }
        }
      })

      if (!batch) {
        throw new Error("Putaway batch not found")
      }

      // Update each stock record
      for (const transaction of batch.transactions) {
        await tx.stock.update({
          where: {
            itemId_locationId: {
              itemId: transaction.itemId,
              locationId: transaction.toLocationId!
            }
          },
          data: {
            quantity: {
              decrement: transaction.quantity
            }
          }
        })
      }

      // Update batch status
      const updatedBatch = await tx.putawayBatch.update({
        where: { id: params.id },
        data: { status: "UNDONE" },
        include: {
          transactions: {
            include: {
              item: true,
              toLocation: true
            }
          }
        }
      })

      return updatedBatch
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[PUTAWAY_BATCH_DELETE] Error:', error)
    return NextResponse.json(
      {
        error: "Failed to undo putaway batch",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
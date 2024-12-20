import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { TransactionType, Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { locationLabel, items } = body

    const result = await prisma.$transaction(async (tx) => {
      const location = await tx.location.findFirst({
        where: { label: locationLabel }
      })

      if (!location) {
        throw new Error(`Location ${locationLabel} not found`)
      }

      // Create putaway batch record
      const putawayBatch = await tx.putawayBatch.create({
        data: {
          location: {
            connect: {
              id: location.id
            }
          }
        }
      })

      const records = []
      for (const item of items) {
        // Create or update stock record
        const stockRecord = await tx.stock.upsert({
          where: {
            itemId_locationId: {
              itemId: item.itemId,
              locationId: location.id,
            }
          },
          create: {
            itemId: item.itemId,
            locationId: location.id,
            quantity: item.quantity,
          },
          update: {
            quantity: {
              increment: item.quantity
            }
          }
        })

        // Create transaction record linked to batch
        const transaction = await tx.transaction.create({
          data: {
            type: TransactionType.ADD,
            quantity: item.quantity,
            itemId: item.itemId,
            toLocationId: location.id,
            putawayBatchId: putawayBatch.id
          },
          include: {
            item: true,
            toLocation: true,
          }
        })

        records.push({ stockRecord, transaction })
      }

      return {
        putawayBatch,
        records
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[PUTAWAY_BATCH] Error:', error)
    return NextResponse.json(
      { 
        error: "Failed to create records",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
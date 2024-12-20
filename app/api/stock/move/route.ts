import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { TransactionType } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fromLocation, toLocation, items } = body as {
      fromLocation: string
      toLocation: string
      items: { stockId: string; quantity: number }[]
    }

    // Validate request
    if (!fromLocation || !toLocation || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Process all items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get source and destination locations
      const [source, destination] = await Promise.all([
        tx.location.findFirst({
          where: { label: { equals: fromLocation, mode: 'insensitive' } }
        }),
        tx.location.findFirst({
          where: { label: { equals: toLocation, mode: 'insensitive' } }
        })
      ])

      if (!source || !destination) {
        throw new Error('Source or destination location not found')
      }

      const updates = []

      // Process each item
      for (const item of items) {
        // Get current stock record
        const sourceStock = await tx.stock.findUnique({
          where: { id: item.stockId },
          include: { item: true }
        })

        if (!sourceStock) {
          throw new Error(`Stock record ${item.stockId} not found`)
        }

        if (sourceStock.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity for ${sourceStock.item.name}. Available: ${sourceStock.quantity}, Requested: ${item.quantity}`
          )
        }

        // Update source stock
        const updatedSourceStock = await tx.stock.update({
          where: { id: item.stockId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        })

        // Update or create destination stock
        const destinationStock = await tx.stock.upsert({
          where: {
            itemId_locationId: {
              itemId: sourceStock.itemId,
              locationId: destination.id
            }
          },
          create: {
            itemId: sourceStock.itemId,
            locationId: destination.id,
            quantity: item.quantity
          },
          update: {
            quantity: {
              increment: item.quantity
            }
          }
        })

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            type: TransactionType.MOVE,
            quantity: item.quantity,
            itemId: sourceStock.itemId,
            fromLocationId: source.id,
            toLocationId: destination.id
          }
        })

        updates.push({
          sourceStock: updatedSourceStock,
          destinationStock,
          transaction
        })
      }

      return updates
    })

    return NextResponse.json({ success: true, updates: result })
  } catch (error: any) {
    console.error("[MOVE STOCK]", error)
    return NextResponse.json(
      {
        error: "Failed to move stock",
        details: error.message
      },
      { status: 500 }
    )
  }
} 
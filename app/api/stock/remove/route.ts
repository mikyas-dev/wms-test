import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items } = body as { items: { stockId: string; quantity: number }[] }

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body", details: "Items array is required" },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.stockId || typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          {
            error: "Invalid item data",
            details: "Each item must have a valid stockId and positive quantity",
          },
          { status: 400 }
        )
      }
    }

    // Process all items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updates = []

      // Check and update each stock record
      for (const item of items) {
        // Get current stock record
        const currentStock = await tx.stock.findUnique({
          where: { id: item.stockId },
          include: { item: true }
        })

        if (!currentStock) {
          throw new Error(`Stock record ${item.stockId} not found`)
        }

        if (currentStock.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity for ${currentStock.item.name}. Available: ${currentStock.quantity}, Requested: ${item.quantity}`
          )
        }

        // Update stock record
        const update = await tx.stock.update({
          where: { id: item.stockId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          },
          include: {
            item: true,
            location: true
          }
        })

        updates.push(update)
      }

      return updates
    })

    return NextResponse.json({ success: true, updates: result })
  } catch (error: any) {
    console.error("[REMOVE STOCK]", error)
    return NextResponse.json(
      {
        error: "Failed to remove stock",
        details: error.message
      },
      { status: 500 }
    )
  }
} 
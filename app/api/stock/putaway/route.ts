import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { itemId, locationLabel, quantity } = body

    // Validate input
    if (!itemId || !locationLabel || !quantity || quantity < 1) {
      return new NextResponse("Invalid input", { status: 400 })
    }

    // Get location by label
    const location = await prisma.location.findUnique({
      where: { label: locationLabel }
    })

    if (!location) {
      return new NextResponse("Location not found", { status: 404 })
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find or create stock record
      let stock = await tx.stock.findFirst({
        where: {
          itemId,
          locationId: location.id
        }
      })

      if (stock) {
        // Update existing stock
        stock = await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity + quantity }
        })
      } else {
        // Create new stock record
        stock = await tx.stock.create({
          data: {
            itemId,
            locationId: location.id,
            quantity
          }
        })
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          itemId,
          toLocationId: location.id,
          quantity,
          type: "ADD"
        }
      })

      return { stock, transaction }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in putaway:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
} 
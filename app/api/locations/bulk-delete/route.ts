import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { locationIds } = body

    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return new NextResponse("Invalid request body", { status: 400 })
    }

    // Check if any locations have stock
    const locationsWithStock = await prisma.stock.findMany({
      where: {
        locationId: {
          in: locationIds
        },
        quantity: {
          gt: 0
        }
      },
      include: {
        location: true
      }
    })

    if (locationsWithStock.length > 0) {
      const labels = locationsWithStock.map(s => s.location.label).join(", ")
      return new NextResponse(
        `Cannot delete locations with stock: ${labels}`,
        { status: 400 }
      )
    }

    // Delete locations in a transaction
    const result = await prisma.$transaction([
      // Delete any stock records (even with 0 quantity)
      prisma.stock.deleteMany({
        where: {
          locationId: {
            in: locationIds
          }
        }
      }),
      // Delete the locations
      prisma.location.deleteMany({
        where: {
          id: {
            in: locationIds
          }
        }
      })
    ])

    return NextResponse.json({ count: result[1].count })
  } catch (error) {
    console.error("Error deleting locations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
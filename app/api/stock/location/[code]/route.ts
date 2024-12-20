import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const locationCode = params.code
    console.log("GET /api/stock/location/[code] - Looking up stock for location:", locationCode)

    if (!locationCode) {
      console.log("No location code provided")
      return new NextResponse("Location code is required", { status: 400 })
    }

    // First find the location
    const location = await prisma.location.findFirst({
      where: {
        label: {
          equals: locationCode,
          mode: 'insensitive'
        }
      }
    })

    console.log("Found location:", location)

    if (!location) {
      return new NextResponse("Location not found", { status: 404 })
    }

    // Then find all stock in this location
    const stock = await prisma.stock.findMany({
      where: {
        locationId: location.id,
      },
      include: {
        item: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        item: {
          sku: 'asc'
        }
      }
    })

    // Filter out zero quantity items from the response
    const nonZeroStock = stock.filter(item => item.quantity > 0)

    console.log("Found stock items:", nonZeroStock.length)
    console.log("Stock details:", nonZeroStock)

    return NextResponse.json(nonZeroStock)
  } catch (error) {
    console.error("Error looking up stock:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
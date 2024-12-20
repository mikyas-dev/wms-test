import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const locationCode = params.code
    console.log("GET /api/locations/[code] - Looking up location:", locationCode)

    if (!locationCode) {
      console.log("No location code provided")
      return NextResponse.json({ error: "Location code is required" }, { status: 400 })
    }

    // Find the location
    const location = await prisma.location.findFirst({
      where: { 
        label: {
          equals: locationCode,
          mode: 'insensitive' // Case-insensitive match
        }
      }
    })

    console.log("Location lookup result:", location)

    if (!location) {
      // Try to find by individual parts if exact match fails
      const parts = locationCode.split('-')
      if (parts.length === 3) {
        const [aisle, bay, height] = parts
        const alternativeLocation = await prisma.location.findFirst({
          where: {
            aisle: { equals: aisle, mode: 'insensitive' },
            bay: { equals: bay, mode: 'insensitive' },
            height: { equals: height, mode: 'insensitive' }
          }
        })
        console.log("Alternative location lookup result:", alternativeLocation)
        
        if (alternativeLocation) {
          return NextResponse.json(alternativeLocation)
        }
      }
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error looking up location:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 
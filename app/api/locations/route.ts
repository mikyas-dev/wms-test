import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Validate location code format: YY-XX-ZZ where:
// YY = one or two letters
// XX = two digits
// ZZ = two digits
function isValidLocationCode(code: string): boolean {
  const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
  return pattern.test(code)
}

function parseLocationCode(code: string) {
  const [aisle, bay, height] = code.split('-')
  return { aisle: aisle.toUpperCase(), bay, height }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationCode = searchParams.get('code')
    
    console.log("GET /api/locations - Looking up location:", locationCode)

    if (!locationCode) {
      console.log("No location code provided")
      return NextResponse.json({ error: "Location code is required" }, { status: 400 })
    }

    if (!isValidLocationCode(locationCode)) {
      console.log("Invalid location code format:", locationCode)
      return NextResponse.json({ 
        error: "Invalid location code format. Expected format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)" 
      }, { status: 400 })
    }

    // Find the location
    const location = await prisma.location.findFirst({
      where: { 
        label: {
          equals: locationCode.toUpperCase(),
          mode: 'insensitive'
        }
      }
    })

    console.log("Location lookup result:", location)

    if (!location) {
      // Auto-create the location if it doesn't exist
      const { aisle, bay, height } = parseLocationCode(locationCode)
      const newLocation = await prisma.location.create({
        data: {
          aisle,
          bay,
          height,
          label: locationCode.toUpperCase(),
          type: "BAY" // Default type for auto-created locations
        }
      })
      
      console.log("Auto-created new location:", newLocation)
      return NextResponse.json(newLocation)
    }

    return NextResponse.json(location)

  } catch (error) {
    console.error("Error looking up location:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("POST /api/locations - Creating location:", body)

    const { aisle, bay, height, label, type } = body

    // Validate required fields
    if (!aisle || !bay || !height || !label || !type) {
      console.log("Missing required fields:", { aisle, bay, height, label, type })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if location with label already exists
    const existing = await prisma.location.findUnique({
      where: { label }
    })

    if (existing) {
      console.log("Location already exists:", existing)
      return NextResponse.json({ error: "Location with this label already exists" }, { status: 409 })
    }

    // Create new location
    const location = await prisma.location.create({
      data: {
        aisle,
        bay,
        height,
        label,
        type
      }
    })

    console.log("Created new location:", location)
    return NextResponse.json(location)
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 
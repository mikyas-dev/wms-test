import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { locations } = body

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return new NextResponse("Invalid request body", { status: 400 })
    }

    // Create all locations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const created = []

      for (const location of locations) {
        // Check if location already exists
        const existing = await tx.location.findUnique({
          where: { label: location.label }
        })

        if (!existing) {
          const newLocation = await tx.location.create({
            data: location
          })
          created.push(newLocation)
        }
      }

      return created
    })

    return NextResponse.json({ count: result.length, locations: result })
  } catch (error) {
    console.error("Error creating locations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const label = searchParams.get('label')

    if (!label) {
      return NextResponse.json(
        { error: "Location label is required" },
        { status: 400 }
      )
    }

    console.log("[LOCATION_VALIDATE] Looking up location:", label)

    const location = await prisma.location.findFirst({
      where: {
        label: {
          equals: label,
          mode: 'insensitive'
        }
      }
    })

    console.log("[LOCATION_VALIDATE] Location lookup result:", location)

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("[LOCATION_VALIDATE] Error:", error)
    return NextResponse.json(
      { error: "Failed to validate location" },
      { status: 500 }
    )
  }
} 
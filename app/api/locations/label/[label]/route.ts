import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { label: string } }
) {
  const label = params.label

  try {
    const location = await prisma.location.findUnique({
      where: {
        label: label
      }
    })

    if (!location) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error fetching location:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Try to count locations as a simple test
    const count = await prisma.location.count()
    return NextResponse.json({ message: "Database connected!", count })
  } catch (error) {
    console.error("Database connection error:", error)
    return new NextResponse("Database connection failed", { status: 500 })
  }
} 
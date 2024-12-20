import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/companies - List all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        code: true
      },
      orderBy: {
        code: 'asc'
      }
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Failed to fetch companies:", error)
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create a new company
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { error: "Company code is required" },
        { status: 400 }
      )
    }

    // Check for existing company with same code
    const existing = await prisma.company.findUnique({
      where: {
        code: code.toUpperCase()
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "A company with this code already exists" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        code: code.toUpperCase()
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to create company:", error)
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PUT /api/companies/[id] - Update a company
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check for existing company with same code (excluding current company)
    const existing = await prisma.company.findFirst({
      where: {
        code: code.toUpperCase(),
        NOT: {
          id: params.id
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "A company with this code already exists" },
        { status: 400 }
      )
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        code: code.toUpperCase()
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to update company:", error)
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if company has any associated items
    const itemCount = await prisma.item.count({
      where: { companyId: params.id }
    })

    if (itemCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with existing items" },
        { status: 400 }
      )
    }

    await prisma.company.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete company:", error)
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku, name, barcode, companyId } = body

    // Validate required fields
    if (!sku || !name || !barcode || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if item with barcode already exists
    const existingItem = await prisma.item.findFirst({
      where: { barcode }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: `Item with barcode "${barcode}" already exists` },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingSku = await prisma.item.findFirst({
      where: { sku }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: `Item with SKU "${sku}" already exists` },
        { status: 400 }
      )
    }

    // Create new item
    const item = await prisma.item.create({
      data: {
        sku,
        name,
        barcode,
        companyId
      },
      include: {
        company: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    )
  }
} 
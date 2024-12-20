import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { Prisma } from "@prisma/client"

// Use Prisma's inferred types
type ItemWithCompany = Prisma.ItemGetPayload<{
  include: { company: true }
}>

export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
) {
  const barcode = params.barcode
  console.log(`[BARCODE_SCAN] Processing barcode: ${barcode}`)

  try {
    const items = await prisma.item.findMany({
      where: { barcode },
      include: { company: true }
    })

    console.log(`[BARCODE_SCAN] Found ${items.length} items for barcode ${barcode}`)

    if (items.length === 0) {
      console.log(`[BARCODE_SCAN] No items found for barcode ${barcode}`)
      return new Response(null, { status: 404 })
    }

    return Response.json(items[0])
  } catch (error) {
    console.error(`[BARCODE_SCAN] Error processing barcode ${barcode}:`, error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 
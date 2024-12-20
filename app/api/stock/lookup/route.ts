import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku')
    const companyId = searchParams.get('companyId')

    if (!sku && !companyId) {
      return new NextResponse("Either SKU or company ID is required", { status: 400 })
    }

    const stock = await prisma.stock.findMany({
      where: {
        quantity: {
          gt: 0
        },
        item: {
          ...(sku ? {
            sku: {
              contains: sku,
              mode: 'insensitive'
            }
          } : {}),
          ...(companyId ? {
            companyId: companyId
          } : {})
        }
      },
      include: {
        item: {
          include: {
            company: true
          }
        },
        location: true
      },
      orderBy: [
        {
          item: {
            sku: 'asc'
          }
        },
        {
          location: {
            label: 'asc'
          }
        }
      ]
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error("Error looking up stock:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
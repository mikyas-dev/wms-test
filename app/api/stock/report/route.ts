import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return new NextResponse("Company ID is required", { status: 400 })
    }

    // Get all stock for the company
    const stock = await prisma.stock.findMany({
      where: {
        item: {
          companyId: companyId
        }
      },
      include: {
        item: true,
        location: true
      }
    })

    // Group stock by SKU to get total quantities
    const stockSummary = stock.reduce((acc, curr) => {
      const key = curr.item.sku
      if (!acc[key]) {
        acc[key] = {
          sku: curr.item.sku,
          name: curr.item.name,
          totalQuantity: 0,
          locations: []
        }
      }
      acc[key].totalQuantity += curr.quantity
      if (curr.quantity > 0) {
        acc[key].locations.push(`${curr.location.label} (${curr.quantity})`)
      }
      return acc
    }, {} as Record<string, { sku: string; name: string; totalQuantity: number; locations: string[] }>)

    // Convert to CSV
    const csvRows = [
      ['SKU', 'Name', 'Total Quantity', 'Locations']
    ]

    Object.values(stockSummary).forEach(item => {
      csvRows.push([
        item.sku,
        item.name,
        item.totalQuantity.toString(),
        item.locations.join(', ')
      ])
    })

    const csv = csvRows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n')

    // Return as CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=stock-report-${new Date().toISOString().split('T')[0]}.csv`
      }
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 
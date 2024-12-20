import { prisma } from "@/lib/db"
import { StockSummaryTable } from "@/components/stock-summary-table"

export default async function StockSummaryPage() {
  // Get all stock with related items and locations
  const stock = await prisma.stock.findMany({
    include: {
      item: {
        include: {
          company: true
        }
      },
      location: true
    },
    orderBy: [
      { location: { label: 'asc' } },
      { item: { company: { code: 'asc' } } },
      { item: { sku: 'asc' } }
    ]
  })

  // Group by location for better visualization
  const stockByLocation = stock.reduce((acc, curr) => {
    const locationLabel = curr.location.label
    if (!acc[locationLabel]) {
      acc[locationLabel] = []
    }
    acc[locationLabel].push(curr)
    return acc
  }, {} as Record<string, typeof stock>)

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">Stock Summary</h1>
      <StockSummaryTable stockByLocation={stockByLocation} />
    </div>
  )
} 
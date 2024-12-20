import { prisma } from "@/lib/db"
import { StockLookup } from "@/components/stock-lookup"

export default async function StockLookupPage() {
  // Get all companies for the dropdown
  const companies = await prisma.company.findMany({
    orderBy: {
      code: 'asc'
    }
  })

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold mb-6">Stock Lookup</h1>
      <StockLookup companies={companies} />
    </div>
  )
} 
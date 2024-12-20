import { prisma } from "@/lib/db"
import { RemoveStockSelection } from "@/components/remove-stock-selection"
import { notFound } from "next/navigation"

export default async function RemoveStockSelectionPage({
  params
}: {
  params: { bay: string }
}) {
  // First find the location
  const location = await prisma.location.findFirst({
    where: {
      label: {
        equals: params.bay,
        mode: 'insensitive'
      }
    }
  })

  if (!location) {
    notFound()
  }

  const stock = await prisma.stock.findMany({
    where: {
      locationId: location.id,
      quantity: {
        gt: 0 // Only show items with stock
      }
    },
    include: {
      item: {
        include: {
          company: true
        }
      }
    }
  })

  if (stock.length === 0) {
    notFound()
  }

  return (
    <div className="container max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Remove Stock from {params.bay}</h1>
      <RemoveStockSelection stock={stock} bayCode={params.bay} />
    </div>
  )
} 
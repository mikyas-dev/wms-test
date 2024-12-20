import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { MoveItemsForm } from "@/components/move-items-form"

interface Props {
  searchParams: {
    location?: string
  }
}

export default async function MoveItemsPage({ searchParams }: Props) {
  const { location } = searchParams

  if (!location) {
    notFound()
  }

  // Fetch stock in this location
  const stock = await prisma.stock.findMany({
    where: {
      location: {
        label: {
          equals: location,
          mode: 'insensitive'
        }
      },
      quantity: {
        gt: 0
      }
    },
    include: {
      item: {
        select: {
          id: true,
          sku: true,
          name: true,
          barcode: true
        }
      },
      location: {
        select: {
          id: true,
          label: true
        }
      }
    },
    orderBy: {
      item: {
        sku: 'asc'
      }
    }
  })

  if (stock.length === 0) {
    notFound()
  }

  return <MoveItemsForm location={location} initialStock={stock} />
} 
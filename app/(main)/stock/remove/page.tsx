import { prisma } from "@/lib/db"
import { RemoveStockForm } from "@/components/remove-stock-form"
import { RemoveItemsForm } from "@/components/remove-items-form"
import { Button } from "@/components/ui/button"

// Validate location code format
function isValidLocationCode(code: string): boolean {
  const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
  return pattern.test(code)
}

// Mark this page as dynamic to handle query parameters
export const dynamic = 'force-dynamic'

export default async function RemoveStockPage({
  searchParams
}: {
  searchParams: { location?: string }
}) {
  console.log("[REMOVE PAGE] Rendering with params:", searchParams)

  // If no location parameter, show the initial remove form
  if (!searchParams.location) {
    console.log("[REMOVE PAGE] No location parameter, showing initial form")
    return (
      <div className="w-full py-6">
        <h1 className="text-2xl font-bold mb-6">Remove Stock</h1>
        <RemoveStockForm />
      </div>
    )
  }

  const locationCode = searchParams.location.toUpperCase()
  console.log("[REMOVE PAGE] Processing location:", locationCode)

  // Validate location format
  if (!isValidLocationCode(locationCode)) {
    console.log("[REMOVE PAGE] Invalid location format:", locationCode)
    return (
      <div className="w-full py-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Location Format</h1>
        <p className="mb-4">The location code must be in the format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)</p>
        <Button variant="outline" asChild>
          <a href="/stock/remove">Go Back</a>
        </Button>
      </div>
    )
  }

  try {
    console.log("[REMOVE PAGE] Looking up location in database:", locationCode)
    // Find the location
    const location = await prisma.location.findFirst({
      where: { 
        label: {
          equals: locationCode,
          mode: 'insensitive'
        }
      }
    })

    console.log("[REMOVE PAGE] Location lookup result:", location)

    if (!location) {
      console.log("[REMOVE PAGE] Location not found:", locationCode)
      return (
        <div className="w-full py-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Location Not Found</h1>
          <p className="mb-4">The scanned location does not exist in the system.</p>
          <Button variant="outline" asChild>
            <a href="/stock/remove">Go Back</a>
          </Button>
        </div>
      )
    }

    // Get stock in this location
    const stock = await prisma.stock.findMany({
      where: {
        locationId: location.id,
        quantity: {
          gt: 0
        }
      },
      include: {
        item: true,
        location: true
      }
    })

    if (stock.length === 0) {
      console.log("[REMOVE PAGE] No stock found in location:", locationCode)
      return (
        <div className="w-full py-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">No Stock Found</h1>
          <p className="mb-4">There is no stock in this location.</p>
          <Button variant="outline" asChild>
            <a href="/stock/remove">Go Back</a>
          </Button>
        </div>
      )
    }

    console.log("[REMOVE PAGE] Rendering RemoveItemsForm with location:", locationCode)
    return (
      <div className="w-full">
        <RemoveItemsForm location={locationCode} initialStock={stock} />
      </div>
    )
  } catch (error: any) {
    console.error("[REMOVE PAGE] Error:", error)
    return (
      <div className="w-full py-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="mb-4">Failed to process location. Please try again.</p>
        <p className="text-sm text-gray-600 mb-4">Error: {error.message}</p>
        <Button variant="outline" asChild>
          <a href="/stock/remove">Go Back</a>
        </Button>
      </div>
    )
  }
} 
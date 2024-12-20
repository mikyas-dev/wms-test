import { prisma } from "@/lib/db"
import { PutawayItemsForm } from "@/components/putaway-items-form"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

// Validate location code format
function isValidLocationCode(code: string): boolean {
  const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
  return pattern.test(code)
}

export async function PutawayBayHandler({ bay }: { bay: string }) {
  const normalizedBay = bay.toUpperCase()
  console.log("[PUTAWAY DEBUG] Processing bay location:", normalizedBay)

  // Validate bay format
  if (!isValidLocationCode(normalizedBay)) {
    console.log("[PUTAWAY DEBUG] Invalid bay format:", normalizedBay)
    return (
      <div className="container max-w-xl py-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Location Format</h1>
        <p className="mb-4">The location code must be in the format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)</p>
        <Button variant="outline" asChild>
          <a href="/stock/putaway">Go Back</a>
        </Button>
      </div>
    )
  }

  try {
    console.log("[PUTAWAY DEBUG] Attempting database lookup for bay:", normalizedBay)
    
    // First find the location
    let location = await prisma.location.findFirst({
      where: { 
        label: {
          equals: normalizedBay,
          mode: 'insensitive'
        }
      }
    })

    console.log("[PUTAWAY DEBUG] Location lookup result:", JSON.stringify(location))

    // If location doesn't exist, create it
    if (!location) {
      console.log("[PUTAWAY DEBUG] Location not found, creating new location:", normalizedBay)
      const [aisle, bayNum, height] = normalizedBay.split('-')
      
      try {
        location = await prisma.location.create({
          data: {
            aisle,
            bay: bayNum,
            height,
            label: normalizedBay,
            type: "BAY"
          }
        })
        console.log("[PUTAWAY DEBUG] Successfully created new location:", JSON.stringify(location))
      } catch (createError: any) {
        console.error("[PUTAWAY DEBUG] Error creating location:", createError)
        throw createError
      }
    }

    console.log("[PUTAWAY DEBUG] Rendering PutawayItemsForm with bay:", normalizedBay)
    return (
      <div className="container max-w-xl py-6">
        <PutawayItemsForm location={normalizedBay} />
      </div>
    )
  } catch (error: any) {
    // Log the full error
    console.error("[PUTAWAY DEBUG] Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return (
      <div className="container max-w-xl py-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="mb-4">Failed to process location. Please try again.</p>
        <p className="text-sm text-gray-600 mb-4">Error: {error.message}</p>
        <Button variant="outline" asChild>
          <a href="/stock/putaway">Go Back</a>
        </Button>
      </div>
    )
  }
} 
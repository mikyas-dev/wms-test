import { prisma } from "@/lib/db"
import { PutawayItemsForm } from "@/components/putaway-items-form"
import { PutawayForm } from "@/components/putaway-form"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

// Validate location code format
function isValidLocationCode(code: string): boolean {
  const pattern = /^[A-Za-z]{1,2}-\d{2}-\d{2}$/
  return pattern.test(code)
}

// Mark this page as dynamic to handle query parameters
export const dynamic = 'force-dynamic'

export default async function PutawayPage({
  searchParams
}: {
  searchParams: { location?: string }
}) {
  console.log("[PUTAWAY PAGE] Rendering with params:", searchParams)

  // If no location parameter, show the initial putaway form
  if (!searchParams.location) {
    console.log("[PUTAWAY PAGE] No location parameter, showing initial form")
    return (
      <div className="w-full py-6">
        <h1 className="text-2xl font-bold mb-6">Putaway</h1>
        <PutawayForm />
      </div>
    )
  }

  const locationCode = searchParams.location.toUpperCase()
  console.log("[PUTAWAY PAGE] Processing location:", locationCode)

  // Validate location format
  if (!isValidLocationCode(locationCode)) {
    console.log("[PUTAWAY PAGE] Invalid location format:", locationCode)
    return (
      <div className="w-full py-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Location Format</h1>
        <p className="mb-4">The location code must be in the format: YY-XX-ZZ (e.g., A-01-02 or AB-01-02)</p>
        <Button variant="outline" asChild>
          <a href="/stock/putaway">Go Back</a>
        </Button>
      </div>
    )
  }

  try {
    console.log("[PUTAWAY PAGE] Looking up location in database:", locationCode)
    // First find the location
    let location = await prisma.location.findFirst({
      where: { 
        label: {
          equals: locationCode,
          mode: 'insensitive'
        }
      }
    })

    console.log("[PUTAWAY PAGE] Location lookup result:", location)

    // If location doesn't exist, create it
    if (!location) {
      console.log("[PUTAWAY PAGE] Creating new location:", locationCode)
      const [aisle, bay, height] = locationCode.split('-')
      
      try {
        location = await prisma.location.create({
          data: {
            aisle,
            bay,
            height,
            label: locationCode,
            type: "BAY"
          }
        })
        console.log("[PUTAWAY PAGE] Created new location:", location)
      } catch (createError: any) {
        console.error("[PUTAWAY PAGE] Error creating location:", createError)
        return (
          <div className="w-full py-6">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error Creating Location</h1>
            <p className="mb-4">Failed to create location. Please try again.</p>
            <p className="text-sm text-gray-600 mb-4">Error: {createError.message}</p>
            <Button variant="outline" asChild>
              <a href="/stock/putaway">Go Back</a>
            </Button>
          </div>
        )
      }
    }

    console.log("[PUTAWAY PAGE] Rendering PutawayItemsForm with location:", locationCode)
    return (
      <div className="w-full py-6">
        <PutawayItemsForm location={locationCode} />
      </div>
    )
  } catch (error: any) {
    console.error("[PUTAWAY PAGE] Error:", error)
    return (
      <div className="w-full py-6">
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
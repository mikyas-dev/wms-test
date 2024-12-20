import { prisma } from "@/lib/db"
import { LocationsTable } from "@/components/locations-table"
import { CreateLocationsForm } from "@/components/create-locations-form"

export default async function LocationsPage() {
  // Fetch all locations
  const locations = await prisma.location.findMany({
    orderBy: [
      { aisle: 'asc' },
      { bay: 'asc' },
      { height: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Locations</h1>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Create Locations</h2>
        <CreateLocationsForm />
      </div>

      <div className="rounded-lg border">
        <LocationsTable locations={locations} />
      </div>
    </div>
  )
} 
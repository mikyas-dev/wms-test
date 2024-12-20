import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"

async function retryOperation<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      if (attempt === maxAttempts || !error.message?.includes('Server has closed the connection')) {
        throw error
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
  throw new Error('Failed after max attempts')
}

async function getStats() {
  try {
    // Ensure connection is alive
    await prisma.$connect()
    
    const [itemCount, locationCount, stockCount, totalQuantity] = await Promise.all([
      retryOperation(() => prisma.item.count()),
      retryOperation(() => prisma.location.count()),
      retryOperation(() => prisma.stock.count()),
      retryOperation(() => 
        prisma.stock.aggregate({
          _sum: {
            quantity: true
          }
        })
      )
    ])

    return {
      itemCount,
      locationCount,
      stockCount,
      totalQuantity: totalQuantity._sum.quantity || 0
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    // Return default values if there's an error
    return {
      itemCount: 0,
      locationCount: 0,
      stockCount: 0,
      totalQuantity: 0
    }
  }
}

export async function StatsCards() {
  const stats = await getStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.itemCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.locationCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.stockCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalQuantity}</div>
        </CardContent>
      </Card>
    </div>
  )
} 
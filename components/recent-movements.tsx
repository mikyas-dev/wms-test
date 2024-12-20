import { prisma } from "@/lib/db"

type TransactionType = 'PUTAWAY' | 'REMOVAL'

interface Transaction {
  id: string
  type: TransactionType
  quantity: number
  bayCode: string
  createdAt: Date
  item: {
    company: {
      code: string
    }
    name: string
    sku: string
  }
}

async function retryOperation<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      if (attempt === maxAttempts || !error.message?.includes('Server has closed the connection')) {
        throw error
      }
      console.log(`Attempt ${attempt} failed, retrying in ${attempt} seconds...`)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
  throw new Error('Failed after max attempts')
}

async function getMovements() {
  try {
    // Ensure connection is alive
    await prisma.$connect()
    
    const movements = await retryOperation(() => 
      prisma.transaction.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          item: {
            include: {
              company: true
            }
          }
        }
      })
    )

    return movements as unknown as Transaction[]
  } catch (error) {
    console.error('Failed to fetch movements:', error)
    return [] // Return empty array if there's an error
  }
}

export async function RecentMovements() {
  const movements = await getMovements()

  if (!movements.length) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Recent Movements</div>
        <div className="text-sm text-gray-500">No recent movements</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Recent Movements</div>
      <div className="grid gap-4">
        {movements.map((movement) => (
          <div
            key={movement.id}
            className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {movement.item.company.code} - {movement.item.sku}
                </div>
                <div className="text-sm text-gray-500">
                  {movement.item.name}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Qty: {movement.quantity}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {movement.type === 'PUTAWAY' ? 'Putaway to' : 'Removed from'}{' '}
              {movement.bayCode}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(movement.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
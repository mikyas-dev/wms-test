interface Stock {
  id: string
  quantity: number
  location: {
    label: string
  }
  item: {
    id: string
    sku: string
    name: string
    company: {
      code: string
    }
  }
}

interface StockSummaryTableProps {
  stockByLocation: Record<string, Stock[]>
}

export function StockSummaryTable({ stockByLocation }: StockSummaryTableProps) {
  return (
    <div className="space-y-8">
      {Object.entries(stockByLocation).map(([location, items]) => (
        <div key={location} className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">Location: {location}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">SKU</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((stock) => (
                  <tr key={stock.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{stock.item.company.code}</td>
                    <td className="px-4 py-2">{stock.item.sku}</td>
                    <td className="px-4 py-2">{stock.item.name}</td>
                    <td className="px-4 py-2 text-right">{stock.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
} 
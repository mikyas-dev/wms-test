import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StockPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Stock Management</h1>
      <div className="grid gap-4">
        <Button asChild className="w-full">
          <Link href="/stock/putaway">Putaway Stock</Link>
        </Button>
        <Button asChild className="w-full">
          <Link href="/stock/remove">Remove Stock</Link>
        </Button>
        <Button asChild className="w-full">
          <Link href="/stock/move">Move Stock</Link>
        </Button>
        <Button asChild className="w-full">
          <Link href="/stock/lookup">Stock Lookup</Link>
        </Button>
      </div>
    </>
  )
} 
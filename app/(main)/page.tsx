import { Suspense } from "react"
import { StatsCards } from "@/components/stats-cards"
import { RecentMovements } from "@/components/recent-movements"

export default async function HomePage() {
  return (
    <div className="w-full py-6">
      <div className="space-y-8">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <Suspense fallback={<RecentMovementsSkeleton />}>
          <RecentMovements />
        </Suspense>
      </div>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
        </div>
      ))}
    </div>
  )
}

function RecentMovementsSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-col space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
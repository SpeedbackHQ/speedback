import { Skeleton } from '@/components/ui/Skeleton'

export default function BillingLoading() {
  return (
    <div>
      <Skeleton.Line width="w-56" className="h-7 mb-6" />

      {/* Current Plan skeleton */}
      <div className="mb-8">
        <Skeleton.Line width="w-28" className="h-5 mb-4" />
        <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg p-6 border border-violet-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton.Line width="w-24" className="h-7" />
              <Skeleton.Line width="w-40" className="h-4" />
            </div>
            <Skeleton.Line width="w-20" className="h-8" />
          </div>
        </div>
      </div>

      {/* Usage skeleton */}
      <div className="mb-8">
        <Skeleton.Line width="w-16" className="h-5 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton.Stat />
          <Skeleton.Stat />
        </div>
      </div>
    </div>
  )
}

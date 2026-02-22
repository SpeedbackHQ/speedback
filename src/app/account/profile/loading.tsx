import { Skeleton } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
  return (
    <div>
      <Skeleton.Line width="w-32" className="h-7 mb-6" />

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Display Name field skeleton */}
        <div>
          <Skeleton.Line width="w-24" className="h-4 mb-2" />
          <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Email field skeleton */}
        <div>
          <Skeleton.Line width="w-16" className="h-4 mb-2" />
          <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
          <Skeleton.Line width="w-48" className="h-3 mt-1" />
        </div>

        {/* Save button skeleton */}
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

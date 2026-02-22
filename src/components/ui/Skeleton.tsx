interface SkeletonLineProps {
  className?: string
  width?: string
}

function SkeletonLine({ className = '', width = 'w-full' }: SkeletonLineProps) {
  return (
    <div className={`h-4 bg-slate-200 rounded animate-pulse ${width} ${className}`} />
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
      <div className="space-y-3">
        <SkeletonLine width="w-3/4" />
        <SkeletonLine width="w-1/2" className="h-3" />
      </div>
    </div>
  )
}

function SkeletonStat({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-2" />
      <SkeletonLine width="w-24" className="h-3" />
    </div>
  )
}

function SkeletonSurveyRow({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between ${className}`}>
      <div className="space-y-2 flex-1">
        <SkeletonLine width="w-1/3" className="h-5" />
        <SkeletonLine width="w-1/4" className="h-3" />
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="h-7 w-10 bg-slate-200 rounded animate-pulse mb-1" />
          <SkeletonLine width="w-16" className="h-3" />
        </div>
        <div className="h-7 w-16 bg-slate-200 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export const Skeleton = {
  Line: SkeletonLine,
  Card: SkeletonCard,
  Stat: SkeletonStat,
  SurveyRow: SkeletonSurveyRow,
}

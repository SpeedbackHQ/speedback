import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton.Line width="w-40" className="h-7" />
          <Skeleton.Line width="w-28" className="h-4" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <div className="grid gap-4">
        <Skeleton.SurveyRow />
        <Skeleton.SurveyRow />
        <Skeleton.SurveyRow />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-8">
        <Skeleton.Stat />
        <Skeleton.Stat />
        <Skeleton.Stat />
      </div>
    </div>
  )
}

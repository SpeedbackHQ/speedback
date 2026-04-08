import { CreateSurveyButton } from '@/components/CreateSurveyButton'
import { SurveyDashboard } from '@/components/SurveyDashboard'
import { getUser, createServerSupabaseClient } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getSurveys(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*, responses(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching surveys:', error)
    return []
  }

  return surveys || []
}

export default async function AdminDashboard() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const surveys = await getSurveys(user.id)

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Your Surveys</h1>
          <p className="text-slate-500 mt-1">{surveys.length} survey{surveys.length !== 1 ? 's' : ''} created</p>
        </div>
        {surveys.length > 0 && (
          <CreateSurveyButton
            className="bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-600 transition-all shadow-md shadow-violet-200"
          >
            + New Survey
          </CreateSurveyButton>
        )}
      </div>

      <SurveyDashboard surveys={surveys} />

      {/* Quick stats cards */}
      {surveys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover">
            <div className="text-3xl font-bold text-violet-500">{surveys.length}</div>
            <div className="text-slate-500 font-medium mt-1">Total Surveys</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover">
            <div className="text-3xl font-bold text-emerald-600">
              {surveys.filter(s => s.is_active).length}
            </div>
            <div className="text-slate-500 font-medium mt-1">Active Surveys</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover">
            <div className="text-3xl font-bold text-amber-600">
              {surveys.reduce((acc, s) => {
                const count = Array.isArray(s.responses)
                  ? s.responses.length
                  : (s.responses as { count: number })?.count ?? 0
                return acc + count
              }, 0)}
            </div>
            <div className="text-slate-500 font-medium mt-1">Total Responses</div>
          </div>
        </div>
      )}
      {/* Community links */}
      <div className="mt-8 flex flex-wrap gap-3">
        {process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL && (
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Request a feature / Report a bug
          </a>
        )}
        {process.env.NEXT_PUBLIC_DONATION_URL && (
          <a
            href={process.env.NEXT_PUBLIC_DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            ❤️ Support SpeedBack
          </a>
        )}
      </div>
    </div>
  )
}

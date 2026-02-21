import Link from 'next/link'
import { CreateSurveyButton } from '@/components/CreateSurveyButton'
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

      {surveys.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center card-hover">
          <div className="text-6xl mb-4 animate-bounce-subtle">📝</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No surveys yet</h2>
          <p className="text-slate-500 mb-6 font-medium">Create your first gamified feedback survey!</p>
          <CreateSurveyButton
            className="inline-block bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold hover-lift hover:bg-violet-600 transition-all shadow-md shadow-violet-200"
          >
            Create Survey
          </CreateSurveyButton>
        </div>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey, index) => {
            const responseCount = Array.isArray(survey.responses)
              ? survey.responses.length
              : (survey.responses as { count: number })?.count ?? 0

            return (
              <Link
                key={survey.id}
                href={`/admin/surveys/${survey.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover flex items-center justify-between group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-violet-500 transition-colors break-words line-clamp-2">
                    {survey.title}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    Created {new Date(survey.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-500">{responseCount}</div>
                    <div className="text-slate-500 text-sm font-medium">responses</div>
                  </div>
                  <div
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      survey.is_active
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {survey.is_active ? 'Active' : 'Paused'}
                  </div>
                  <div className="text-slate-300 text-xl group-hover:text-violet-400 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

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
    </div>
  )
}

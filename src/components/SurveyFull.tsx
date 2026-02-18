'use client'

const STARTER_LINK = process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK || '/pricing'
const EVENT_LINK = process.env.NEXT_PUBLIC_STRIPE_EVENT_LINK || '/pricing'

interface SurveyFullProps {
  surveyTitle: string
}

export function SurveyFull({ surveyTitle }: SurveyFullProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #F8F7FF 0%, #EFF6FF 50%, #F0FDFF 100%)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-6">📋</div>

        <h1 className="text-2xl font-outfit font-bold mb-3" style={{ color: '#0F172A' }}>
          Survey complete
        </h1>

        <p className="font-manrope text-base mb-2" style={{ color: '#475569' }}>
          <span className="font-semibold">{surveyTitle}</span> has reached its response limit.
        </p>

        <p className="font-manrope text-sm mb-8" style={{ color: '#94A3B8' }}>
          Thanks for trying — this survey can&apos;t accept more responses right now.
        </p>

        {/* Upgrade prompt for the survey owner who might see this */}
        <div className="bg-white rounded-2xl p-6 text-left mb-6" style={{ border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 4px 16px rgba(139, 92, 246, 0.08)' }}>
          <p className="font-outfit font-semibold text-sm mb-1" style={{ color: '#8B5CF6' }}>
            Are you the survey owner?
          </p>
          <p className="font-manrope text-sm mb-4" style={{ color: '#64748B' }}>
            Upgrade to collect unlimited responses.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={STARTER_LINK}
              className="w-full text-center py-2.5 px-4 rounded-xl font-outfit font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#8B5CF6', color: 'white' }}
            >
              Starter — $19/month
            </a>
            <a
              href={EVENT_LINK}
              className="w-full text-center py-2.5 px-4 rounded-xl font-outfit font-semibold text-sm border-2 transition-all hover:bg-slate-50"
              style={{ borderColor: '#E2E8F0', color: '#475569' }}
            >
              Per Event — $15
            </a>
          </div>
        </div>

        <p className="font-manrope text-xs" style={{ color: '#CBD5E1' }}>
          Powered by SpeedBack ⚡
        </p>
      </div>
    </div>
  )
}

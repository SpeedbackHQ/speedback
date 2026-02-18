'use client'

interface SurveyClosedProps {
  surveyTitle: string
}

export function SurveyClosed({ surveyTitle }: SurveyClosedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #F8F7FF 0%, #EFF6FF 50%, #F0FDFF 100%)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-6">🔒</div>

        <h1 className="text-2xl font-outfit font-bold mb-3" style={{ color: '#0F172A' }}>
          Survey closed
        </h1>

        <p className="font-manrope text-base mb-2" style={{ color: '#475569' }}>
          <span className="font-semibold">{surveyTitle}</span> is no longer accepting responses.
        </p>

        <p className="font-manrope text-sm mb-8" style={{ color: '#94A3B8' }}>
          The survey organiser has closed this survey.
        </p>

        <p className="font-manrope text-xs" style={{ color: '#CBD5E1' }}>
          Powered by SpeedBack ⚡
        </p>
      </div>
    </div>
  )
}

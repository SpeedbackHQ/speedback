'use client'

import { validatePassword } from '@/lib/validation'

const strengthColors = {
  weak: 'bg-red-400',
  fair: 'bg-amber-400',
  strong: 'bg-emerald-400',
}

const strengthLabels = {
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
}

const strengthWidths = {
  weak: 'w-1/3',
  fair: 'w-2/3',
  strong: 'w-full',
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const { strength, checks } = validatePassword(password)

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]} ${strengthWidths[strength]}`}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength === 'weak' ? 'text-red-500' :
          strength === 'fair' ? 'text-amber-500' :
          'text-emerald-500'
        }`}>
          {strengthLabels[strength]}
        </span>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.met ? (
              <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            )}
            <span className={check.met ? 'text-slate-600' : 'text-slate-400'}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

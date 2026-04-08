import Link from 'next/link'

const DONATION_URL = process.env.NEXT_PUBLIC_DONATION_URL || '#'
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL || '#'

export default function PricingPage() {
  return (
    <div className="min-h-screen landing-gradient-bg relative overflow-hidden">
      <main className="relative max-w-3xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-5xl font-chonko mb-4 animate-fade-in-up" style={{ color: '#0F172A' }}>
          Free forever
        </h1>
        <p className="text-lg font-manrope mb-12 animate-fade-in-up delay-100" style={{ color: '#64748B' }}>
          SpeedBack is open source. Every feature. No limits. No credit card.
        </p>

        {/* Single plan card */}
        <div className="bg-white rounded-2xl p-8 text-left max-w-md mx-auto animate-fade-in-up delay-200" style={{ border: '2px solid #8B5CF6', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)' }}>
          <div className="text-center mb-6">
            <div className="text-sm font-outfit font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B5CF6' }}>Community Edition</div>
            <div className="flex items-end gap-1 justify-center mb-1">
              <span className="text-5xl font-outfit font-bold" style={{ color: '#0F172A' }}>$0</span>
            </div>
            <div className="text-sm font-manrope" style={{ color: '#64748B' }}>forever, for everyone</div>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'Unlimited surveys',
              'Unlimited responses',
              'All 40+ question mechanics',
              'QR code & poster generator',
              'Full analytics dashboard',
              'CSV export',
              'Custom branding',
              'Self-host or use our demo',
            ].map(f => (
              <li key={f} className="flex items-start gap-2 font-manrope text-sm" style={{ color: '#475569' }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#8B5CF6' }}>&#10003;</span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="w-full block text-center py-3 font-outfit font-semibold rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98"
            style={{ backgroundColor: '#8B5CF6', color: 'white' }}
          >
            Get Started
          </Link>
        </div>

        {/* Support section */}
        <div className="mt-16 animate-fade-in-up delay-300">
          <h2 className="text-2xl font-outfit mb-4" style={{ color: '#0F172A' }}>
            Love SpeedBack? Support the project
          </h2>
          <p className="font-manrope text-sm mb-6" style={{ color: '#64748B' }}>
            SpeedBack is built by a small team. If it saves you time or makes your events better, consider supporting us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {DONATION_URL !== '#' && (
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold rounded-xl transition-colors"
              >
                Support SpeedBack
              </a>
            )}
            {GITHUB_URL !== '#' && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Contribute on GitHub
              </a>
            )}
          </div>
        </div>
      </main>

      <footer className="relative text-center py-8 bg-white border-t" style={{ borderColor: 'rgba(100, 116, 139, 0.1)' }}>
        <p className="font-manrope text-sm" style={{ color: '#94A3B8' }}>
          Open source &middot; Self-hostable &middot; Community-driven
        </p>
      </footer>
    </div>
  )
}

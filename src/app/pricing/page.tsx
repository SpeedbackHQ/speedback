import Link from 'next/link'
import { getUser, getUserProfile, createServerSupabaseClient } from '@/lib/auth'

const STARTER_LINK = process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK || '#'
const EVENT_LINK = process.env.NEXT_PUBLIC_STRIPE_EVENT_LINK || '#'

export default async function PricingPage() {
  const user = await getUser()
  let currentPlan = 'free'

  if (user) {
    const profile = await getUserProfile(user.id)
    currentPlan = profile?.plan_type || 'free'
  }

  return (
    <div className="min-h-screen landing-gradient-bg relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-chonko tracking-tight" style={{ color: '#0F172A' }}>
          Speed<span style={{ color: '#8B5CF6' }}>Back</span>
        </Link>
        <Link href="/admin" className="btn-secondary">
          Dashboard
        </Link>
      </nav>

      <main className="relative max-w-5xl mx-auto px-6 pt-16 pb-32 text-center">
        <h1 className="text-5xl font-chonko mb-4 animate-fade-in-up" style={{ color: '#0F172A' }}>
          Simple pricing
        </h1>
        <p className="text-lg font-manrope mb-8 animate-fade-in-up delay-100" style={{ color: '#64748B' }}>
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Current Plan Badge for Logged-In Users */}
        {user && (
          <div className="mb-8 inline-block px-6 py-3 bg-violet-100 border border-violet-300 rounded-lg">
            <p className="text-sm font-medium text-violet-800">
              Current Plan: <strong className="font-bold capitalize">{currentPlan}</strong>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up delay-200">
          {/* Free */}
          <div className="bg-white rounded-2xl p-8 text-left flex flex-col" style={{ border: '1px solid rgba(100, 116, 139, 0.15)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
            <div className="mb-6">
              <div className="text-sm font-outfit font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>Free</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-outfit font-bold" style={{ color: '#0F172A' }}>$0</span>
              </div>
              <div className="text-sm font-manrope" style={{ color: '#64748B' }}>forever</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                '25 responses per survey',
                'All question mechanics',
                'QR code & poster generator',
                'SpeedBack branding visible',
                'Basic results dashboard',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 font-manrope text-sm" style={{ color: '#475569' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#06B6D4' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/admin/surveys/new"
              className="btn-secondary w-full text-center py-3 font-outfit font-semibold"
            >
              Try Free
            </Link>
          </div>

          {/* Starter — highlighted */}
          <div className="bg-white rounded-2xl p-8 text-left flex flex-col relative" style={{ border: '2px solid #8B5CF6', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)' }}>
            {/* Lock-in badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-outfit font-semibold" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>
              🔒 Launch pricing — locked forever
            </div>

            <div className="mb-6">
              <div className="text-sm font-outfit font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B5CF6' }}>Starter</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-outfit font-bold" style={{ color: '#0F172A' }}>$19</span>
                <span className="text-lg font-manrope pb-1" style={{ color: '#64748B' }}>/month</span>
              </div>
              <div className="text-sm font-manrope" style={{ color: '#64748B' }}>billed monthly, cancel anytime</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited responses',
                'Unlimited events',
                'Remove SpeedBack branding',
                'Full analytics dashboard',
                'CSV export',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 font-manrope text-sm" style={{ color: '#475569' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#8B5CF6' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={STARTER_LINK}
              className="w-full text-center py-3 font-outfit font-semibold rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98"
              style={{ backgroundColor: '#8B5CF6', color: 'white' }}
            >
              Start Starter Plan
            </a>
          </div>

          {/* Per Event */}
          <div className="bg-white rounded-2xl p-8 text-left flex flex-col" style={{ border: '1px solid rgba(100, 116, 139, 0.15)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
            <div className="mb-6">
              <div className="text-sm font-outfit font-semibold uppercase tracking-wider mb-3" style={{ color: '#F97316' }}>Per Event</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-outfit font-bold" style={{ color: '#0F172A' }}>$15</span>
                <span className="text-lg font-manrope pb-1" style={{ color: '#64748B' }}>/event</span>
              </div>
              <div className="text-sm font-manrope" style={{ color: '#64748B' }}>one-time payment, no commitment</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited responses for 1 event',
                'All question mechanics',
                'QR code & poster generator',
                'Full analytics dashboard',
                'CSV export',
                'Buy more events as needed',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 font-manrope text-sm" style={{ color: '#475569' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#F97316' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={EVENT_LINK}
              className="w-full text-center py-3 font-outfit font-semibold rounded-xl border-2 transition-all duration-200 hover:bg-orange-50 active:scale-98"
              style={{ borderColor: '#F97316', color: '#F97316' }}
            >
              Buy Event
            </a>
          </div>
        </div>

        {/* Early adopter note */}
        <p className="mt-10 font-manrope text-sm animate-fade-in-up delay-300" style={{ color: '#94A3B8' }}>
          Early customers who join during our launch phase will be grandfathered at $19/month forever, even as we raise prices for new customers.
        </p>

        {/* FAQ / trust */}
        <div className="mt-20 grid md:grid-cols-2 gap-6 text-left animate-fade-in-up delay-400">
          {[
            { q: 'Can I upgrade later?', a: 'Yes — start free, upgrade anytime. Early pricing locks in on the day you subscribe.' },
            { q: 'What counts as an "event"?', a: 'One survey deployment. Buy one event, collect unlimited responses for that survey.' },
            { q: 'What happens when I hit 25 responses on free?', a: 'New respondents see a friendly "survey is full" message. You upgrade to unlock unlimited.' },
            { q: 'Do you offer refunds?', a: 'Yes — if you\'re not happy in the first 7 days, email us and we\'ll refund you, no questions asked.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(100, 116, 139, 0.1)' }}>
              <div className="font-outfit font-semibold mb-2" style={{ color: '#0F172A' }}>{q}</div>
              <div className="font-manrope text-sm" style={{ color: '#64748B' }}>{a}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative text-center py-8 bg-white border-t" style={{ borderColor: 'rgba(100, 116, 139, 0.1)' }}>
        <p className="font-manrope text-sm" style={{ color: '#94A3B8' }}>
          Questions? Email <a href="mailto:hello@speedback.app" className="underline hover:text-slate-600">hello@speedback.app</a>
        </p>
      </footer>
    </div>
  )
}

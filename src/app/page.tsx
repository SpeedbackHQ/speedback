import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect logged-in users to dashboard
  const user = await getUser()
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen landing-gradient-bg relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-4 max-w-6xl mx-auto animate-fade-in">
        <div className="text-2xl font-chonko tracking-tight" style={{ color: '#0F172A' }}>
          Speed<span style={{ color: '#8B5CF6' }}>Back</span>
        </div>
        <Link
          href="/admin"
          className="btn-secondary"
        >
          Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative max-w-4xl mx-auto px-6 pt-16 pb-32 text-center">
        {/* Playful mascot teaser / speed icon */}
        <div className="relative inline-block mb-8 animate-fade-in-up">
          <div className="text-8xl animate-float">⚡</div>
          {/* Speed lines around the icon - now cyan */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(6, 182, 212, 0.6), transparent)' }} />
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 mt-3 w-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(6, 182, 212, 0.4), transparent)' }} />
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(to left, transparent, rgba(6, 182, 212, 0.6), transparent)' }} />
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 mt-3 w-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(to left, transparent, rgba(6, 182, 212, 0.4), transparent)' }} />
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-chonko mb-6 leading-tight animate-fade-in-up delay-100" style={{ color: '#0F172A' }}>
          The most fun feedback form<br />you&apos;ll ever use
        </h1>
        <p className="text-lg sm:text-xl font-manrope mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200" style={{ color: '#64748B' }}>
          Feedback forms that feel like games. Get more responses, faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
          <Link
            href="/admin/surveys/new"
            className="btn-primary text-lg px-8 py-4"
          >
            Try Free
          </Link>
          <Link
            href="/pricing"
            className="btn-secondary text-lg px-8 py-4"
          >
            See Pricing
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <div className="bg-white rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-300 group" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform" style={{ color: '#06B6D4' }}>🎯</div>
            <h3 className="text-2xl font-outfit mb-2" style={{ color: '#0F172A' }}>Swipe to Answer</h3>
            <p className="font-manrope" style={{ color: '#64748B' }}>
              Tinder-style swipe cards for quick yes/no/meh responses
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-400 group" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform" style={{ color: '#06B6D4' }}>🎨</div>
            <h3 className="text-2xl font-outfit mb-2" style={{ color: '#0F172A' }}>40+ Game Mechanics</h3>
            <p className="font-manrope" style={{ color: '#64748B' }}>
              Drag & drop, tap bubbles, scratch cards & more playful interactions
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-500 group" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform" style={{ color: '#06B6D4' }}>⚡</div>
            <h3 className="text-2xl font-outfit mb-2" style={{ color: '#0F172A' }}>Lightning Fast</h3>
            <p className="font-manrope" style={{ color: '#64748B' }}>
              Swipe and tap through questions. Way faster than traditional surveys.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 animate-fade-in-up delay-600">
          <h2 className="text-3xl font-outfit text-center mb-12" style={{ color: '#0F172A' }}>How it works</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <div className="flex items-center gap-4 card-hover bg-white rounded-2xl px-6 py-4" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-outfit text-2xl shadow-lg" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>
                1
              </div>
              <div className="text-left">
                <div className="font-manrope font-semibold text-lg" style={{ color: '#0F172A' }}>Create survey</div>
                <div className="font-manrope text-sm" style={{ color: '#64748B' }}>Add your questions</div>
              </div>
            </div>
            <div className="hidden md:block text-3xl font-light" style={{ color: '#06B6D4' }}>→</div>
            <div className="flex items-center gap-4 card-hover bg-white rounded-2xl px-6 py-4" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-outfit text-2xl shadow-lg" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>
                2
              </div>
              <div className="text-left">
                <div className="font-manrope font-semibold text-lg" style={{ color: '#0F172A' }}>Share QR code</div>
                <div className="font-manrope text-sm" style={{ color: '#64748B' }}>Print or display it</div>
              </div>
            </div>
            <div className="hidden md:block text-3xl font-light" style={{ color: '#06B6D4' }}>→</div>
            <div className="flex items-center gap-4 card-hover bg-white rounded-2xl px-6 py-4" style={{ border: '1px solid rgba(100, 116, 139, 0.1)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-outfit text-2xl shadow-lg" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>
                3
              </div>
              <div className="text-left">
                <div className="font-manrope font-semibold text-lg" style={{ color: '#0F172A' }}>Collect feedback</div>
                <div className="font-manrope text-sm" style={{ color: '#64748B' }}>Watch responses roll in</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badge / tagline */}
        <div className="mt-20 animate-fade-in-up delay-600">
          <p className="font-manrope text-sm" style={{ color: '#64748B' }}>
            Fast. Fun. Insightful. Feedback that actually gets completed.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative text-center py-8 bg-white border-t" style={{ borderColor: 'rgba(100, 116, 139, 0.1)' }}>
        <p className="font-manrope text-sm" style={{ color: '#94A3B8' }}>
          Questions? Email <a href="mailto:hello@speedback.app" className="underline hover:text-slate-600">hello@speedback.app</a>
          <span className="mx-2">·</span>
          <Link href="/pricing" className="underline hover:text-slate-600">Pricing</Link>
        </p>
      </footer>
    </div>
  )
}

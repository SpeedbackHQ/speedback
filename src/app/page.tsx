import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/90 via-purple-500/85 to-amber-500/80 relative overflow-hidden">
      {/* Subtle overlay for more diffused gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

      {/* Decorative speed lines */}
      <div className="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-0 w-24 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse delay-300" />
      <div className="absolute bottom-1/3 left-10 w-20 h-1 bg-gradient-to-r from-transparent via-white/35 to-transparent rounded-full animate-pulse delay-500" />

      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-4 max-w-6xl mx-auto animate-fade-in">
        <div className="text-2xl font-bold text-white tracking-tight">
          Speed<span className="text-amber-300">Back</span>
        </div>
        <Link
          href="/admin"
          className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-xl hover-lift hover:bg-white/30 transition-all"
        >
          Admin Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative max-w-4xl mx-auto px-6 pt-16 pb-32 text-center">
        {/* Playful mascot teaser / speed icon */}
        <div className="relative inline-block mb-8 animate-fade-in-up">
          <div className="text-8xl animate-float">⚡</div>
          {/* Speed lines around the icon */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-white/60 to-transparent rounded-full" />
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 mt-3 w-4 h-0.5 bg-gradient-to-r from-white/40 to-transparent rounded-full" />
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-l from-white/60 to-transparent rounded-full" />
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 mt-3 w-4 h-0.5 bg-gradient-to-l from-white/40 to-transparent rounded-full" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
          The most fun feedback form<br />you&apos;ll ever use ⚡
        </h1>
        <p className="text-lg sm:text-xl text-white/85 mb-12 max-w-2xl mx-auto font-medium animate-fade-in-up delay-200">
          Game-like swipes and taps. 2-minute surveys. Better insights for creators.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
          <Link
            href="/admin/surveys/new"
            className="px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl shadow-lg hover-lift hover:shadow-xl transition-all animate-pulse-glow"
          >
            Create Your First Survey
          </Link>
          <Link
            href="/admin"
            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold text-lg rounded-xl hover-lift hover:bg-white/30 transition-all"
          >
            View Dashboard
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-300 group">
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform">👆</div>
            <h3 className="text-xl font-bold text-white mb-2">Swipe to Answer</h3>
            <p className="text-white/75 font-medium">
              Tinder-style swipe cards for quick yes/no/meh responses
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-400 group">
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform">😊</div>
            <h3 className="text-xl font-bold text-white mb-2">Emotion Slider</h3>
            <p className="text-white/75 font-medium">
              Drag expressive emojis along a spectrum to rate experiences
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-left card-hover animate-fade-in-up delay-500 group">
            <div className="text-5xl mb-4 group-hover:animate-bounce-subtle transition-transform">💥</div>
            <h3 className="text-xl font-bold text-white mb-2">Tap to Select</h3>
            <p className="text-white/75 font-medium">
              Burst satisfying bubbles to pick your favorite options
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 animate-fade-in-up delay-600">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <div className="flex items-center gap-4 card-hover bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div className="text-white text-left">
                <div className="font-bold text-lg">Create survey</div>
                <div className="text-white/70 text-sm font-medium">Add your questions</div>
              </div>
            </div>
            <div className="hidden md:block text-white/50 text-3xl font-light">→</div>
            <div className="flex items-center gap-4 card-hover bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <div className="text-white text-left">
                <div className="font-bold text-lg">Share QR code</div>
                <div className="text-white/70 text-sm font-medium">Print or display it</div>
              </div>
            </div>
            <div className="hidden md:block text-white/50 text-3xl font-light">→</div>
            <div className="flex items-center gap-4 card-hover bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <div className="text-white text-left">
                <div className="font-bold text-lg">Collect feedback</div>
                <div className="text-white/70 text-sm font-medium">Watch responses roll in</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badge / tagline */}
        <div className="mt-20 animate-fade-in-up delay-600">
          <p className="text-white/60 font-medium text-sm">
            Fast. Fun. Insightful. Built for creators who care about feedback.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative text-center text-white/50 py-8 font-medium">
        Built with Next.js, Framer Motion & Supabase
      </footer>
    </div>
  )
}

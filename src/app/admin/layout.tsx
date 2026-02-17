import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-violet-100/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-chonko tracking-tight" style={{ color: '#0F172A' }}>
            Speed<span style={{ color: '#8B5CF6' }}>Back</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-outfit text-slate-600 hover:text-violet-500 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-violet-50"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              className="font-outfit text-slate-600 hover:text-violet-500 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-violet-50"
            >
              Templates
            </Link>
            <Link
              href="/admin/playground"
              className="font-outfit text-slate-600 hover:text-violet-500 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-violet-50"
            >
              Playground
            </Link>
            <Link
              href="/admin/surveys/new"
              className="btn-primary"
            >
              + New Survey
            </Link>
          </nav>
        </div>
      </header>

      {/* Decorative accent bar */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500" />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

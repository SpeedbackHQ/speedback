import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-indigo-100/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="text-2xl font-bold text-indigo-600 tracking-tight hover:text-indigo-700 transition-colors">
            Speed<span className="text-amber-500">Back</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              Templates
            </Link>
            <Link
              href="/admin/playground"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              Playground
            </Link>
            <Link
              href="/admin/surveys/new"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover-lift hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              + New Survey
            </Link>
          </nav>
        </div>
      </header>

      {/* Decorative accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

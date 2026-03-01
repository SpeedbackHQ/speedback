'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface MechanicData {
  type: string
  label: string
  emoji: string
  category: string
  usageCount: number
  totalAnswers: number
  avgTimeSec: number | null
  abandonmentCount: number
  avgCharCount?: number
  avgSelectionsCount?: number
  distributionSpread?: number
}

interface CompletionCurvePoint {
  positionBucket: number
  questionType: string
  count: number
}

interface SequenceEffect {
  questionType: string
  previousType: string
  count: number
  avgTimeMs: number | null
}

interface PlatformStats {
  totalSurveys: number
  totalResponses: number
  totalStarts: number
  totalCompletions: number
  overallCompletionRate: number | null
  avgCompletionTimeSec: number | null
  avgSurveyLength: number | null
}

interface AnalyticsData {
  platform: PlatformStats
  mechanics: MechanicData[]
  completionCurves: CompletionCurvePoint[]
  sequenceEffects: SequenceEffect[]
  fetchedAt: string
}

type SortKey = 'label' | 'category' | 'usageCount' | 'totalAnswers' | 'avgTimeSec' | 'abandonmentCount' | 'quality'
type SortDir = 'asc' | 'desc'

export function InternalDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('totalAnswers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    if (!data) return []
    const cats = new Set(data.mechanics.map(m => m.category))
    return ['All', ...Array.from(cats).sort()]
  }, [data])

  const sortedMechanics = useMemo(() => {
    if (!data) return []
    let filtered = data.mechanics
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(m => m.category === categoryFilter)
    }

    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortKey) {
        case 'label': aVal = a.label.toLowerCase(); bVal = b.label.toLowerCase(); break
        case 'category': aVal = a.category; bVal = b.category; break
        case 'usageCount': aVal = a.usageCount; bVal = b.usageCount; break
        case 'totalAnswers': aVal = a.totalAnswers; bVal = b.totalAnswers; break
        case 'avgTimeSec': aVal = a.avgTimeSec ?? 0; bVal = b.avgTimeSec ?? 0; break
        case 'abandonmentCount': aVal = a.abandonmentCount; bVal = b.abandonmentCount; break
        case 'quality':
          aVal = a.avgCharCount ?? a.avgSelectionsCount ?? a.distributionSpread ?? 0
          bVal = b.avgCharCount ?? b.avgSelectionsCount ?? b.distributionSpread ?? 0
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [data, sortKey, sortDir, categoryFilter])

  // Completion curves aggregated by category
  const curvesByCategory = useMemo(() => {
    if (!data || data.completionCurves.length === 0) return null
    const map = new Map<string, Map<number, number>>()
    // We need to look up category for each question type
    const typeToCat = new Map<string, string>()
    data.mechanics.forEach(m => typeToCat.set(m.type, m.category))

    for (const point of data.completionCurves) {
      const cat = typeToCat.get(point.questionType) || 'Unknown'
      if (!map.has(cat)) map.set(cat, new Map())
      const bucketMap = map.get(cat)!
      bucketMap.set(point.positionBucket, (bucketMap.get(point.positionBucket) || 0) + point.count)
    }
    return map
  }, [data])

  // Top insights
  const insights = useMemo(() => {
    if (!data) return []
    const withAnswers = data.mechanics.filter(m => m.totalAnswers > 0)
    if (withAnswers.length === 0) return []

    const items: string[] = []

    // Fastest mechanic
    const fastest = withAnswers.filter(m => m.avgTimeSec != null).sort((a, b) => (a.avgTimeSec ?? 999) - (b.avgTimeSec ?? 999))[0]
    if (fastest) items.push(`Fastest: ${fastest.emoji} ${fastest.label} — ${fastest.avgTimeSec}s avg`)

    // Slowest mechanic
    const slowest = withAnswers.filter(m => m.avgTimeSec != null).sort((a, b) => (b.avgTimeSec ?? 0) - (a.avgTimeSec ?? 0))[0]
    if (slowest && slowest.type !== fastest?.type) items.push(`Slowest: ${slowest.emoji} ${slowest.label} — ${slowest.avgTimeSec}s avg`)

    // Most used
    const mostUsed = withAnswers.sort((a, b) => b.usageCount - a.usageCount)[0]
    if (mostUsed) items.push(`Most deployed: ${mostUsed.emoji} ${mostUsed.label} — ${mostUsed.usageCount} questions`)

    // Most answered
    const mostAnswered = withAnswers.sort((a, b) => b.totalAnswers - a.totalAnswers)[0]
    if (mostAnswered) items.push(`Most answers: ${mostAnswered.emoji} ${mostAnswered.label} — ${mostAnswered.totalAnswers.toLocaleString()} answers`)

    // Highest abandonment
    const highestAband = withAnswers.filter(m => m.abandonmentCount > 0).sort((a, b) => b.abandonmentCount - a.abandonmentCount)[0]
    if (highestAband) items.push(`Highest abandonment: ${highestAband.emoji} ${highestAband.label} — ${highestAband.abandonmentCount} abandonments`)

    return items
  }, [data])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  function getQualityLabel(m: MechanicData): string {
    if (m.avgCharCount != null) return `${m.avgCharCount} chars`
    if (m.avgSelectionsCount != null) return `${m.avgSelectionsCount} picks`
    if (m.distributionSpread != null) return `σ ${m.distributionSpread}`
    return '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-64" />
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-lg" />)}
            </div>
            <div className="h-96 bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-red-400 text-lg">Failed to load analytics: {error || 'Unknown error'}</p>
          <Link href="/dashboard" className="text-violet-400 underline mt-4 inline-block">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { platform } = data

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">SpeedBack Internal</h1>
          <p className="text-xs text-slate-500 mt-1">Data as of {new Date(data.fetchedAt).toLocaleString()}</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-10">
        {/* Section 1: Platform Stats */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Surveys" value={platform.totalSurveys} />
            <StatCard label="Responses" value={platform.totalResponses.toLocaleString()} />
            <StatCard label="Completion Rate" value={platform.overallCompletionRate != null ? `${platform.overallCompletionRate}%` : '—'} />
            <StatCard label="Avg Length" value={platform.avgSurveyLength != null ? `${platform.avgSurveyLength} Qs` : '—'} />
            <StatCard label="Avg Time" value={platform.avgCompletionTimeSec != null ? formatTime(platform.avgCompletionTimeSec) : '—'} />
          </div>
        </section>

        {/* Section 2: Insights */}
        {insights.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-300">
                  {insight}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Mechanic Performance Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Mechanic Performance</h2>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('label')}>
                    Mechanic{sortIcon('label')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                    Category{sortIcon('category')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white text-right" onClick={() => handleSort('usageCount')}>
                    Used{sortIcon('usageCount')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white text-right" onClick={() => handleSort('totalAnswers')}>
                    Answers{sortIcon('totalAnswers')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white text-right" onClick={() => handleSort('avgTimeSec')}>
                    Avg Time{sortIcon('avgTimeSec')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white text-right" onClick={() => handleSort('abandonmentCount')}>
                    Abandonments{sortIcon('abandonmentCount')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-white text-right" onClick={() => handleSort('quality')}>
                    Quality{sortIcon('quality')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedMechanics.map(m => (
                  <tr key={m.type} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="mr-2">{m.emoji}</span>
                      <span className="text-slate-200">{m.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{m.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{m.usageCount}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{m.totalAnswers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {m.avgTimeSec != null ? `${m.avgTimeSec}s` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={m.abandonmentCount > 0 ? 'text-red-400' : 'text-slate-500'}>
                        {m.abandonmentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs">
                      {getQualityLabel(m)}
                    </td>
                  </tr>
                ))}
                {sortedMechanics.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No data for this category</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Completion Curves */}
        {curvesByCategory && curvesByCategory.size > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Completion Curves by Position</h2>
            <p className="text-xs text-slate-500 mb-4">Answer counts at each normalized position (0% = start, 100% = end of survey). Higher is better.</p>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left py-2 pr-4">Category</th>
                    {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(b => (
                      <th key={b} className="text-center py-2 px-2">{Math.round(b * 100)}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Array.from(curvesByCategory.entries()).map(([cat, bucketMap]) => {
                    const maxCount = Math.max(...Array.from(bucketMap.values()), 1)
                    return (
                      <tr key={cat}>
                        <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">{cat}</td>
                        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(b => {
                          const count = bucketMap.get(b) || 0
                          const intensity = count / maxCount
                          const bg = intensity > 0.7 ? 'bg-emerald-500/30' : intensity > 0.3 ? 'bg-emerald-500/15' : intensity > 0 ? 'bg-emerald-500/5' : ''
                          return (
                            <td key={b} className={`text-center py-2 px-2 text-slate-400 ${bg}`}>
                              {count > 0 ? count.toLocaleString() : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 5: Sequence Effects */}
        {data.sequenceEffects.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Sequence Effects</h2>
            <p className="text-xs text-slate-500 mb-4">How mechanics perform depending on what came before them. Sorted by frequency.</p>
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left bg-slate-900">
                    <th className="px-4 py-3 font-medium">After...</th>
                    <th className="px-4 py-3 font-medium">Then...</th>
                    <th className="px-4 py-3 font-medium text-right">Count</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.sequenceEffects.slice(0, 30).map((seq, i) => {
                    const prevInfo = data.mechanics.find(m => m.type === seq.previousType)
                    const currInfo = data.mechanics.find(m => m.type === seq.questionType)
                    return (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="px-4 py-2 text-slate-400">
                          {prevInfo ? `${prevInfo.emoji} ${prevInfo.label}` : seq.previousType}
                        </td>
                        <td className="px-4 py-2 text-slate-200">
                          {currInfo ? `${currInfo.emoji} ${currInfo.label}` : seq.questionType}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300">{seq.count}</td>
                        <td className="px-4 py-2 text-right text-slate-300">
                          {seq.avgTimeMs != null ? `${(seq.avgTimeMs / 1000).toFixed(1)}s` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 6: Comparative Baselines */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Comparative Baselines</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            {data.mechanics.filter(m => m.totalAnswers > 0 && m.avgTimeSec != null).length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs text-slate-500 uppercase mb-2">Average Time by Category</h3>
                  <div className="space-y-2">
                    {Array.from(
                      data.mechanics
                        .filter(m => m.totalAnswers > 0 && m.avgTimeSec != null)
                        .reduce((acc, m) => {
                          const cat = m.category
                          if (!acc.has(cat)) acc.set(cat, { total: 0, count: 0, totalAnswers: 0 })
                          const entry = acc.get(cat)!
                          entry.total += (m.avgTimeSec ?? 0) * m.totalAnswers
                          entry.totalAnswers += m.totalAnswers
                          entry.count++
                          return acc
                        }, new Map<string, { total: number; count: number; totalAnswers: number }>())
                    ).map(([cat, stats]) => {
                      const weightedAvg = stats.totalAnswers > 0 ? (stats.total / stats.totalAnswers) : 0
                      const maxTime = 10 // 10s scale
                      const widthPct = Math.min((weightedAvg / maxTime) * 100, 100)
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-28 text-right">{cat}</span>
                          <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500/50 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${widthPct}%`, minWidth: '40px' }}
                            >
                              <span className="text-[10px] text-white font-medium">{weightedAvg.toFixed(1)}s</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Not enough data for baselines yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }
  return `${seconds}s`
}

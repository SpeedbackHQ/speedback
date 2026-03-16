'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CreateSurveyButton } from '@/components/CreateSurveyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'

interface SurveyItem {
  id: string
  title: string
  is_active: boolean
  created_at: string
  folder?: string | null
  responses: { count: number }[] | { count: number }
}

type FilterType = 'all' | 'active' | 'paused'
type SortType = 'newest' | 'responses' | 'alpha'
type ViewType = 'list' | 'grid'

function getResponseCount(survey: SurveyItem): number {
  return Array.isArray(survey.responses)
    ? survey.responses.length
    : (survey.responses as { count: number })?.count ?? 0
}

export function SurveyDashboard({ surveys: initialSurveys }: { surveys: SurveyItem[] }) {
  const [surveys, setSurveys] = useState(initialSurveys)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('newest')
  const [view, setView] = useState<ViewType>('list')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<SurveyItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Persist view preference
  useEffect(() => {
    const saved = localStorage.getItem('sb-dashboard-view')
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('sb-dashboard-view', view)
  }, [view])

  const toggleFolder = useCallback((folder: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folder)) next.delete(folder)
      else next.add(folder)
      return next
    })
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      // Delete responses first, then questions, then survey
      await supabase.from('responses').delete().eq('survey_id', deleteTarget.id)
      await supabase.from('questions').delete().eq('survey_id', deleteTarget.id)
      const { error } = await supabase.from('surveys').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setSurveys(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting survey:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    let result = [...surveys]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => s.title.toLowerCase().includes(q) || (s.folder && s.folder.toLowerCase().includes(q)))
    }

    // Filter
    if (filter === 'active') result = result.filter(s => s.is_active)
    if (filter === 'paused') result = result.filter(s => !s.is_active)

    // Sort
    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sort === 'responses') {
      result.sort((a, b) => getResponseCount(b) - getResponseCount(a))
    } else if (sort === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [surveys, search, filter, sort])

  // Group by folder
  const grouped = useMemo(() => {
    const folders: Record<string, SurveyItem[]> = {}
    const unfiled: SurveyItem[] = []

    for (const survey of filtered) {
      if (survey.folder) {
        if (!folders[survey.folder]) folders[survey.folder] = []
        folders[survey.folder].push(survey)
      } else {
        unfiled.push(survey)
      }
    }

    return { folders, unfiled }
  }, [filtered])

  const folderNames = Object.keys(grouped.folders).sort()
  const hasFolders = folderNames.length > 0

  if (surveys.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No surveys yet"
        description="Create your first gamified feedback survey and start collecting responses!"
        steps={[
          { emoji: '📝', label: 'Create survey' },
          { emoji: '🎮', label: 'Add questions' },
          { emoji: '📱', label: 'Share QR code' },
        ]}
        action={
          <CreateSurveyButton className="inline-block bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold hover-lift hover:bg-violet-600 transition-all shadow-md shadow-violet-200">
            Create Your First Survey
          </CreateSurveyButton>
        }
      />
    )
  }

  const filterChips: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Paused', value: 'paused' },
  ]

  const renderSurveyCard = (survey: SurveyItem, index: number) => {
    const responseCount = getResponseCount(survey)
    return (
      <div
        key={survey.id}
        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover group animate-fade-in-up relative ${
          view === 'list' ? 'flex items-center justify-between' : ''
        }`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <Link
          href={`/dashboard/surveys/${survey.id}`}
          className={`flex-1 ${view === 'list' ? 'flex items-center justify-between' : ''}`}
        >
          <div className={view === 'grid' ? 'mb-4' : ''}>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-violet-500 transition-colors break-words line-clamp-2">
              {survey.title}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Created {new Date(survey.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className={`flex items-center gap-6 ${view === 'grid' ? 'justify-between' : ''}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-500">{responseCount}</div>
              <div className="text-slate-500 text-sm font-medium">responses</div>
            </div>
            <div
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                survey.is_active
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {survey.is_active ? 'Active' : 'Paused'}
            </div>
            {view === 'list' && (
              <div className="text-slate-300 text-xl group-hover:text-violet-400 group-hover:translate-x-1 transition-all">
                &rarr;
              </div>
            )}
          </div>
        </Link>
        {/* Inline delete button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDeleteTarget(survey)
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete survey"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )
  }

  const renderSurveyGrid = (items: SurveyItem[]) => (
    <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid gap-4'}>
      {items.map((survey, index) => renderSurveyCard(survey, index))}
    </div>
  )

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search - only show when 5+ surveys */}
        {surveys.length >= 5 && (
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surveys..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          {filterChips.map(chip => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === chip.value
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Sort + View toggle */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="newest">Newest</option>
            <option value="responses">Most Responses</option>
            <option value="alpha">A-Z</option>
          </select>

          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Empty search state */}
      {filtered.length === 0 && search.trim() && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No surveys matching &ldquo;{search}&rdquo;</h3>
          <p className="text-slate-500">Try a different search term</p>
        </div>
      )}

      {/* Survey cards — grouped by folder */}
      {filtered.length > 0 && (
        <div className="space-y-6">
          {/* Folders */}
          {folderNames.map(folder => {
            const isCollapsed = collapsedFolders.has(folder)
            const folderSurveys = grouped.folders[folder]
            const folderResponses = folderSurveys.reduce((acc, s) => acc + getResponseCount(s), 0)
            return (
              <div key={folder}>
                <button
                  onClick={() => toggleFolder(folder)}
                  className="flex items-center gap-2 mb-3 group/folder w-full text-left"
                >
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 group-hover/folder:text-violet-600 transition-colors">
                    {folder}
                  </span>
                  <span className="text-xs text-slate-400">
                    {folderSurveys.length} survey{folderSurveys.length !== 1 ? 's' : ''} &middot; {folderResponses} response{folderResponses !== 1 ? 's' : ''}
                  </span>
                </button>
                {!isCollapsed && renderSurveyGrid(folderSurveys)}
              </div>
            )
          })}

          {/* Unfiled surveys */}
          {grouped.unfiled.length > 0 && (
            <div>
              {hasFolders && (
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-500">Surveys</span>
                </div>
              )}
              {renderSurveyGrid(grouped.unfiled)}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Survey?</h3>
              <p className="text-slate-500">
                This will permanently delete <strong>&quot;{deleteTarget.title}&quot;</strong> and all {getResponseCount(deleteTarget)} response{getResponseCount(deleteTarget) !== 1 ? 's' : ''}.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

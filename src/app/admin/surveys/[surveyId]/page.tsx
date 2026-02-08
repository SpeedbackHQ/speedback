'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { Survey, Question, Response, QuestionType } from '@/lib/types'
import Link from 'next/link'
import { QuestionEditor, QuestionTypeSelector, QuestionDraft, questionTypeInfo, getDefaultConfig } from '@/components/QuestionEditor'

type TabType = 'questions' | 'share' | 'responses'

interface SurveyData extends Survey {
  questions: Question[]
  responses: Response[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SurveyEditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const surveyId = params.surveyId as string

  // Tab state from URL
  const currentTab = (searchParams.get('tab') as TabType) || 'questions'

  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Edit state
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  // Save status (Google Docs style)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Toggle state
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Warning banner dismissed
  const [warningDismissed, setWarningDismissed] = useState(false)

  // Prevent useEffect from resetting questions/title after initial load
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  useEffect(() => {
    if (survey) {
      generateQRCode()
      if (!hasInitializedRef.current) {
        setTitle(survey.title)
        setQuestions(survey.questions.map(q => ({
          id: q.id,
          type: q.type,
          text: q.text,
          config: q.config || {},
        })))
        hasInitializedRef.current = true
      }
    }
  }, [survey])

  const loadSurvey = async () => {
    const { data: surveyData } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index')

    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('completed_at', { ascending: false })

    if (surveyData) {
      setSurvey({
        ...surveyData,
        questions: questions || [],
        responses: responses || [],
      })
    }
    setLoading(false)
  }

  const generateQRCode = async () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    const url = await QRCode.toDataURL(playUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#6366F1', light: '#FFFFFF' },
    })
    setQrCodeUrl(url)
  }

  const downloadQRCode = async () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    const url = await QRCode.toDataURL(playUrl, {
      width: 600,
      margin: 2,
      color: { dark: '#6366F1', light: '#FFFFFF' },
    })

    const link = document.createElement('a')
    link.download = `${survey?.title || 'survey'}-qr.png`
    link.href = url
    link.click()
  }

  const copyLink = () => {
    const playUrl = `${window.location.origin}/play/${surveyId}`
    navigator.clipboard.writeText(playUrl)
    alert('Link copied to clipboard!')
  }

  // Auto-save with debounce
  const saveWithFeedback = useCallback(async (saveFn: () => Promise<void>) => {
    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
    }

    // Only show "Saving..." if it takes more than 300ms
    const showSavingTimer = setTimeout(() => setSaveStatus('saving'), 300)

    try {
      await saveFn()
      clearTimeout(showSavingTimer)
      setSaveStatus('saved')
      // Hide "Saved" after 2 seconds
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      clearTimeout(showSavingTimer)
      console.error('Save error:', error)
      setSaveStatus('error')
    }
  }, [])

  // Debounced save for title
  const debouncedSaveTitle = useCallback((newTitle: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveWithFeedback(async () => {
        const { error } = await supabase
          .from('surveys')
          .update({ title: newTitle.trim() || 'Untitled Survey' })
          .eq('id', surveyId)
        if (error) throw error
        setSurvey(prev => prev ? { ...prev, title: newTitle.trim() || 'Untitled Survey' } : null)
      })
    }, 500)
  }, [surveyId, saveWithFeedback])

  // Debounced save for questions
  const debouncedSaveQuestions = useCallback((updatedQuestions: QuestionDraft[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveWithFeedback(async () => {
        // Find new questions (those not in original survey)
        const existingIds = new Set(survey?.questions.map(q => q.id) || [])
        const newQuestions = updatedQuestions.filter(q => !existingIds.has(q.id))
        const existingQuestions = updatedQuestions.filter(q => existingIds.has(q.id))

        // Insert new questions
        if (newQuestions.length > 0) {
          const toInsert = newQuestions.map((q, i) => ({
            id: q.id,
            survey_id: surveyId,
            type: q.type,
            text: q.text,
            config: q.config,
            order_index: existingQuestions.length + i,
          }))
          const { error } = await supabase.from('questions').insert(toInsert)
          if (error) throw error
        }

        // Update existing questions
        for (let i = 0; i < existingQuestions.length; i++) {
          const q = existingQuestions[i]
          const { error } = await supabase
            .from('questions')
            .update({
              text: q.text,
              config: q.config,
              order_index: i,
            })
            .eq('id', q.id)
          if (error) throw error
        }

        // Update local survey state
        setSurvey(prev => {
          if (!prev) return null
          return {
            ...prev,
            questions: updatedQuestions.map((q, i) => ({
              ...q,
              survey_id: surveyId,
              order_index: i,
            })) as Question[],
          }
        })
      })
    }, 500)
  }, [surveyId, survey, saveWithFeedback])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    debouncedSaveTitle(newTitle)
  }

  const handleQuestionsChange = (newQuestions: QuestionDraft[]) => {
    setQuestions(newQuestions)
    debouncedSaveQuestions(newQuestions)
  }

  const handleQuestionUpdate = (id: string, updates: Partial<QuestionDraft>) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q)
    setQuestions(newQuestions)
    debouncedSaveQuestions(newQuestions)
  }

  const handleQuestionDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return

    const newQuestions = questions.filter(q => q.id !== id)
    setQuestions(newQuestions)

    // Delete immediately from DB
    await supabase.from('questions').delete().eq('id', id)

    // Update survey state
    setSurvey(prev => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.filter(q => q.id !== id),
      }
    })
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionDraft = {
      id: crypto.randomUUID(),
      type,
      text: '',
      config: getDefaultConfig(type),
      isNew: true,
    }
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    setIsAddingQuestion(false)
    debouncedSaveQuestions(newQuestions)
  }

  const handleToggleStatus = async () => {
    if (!survey) return

    setIsTogglingStatus(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ is_active: !survey.is_active })
        .eq('id', surveyId)

      if (error) throw error

      setSurvey(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update survey status')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      // Delete responses first (foreign key constraint)
      await supabase
        .from('responses')
        .delete()
        .eq('survey_id', surveyId)

      // Delete questions
      await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyId)

      // Delete survey
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId)

      if (error) throw error

      router.push('/admin')
    } catch (error) {
      console.error('Error deleting survey:', error)
      alert('Failed to delete survey')
      setIsDeleting(false)
    }
  }

  const setTab = (tab: TabType) => {
    router.push(`/admin/surveys/${surveyId}?tab=${tab}`, { scroll: false })
  }

  const calculateStats = () => {
    if (!survey?.responses.length || !survey?.questions.length) {
      return null
    }

    const stats: Record<string, unknown> = {}

    survey.questions.forEach((question) => {
      const answers = survey.responses
        .map(r => r.answers.find((a: { question_id: string }) => a.question_id === question.id)?.value)
        .filter(Boolean)

      // Binary types: answer is 'left' | 'right' (| 'up' for swipe)
      const binaryTypes = ['swipe', 'toggle_switch', 'tug_of_war']
      // Scale types: answer is a number 0-100
      const scaleTypes = ['slider', 'thermometer', 'bullseye', 'stars', 'dial', 'press_hold', 'countdown_tap', 'tilt']
      // Single-select types: answer is a string (one of the options)
      const singleSelectTypes = [
        'tap_meter', 'rolodex', 'fanned', 'fanned_swipe', 'stacked',
        'tilt_maze', 'racing_lanes', 'gravity_drop', 'bubble_pop',
        'slingshot', 'scratch_card', 'treasure_chest', 'pinata',
        'spin_stop', 'door_choice', 'whack_a_mole', 'flick',
      ]

      if (binaryTypes.includes(question.type)) {
        const counts = { left: 0, right: 0, up: 0 }
        answers.forEach((a) => {
          if (a === 'left' || a === 'right' || a === 'up') counts[a]++
        })
        stats[question.id] = {
          type: 'swipe',
          total: answers.length,
          left: counts.left,
          right: counts.right,
          up: counts.up,
          labels: question.config,
        }
      } else if (scaleTypes.includes(question.type)) {
        const values = answers.filter((a): a is number => typeof a === 'number')
        const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
        stats[question.id] = {
          type: 'slider',
          total: values.length,
          average: Math.round(avg),
          distribution: [
            values.filter(v => v <= 20).length,
            values.filter(v => v > 20 && v <= 40).length,
            values.filter(v => v > 40 && v <= 60).length,
            values.filter(v => v > 60 && v <= 80).length,
            values.filter(v => v > 80).length,
          ],
          labels: question.config,
        }
      } else if (question.type === 'tap') {
        // Multi-select: answer is string[]
        const optionCounts: Record<string, number> = {}
        answers.forEach((a) => {
          if (Array.isArray(a)) {
            a.forEach((opt: string) => {
              optionCounts[opt] = (optionCounts[opt] || 0) + 1
            })
          }
        })
        stats[question.id] = {
          type: 'tap',
          total: answers.length,
          options: optionCounts,
        }
      } else if (singleSelectTypes.includes(question.type)) {
        // Single-select: answer is a string
        const optionCounts: Record<string, number> = {}
        answers.forEach((a) => {
          if (typeof a === 'string') {
            optionCounts[a] = (optionCounts[a] || 0) + 1
          }
        })
        stats[question.id] = {
          type: 'tap',
          total: answers.length,
          options: optionCounts,
        }
      }
    })

    return stats
  }

  const downloadCSV = () => {
    if (!survey) return
    const sortedQuestions = [...survey.questions].sort((a, b) => a.order_index - b.order_index)

    const headers = ['Response #', 'Completed At', 'Duration (s)', ...sortedQuestions.map(q => q.text || 'Untitled')]

    const formatAnswer = (question: { type: string; config: Record<string, unknown> }, value: unknown): string => {
      if (value == null) return ''
      if (['swipe', 'toggle_switch', 'tug_of_war'].includes(question.type)) {
        const config = question.config as Record<string, string>
        if (value === 'right') return config.right_label || 'Yes'
        if (value === 'left') return config.left_label || 'No'
        if (value === 'up') return config.up_label || 'Meh'
        return String(value)
      }
      if (Array.isArray(value)) return value.join(', ')
      return String(value)
    }

    const rows = survey.responses.map((response, i) => {
      const duration = response.duration_ms ? (response.duration_ms / 1000).toFixed(1) : ''
      const completedAt = new Date(response.completed_at).toLocaleString()
      const answers = sortedQuestions.map(q => {
        const answer = response.answers.find((a: { question_id: string }) => a.question_id === q.id)
        return formatAnswer(q, answer?.value)
      })
      return [String(i + 1), completedAt, duration, ...answers]
    })

    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsvField).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${survey.title || 'survey'}-responses.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Survey not found</h2>
        <Link href="/admin" className="text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const stats = calculateStats()
  const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${surveyId}` : ''
  const hasResponses = survey.responses.length > 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href="/admin"
            className="text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center gap-1 font-medium transition-colors"
          >
            ← Back to surveys
          </Link>

          {/* Editable title */}
          <div className="flex items-center gap-3 mt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Survey title..."
              className="text-3xl font-bold text-slate-800 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none px-1 py-1 transition-colors"
            />
            {/* Save status indicator */}
            <div className="text-sm font-medium">
              {saveStatus === 'saving' && (
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <motion.span
                  className="text-emerald-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✓ Saved
                </motion.span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500 flex items-center gap-1">
                  ⚠️ Unable to save
                  <button
                    onClick={() => debouncedSaveQuestions(questions)}
                    className="underline hover:no-underline"
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-500 mt-1 font-medium">
            {questions.length} questions • {survey.responses.length} responses
          </p>
        </div>

        {/* Status and actions */}
        <div className="flex items-center gap-3">
          {/* Status toggle */}
          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              survey.is_active
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            } ${isTogglingStatus ? 'opacity-50' : ''}`}
          >
            {isTogglingStatus ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${survey.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            )}
            {survey.is_active ? 'Active' : 'Paused'}
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors border border-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Warning banner for surveys with responses */}
      {hasResponses && !warningDismissed && (
        <motion.div
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">This survey has {survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}</p>
            <p className="text-amber-700 text-sm">
              Editing questions may affect how results are displayed. Changes are saved automatically.
            </p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
        {(['questions', 'share', 'responses'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
              currentTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'questions' && '📝 Questions'}
            {tab === 'share' && '🔗 Share'}
            {tab === 'responses' && `📊 Responses ${hasResponses ? `(${survey.responses.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {currentTab === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            {questions.length === 0 && !isAddingQuestion ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No questions yet</h3>
                <p className="text-slate-500 mb-4">Add your first question to get started!</p>
                <button
                  onClick={() => setIsAddingQuestion(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  + Add Question
                </button>
              </div>
            ) : (
              <>
                <QuestionEditor
                  questions={questions}
                  onQuestionsChange={handleQuestionsChange}
                  onQuestionUpdate={handleQuestionUpdate}
                  onQuestionDelete={handleQuestionDelete}
                />

                {/* Add question button */}
                {!isAddingQuestion ? (
                  <button
                    onClick={() => setIsAddingQuestion(true)}
                    className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                  >
                    + Add Question
                  </button>
                ) : (
                  <div className="mt-4">
                    <QuestionTypeSelector
                      onSelect={addQuestion}
                      onCancel={() => setIsAddingQuestion(false)}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {currentTab === 'share' && (
          <motion.div
            key="share"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-4">Share Survey</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-md mb-4">
                    <img src={qrCodeUrl} alt="QR Code" className="rounded-xl" />
                  </div>
                )}
                <button
                  onClick={downloadQRCode}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Download QR Code
                </button>
              </div>

              {/* Link and embed */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Survey Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium"
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium text-slate-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                  <Link
                    href={`/play/${surveyId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Open survey in new tab →
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Survey Status</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {survey.is_active
                      ? 'Survey is active and accepting responses.'
                      : 'Survey is paused. Visitors will see a "survey closed" message.'}
                  </p>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      survey.is_active
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {survey.is_active ? 'Pause Survey' : 'Activate Survey'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'responses' && (
          <motion.div
            key="responses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Responses</h2>
              {survey.responses.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </button>
              )}
            </div>

            {survey.responses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-medium mb-2">No responses yet</p>
                <p className="text-sm">Share the QR code to start collecting feedback!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-600">{survey.responses.length}</div>
                    <div className="text-sm text-slate-500 font-medium">Total Responses</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {survey.responses.length > 0
                        ? Math.round(
                            survey.responses.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
                              survey.responses.length /
                              1000
                          )
                        : 0}s
                    </div>
                    <div className="text-sm text-slate-500 font-medium">Avg. Duration</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600">{questions.length}</div>
                    <div className="text-sm text-slate-500 font-medium">Questions</div>
                  </div>
                </div>

                {/* Question-by-question breakdown */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Results by Question</h3>
                  {survey.questions.map((question) => {
                    const questionStats = stats?.[question.id] as Record<string, unknown> | undefined
                    const typeInfo = questionTypeInfo[question.type]
                    const total = Number(questionStats?.total || 0)

                    return (
                      <div key={question.id} className="border border-slate-100 rounded-xl p-5">
                        {/* Question header with response count badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{typeInfo?.emoji || '❓'}</span>
                            <div>
                              <p className="font-semibold text-slate-800">{question.text || 'Untitled question'}</p>
                              <p className="text-xs text-slate-500">{typeInfo?.label || question.type}</p>
                            </div>
                          </div>
                          {total > 0 && (
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                              {total} response{total !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Swipe: Stacked segment bar */}
                        {questionStats?.type === 'swipe' && (() => {
                          const labels = questionStats.labels as Record<string, string> || {}
                          const rightPct = total > 0 ? Math.round((Number(questionStats.right) / total) * 100) : 0
                          const leftPct = total > 0 ? Math.round((Number(questionStats.left) / total) * 100) : 0
                          const upPct = total > 0 ? Math.round((Number(questionStats.up) / total) * 100) : 0
                          const segments = [
                            { label: labels.right_label || 'Yes', count: Number(questionStats.right), pct: rightPct, color: 'bg-emerald-500', dot: 'bg-emerald-500' },
                            { label: labels.left_label || 'No', count: Number(questionStats.left), pct: leftPct, color: 'bg-red-400', dot: 'bg-red-400' },
                            ...(Number(questionStats.up) > 0 ? [{ label: labels.up_label || 'Meh', count: Number(questionStats.up), pct: upPct, color: 'bg-amber-400', dot: 'bg-amber-400' }] : []),
                          ]
                          return (
                            <div>
                              {/* Stacked bar */}
                              <div className="h-8 rounded-lg overflow-hidden flex">
                                {segments.map((seg, i) => (
                                  <motion.div
                                    key={seg.label}
                                    className={`${seg.color} flex items-center justify-center text-white text-xs font-bold`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${seg.pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                  >
                                    {seg.pct >= 15 ? `${seg.pct}%` : ''}
                                  </motion.div>
                                ))}
                              </div>
                              {/* Legend */}
                              <div className="flex gap-4 mt-3">
                                {segments.map(seg => (
                                  <div key={seg.label} className="flex items-center gap-1.5 text-sm">
                                    <div className={`w-2.5 h-2.5 rounded-full ${seg.dot}`} />
                                    <span className="text-slate-600 font-medium">{seg.label}</span>
                                    <span className="text-slate-400">{seg.count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Scale: Average bar + distribution histogram */}
                        {questionStats?.type === 'slider' && (() => {
                          const avg = Number(questionStats.average)
                          const distribution = (questionStats.distribution as number[]) || [0, 0, 0, 0, 0]
                          const maxBucket = Math.max(...distribution, 1)
                          const labels = questionStats.labels as Record<string, string> || {}
                          const bucketLabels = ['0–20', '21–40', '41–60', '61–80', '81–100']
                          const avgColor = avg >= 70 ? 'text-emerald-600' : avg >= 40 ? 'text-amber-600' : 'text-red-500'

                          return (
                            <div>
                              {/* Average score */}
                              <div className="flex items-center gap-4 mb-3">
                                <span className={`text-3xl font-bold ${avgColor}`}>{avg}%</span>
                                <div className="flex-1">
                                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${avg}%` }}
                                      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                                    />
                                  </div>
                                  {(labels.min_label || labels.max_label) && (
                                    <div className="flex justify-between mt-1">
                                      <span className="text-[10px] text-slate-400">{labels.min_label}</span>
                                      <span className="text-[10px] text-slate-400">{labels.max_label}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Distribution histogram */}
                              {distribution.some(v => v > 0) && (
                                <div className="space-y-1.5 mt-4">
                                  <p className="text-xs font-medium text-slate-500 mb-2">Distribution</p>
                                  {bucketLabels.map((label, i) => (
                                    <div key={label} className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 w-12 text-right font-mono">{label}</span>
                                      <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden">
                                        <motion.div
                                          className="h-full bg-indigo-400/70 rounded"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(distribution[i] / maxBucket) * 100}%` }}
                                          transition={{ duration: 0.5, delay: i * 0.08 }}
                                        />
                                      </div>
                                      <span className="text-xs text-slate-500 w-6 font-medium">{distribution[i]}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* Options: Horizontal bar chart */}
                        {questionStats?.type === 'tap' && (() => {
                          const options = questionStats.options as Record<string, number>
                          const sorted = Object.entries(options).sort(([, a], [, b]) => b - a)
                          const maxCount = Math.max(...Object.values(options), 1)
                          const barColors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500']

                          return (
                            <div className="space-y-2.5">
                              {sorted.map(([opt, count], i) => {
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                return (
                                  <div key={opt}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-700">{opt}</span>
                                      <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-6 bg-slate-50 rounded-lg overflow-hidden">
                                      <motion.div
                                        className={`h-full ${barColors[i % barColors.length]} rounded-lg`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / maxCount) * 100}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {!questionStats && (
                          <p className="text-sm text-slate-400 italic">No responses for this question yet</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Survey?</h3>
                <p className="text-slate-500">
                  This will permanently delete <strong>&quot;{survey.title}&quot;</strong> and all {survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    deleteConfirmText === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-100 text-red-300 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { Survey, Question, Response, QuestionType } from '@/lib/types'
import Link from 'next/link'

const questionTypeInfo: Partial<Record<QuestionType, { label: string; emoji: string }>> = {
  swipe: { label: 'Swipe Cards', emoji: '👆' },
  slider: { label: 'Emotion Slider', emoji: '😊' },
  tap: { label: 'Tap to Select', emoji: '💥' },
  tap_meter: { label: 'Tap Meter', emoji: '📈' },
  rolodex: { label: 'Carousel', emoji: '🎠' },
  stars: { label: 'Star Rating', emoji: '⭐' },
  thermometer: { label: 'Thermometer', emoji: '🌡️' },
  fanned: { label: 'Fanned Cards', emoji: '🃏' },
  fanned_swipe: { label: 'Fanned Swipe', emoji: '🎴' },
  stacked: { label: 'Card Stack', emoji: '📚' },
  rank: { label: 'Drag & Rank', emoji: '📊' },
  counter: { label: 'Tap Counter', emoji: '🔢' },
  // Mini-games
  tilt_maze: { label: 'Tilt Maze', emoji: '🎱' },
  racing_lanes: { label: 'Racing Lanes', emoji: '🏎️' },
  slot_machine: { label: 'Slot Machine', emoji: '🎰' },
  gravity_drop: { label: 'Gravity Drop', emoji: '🪂' },
  bubble_pop: { label: 'Bubble Pop', emoji: '🫧' },
  bullseye: { label: 'Bullseye', emoji: '🎯' },
  slingshot: { label: 'Slingshot', emoji: '🏹' },
  scratch_card: { label: 'Scratch Card', emoji: '🎫' },
}

interface SurveyData extends Survey {
  questions: Question[]
  responses: Response[]
}

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.surveyId as string

  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Toggle state
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Question editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedQuestionText, setEditedQuestionText] = useState('')
  const [editedQuestionConfig, setEditedQuestionConfig] = useState<Record<string, unknown>>({})
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  useEffect(() => {
    if (survey) {
      generateQRCode()
      setEditedTitle(survey.title)
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

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === survey?.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ title: editedTitle.trim() })
        .eq('id', surveyId)

      if (error) throw error

      setSurvey(prev => prev ? { ...prev, title: editedTitle.trim() } : null)
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
      alert('Failed to update title')
    } finally {
      setIsSavingTitle(false)
    }
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

  const startEditingQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditedQuestionText(question.text)
    setEditedQuestionConfig(question.config || {})
  }

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null)
    setEditedQuestionText('')
    setEditedQuestionConfig({})
  }

  const handleSaveQuestion = async (questionId: string) => {
    setIsSavingQuestion(true)
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          text: editedQuestionText.trim(),
          config: editedQuestionConfig,
        })
        .eq('id', questionId)

      if (error) throw error

      // Update local state
      setSurvey(prev => {
        if (!prev) return null
        return {
          ...prev,
          questions: prev.questions.map(q =>
            q.id === questionId
              ? { ...q, text: editedQuestionText.trim(), config: editedQuestionConfig }
              : q
          ),
        }
      })
      cancelEditingQuestion()
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question')
    } finally {
      setIsSavingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      // Update local state
      setSurvey(prev => {
        if (!prev) return null
        return {
          ...prev,
          questions: prev.questions.filter(q => q.id !== questionId),
        }
      })
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
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

  const calculateStats = () => {
    if (!survey?.responses.length || !survey?.questions.length) {
      return null
    }

    const stats: Record<string, unknown> = {}

    survey.questions.forEach((question) => {
      const answers = survey.responses
        .map(r => r.answers.find((a: { question_id: string }) => a.question_id === question.id)?.value)
        .filter(Boolean)

      if (question.type === 'swipe') {
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
      } else if (question.type === 'slider') {
        const values = answers.filter((a): a is number => typeof a === 'number')
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length
        stats[question.id] = {
          type: 'slider',
          total: values.length,
          average: Math.round(avg),
        }
      } else if (question.type === 'tap') {
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
      }
    })

    return stats
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
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <Link
            href="/admin"
            className="text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center gap-1 font-medium transition-colors"
          >
            ← Back to surveys
          </Link>

          {/* Editable title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-3xl font-bold text-slate-800 bg-white border-2 border-indigo-300 rounded-xl px-3 py-1 focus:outline-none focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') {
                    setEditedTitle(survey.title)
                    setIsEditingTitle(false)
                  }
                }}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSavingTitle ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditedTitle(survey.title)
                  setIsEditingTitle(false)
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-3xl font-bold text-slate-800">{survey.title}</h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit title"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <p className="text-slate-500 mt-1 font-medium">
            {survey.questions.length} questions • {survey.responses.length} responses
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

      {/* Warning banner for locked questions */}
      {hasResponses && (
        <motion.div
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-semibold text-amber-800">Questions are locked</p>
            <p className="text-amber-700 text-sm">
              This survey has {survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}.
              Questions cannot be edited to preserve data integrity. You can still edit the title and toggle the survey status.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-slate-800 mb-4">Share Survey</h2>

          {qrCodeUrl && (
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="rounded-xl shadow-sm" />
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={downloadQRCode}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold hover-lift shadow-md shadow-indigo-200"
            >
              Download QR Code
            </button>

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
        </motion.div>

        {/* Results Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 card-hover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-slate-800 mb-4">Results Summary</h2>

          {survey.responses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="font-medium">No responses yet</p>
              <p className="text-sm">Share the QR code to start collecting feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {survey.questions.map((question) => {
                const questionStats = stats?.[question.id] as Record<string, unknown> | undefined

                return (
                  <div key={question.id} className="border-b border-slate-100 pb-4 last:border-0">
                    <p className="font-semibold text-slate-800 mb-2">{question.text}</p>

                    {questionStats?.type === 'swipe' && (
                      <div className="flex gap-4 text-sm font-medium">
                        <span className="text-emerald-600">
                          ✓ {String(questionStats.right)} ({Math.round((Number(questionStats.right) / Number(questionStats.total)) * 100)}%)
                        </span>
                        <span className="text-red-500">
                          ✗ {String(questionStats.left)} ({Math.round((Number(questionStats.left) / Number(questionStats.total)) * 100)}%)
                        </span>
                        <span className="text-amber-500">
                          ~ {String(questionStats.up)} ({Math.round((Number(questionStats.up) / Number(questionStats.total)) * 100)}%)
                        </span>
                      </div>
                    )}

                    {questionStats?.type === 'slider' && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${questionStats.average}%` }}
                            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-600 min-w-[3rem]">
                          {String(questionStats.average)}%
                        </span>
                      </div>
                    )}

                    {questionStats?.type === 'tap' && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(questionStats.options as Record<string, number>).map(([opt, count]) => (
                          <span
                            key={opt}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                          >
                            {opt}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Questions List */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Questions</h2>
          {hasResponses ? (
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
              <span>🔒</span> Locked
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              ✏️ Editable
            </span>
          )}
        </div>
        <div className="space-y-3">
          {survey.questions.map((question, index) => {
            const isEditing = editingQuestionId === question.id
            const typeInfo = questionTypeInfo[question.type] || { label: question.type, emoji: '❓' }

            return (
              <div
                key={question.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEditing
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                {isEditing ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo.emoji}</span>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                        {typeInfo.label}
                      </span>
                      <span className="text-slate-400 text-sm">#{index + 1}</span>
                    </div>

                    <input
                      type="text"
                      value={editedQuestionText}
                      onChange={(e) => setEditedQuestionText(e.target.value)}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900"
                      autoFocus
                    />

                    {/* Swipe config */}
                    {question.type === 'swipe' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editedQuestionConfig.show_meh as boolean) ?? false}
                          onChange={(e) => setEditedQuestionConfig({
                            ...editedQuestionConfig,
                            show_meh: e.target.checked
                          })}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-600">Include &quot;Meh&quot; option</span>
                      </label>
                    )}

                    {/* Options config for tap, rolodex, etc. */}
                    {['tap', 'tap_meter', 'rolodex', 'fanned', 'fanned_swipe', 'stacked'].includes(question.type) && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-medium">Options</label>
                        {((editedQuestionConfig.options as string[]) || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...((editedQuestionConfig.options as string[]) || [])]
                                newOptions[optIndex] = e.target.value
                                setEditedQuestionConfig({ ...editedQuestionConfig, options: newOptions })
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = ((editedQuestionConfig.options as string[]) || []).filter((_, i) => i !== optIndex)
                                setEditedQuestionConfig({ ...editedQuestionConfig, options: newOptions })
                              }}
                              className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentOptions = (editedQuestionConfig.options as string[]) || []
                            setEditedQuestionConfig({ ...editedQuestionConfig, options: [...currentOptions, ''] })
                          }}
                          className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-500 text-sm"
                        >
                          + Add option
                        </button>
                      </div>
                    )}

                    {/* Tap multi-select toggle */}
                    {question.type === 'tap' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editedQuestionConfig.multi_select as boolean) ?? true}
                          onChange={(e) => setEditedQuestionConfig({
                            ...editedQuestionConfig,
                            multi_select: e.target.checked
                          })}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-600">Allow multiple selections</span>
                      </label>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSaveQuestion(question.id)}
                        disabled={isSavingQuestion}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSavingQuestion ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditingQuestion}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{question.text || <span className="text-slate-400 italic">No question text</span>}</p>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                        <span>{typeInfo.emoji}</span> {typeInfo.label}
                      </p>
                    </div>
                    {!hasResponses && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingQuestion(question)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete question"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

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

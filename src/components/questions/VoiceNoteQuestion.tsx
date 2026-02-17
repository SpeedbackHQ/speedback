'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface VoiceNoteQuestionProps {
  question: Question
  onAnswer: (answer: string) => void
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'submitting'

// Deterministic bar heights from index (no Math.random in render)
function getBarPhase(index: number): number {
  return (index * 137.508) % 360 // golden angle spread
}

export function VoiceNoteQuestion({ question, onAnswer }: VoiceNoteQuestionProps) {
  const {
    max_duration = 15,
  } = question.config as { max_duration?: number }

  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [barHeights, setBarHeights] = useState<number[]>(Array(16).fill(8))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveformRef.current) clearInterval(waveformRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const getMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return null
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
    return null
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setError('Audio recording not supported in this browser')
        return
      }

      const mimeType = getMimeType()
      if (!mimeType) {
        setError('Audio recording not supported in this browser')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        audioBlobRef.current = blob

        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = URL.createObjectURL(blob)

        setState('recorded')
      }

      recorder.start(100) // collect data every 100ms
      startTimeRef.current = Date.now()
      setState('recording')
      setDuration(0)

      if (navigator.vibrate) navigator.vibrate(30)

      // Timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)

        if (elapsed >= max_duration) {
          recorder.stop()
          stream.getTracks().forEach(t => t.stop())
          if (timerRef.current) clearInterval(timerRef.current)
          if (waveformRef.current) clearInterval(waveformRef.current)
        }
      }, 100)

      // Waveform animation
      waveformRef.current = setInterval(() => {
        setBarHeights(prev =>
          prev.map((_, i) => {
            const phase = getBarPhase(i)
            const time = Date.now() / 200
            return 8 + Math.abs(Math.sin(time + phase * 0.0174533)) * 24
          })
        )
      }, 80)

    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone permission denied')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found')
      } else {
        setError('Could not start recording')
      }
    }
  }, [max_duration, getMimeType])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (waveformRef.current) clearInterval(waveformRef.current)
    setBarHeights(Array(16).fill(8))
  }, [])

  const handleReRecord = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
    audioBlobRef.current = null
    setDuration(0)
    setIsPlaying(false)
    setState('idle')
  }, [])

  const handleSend = useCallback(() => {
    if (!audioBlobRef.current) return
    setState('submitting')

    if (navigator.vibrate) navigator.vibrate([20, 10, 40])

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setTimeout(() => onAnswer(dataUrl), 400)
    }
    reader.readAsDataURL(audioBlobRef.current)
  }, [onAnswer])

  const togglePlayback = useCallback(() => {
    if (!audioUrlRef.current) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrlRef.current)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds)
    return `0:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-8 text-sm">
        {state === 'idle' && `Tap the mic to record (up to ${max_duration}s)`}
        {state === 'recording' && 'Tap to stop'}
        {state === 'recorded' && 'Listen back or send'}
        {state === 'submitting' && 'Sending...'}
      </p>

      {/* Main action area */}
      <div className="flex flex-col items-center gap-6">

        {/* Mic button / Waveform */}
        <AnimatePresence mode="wait">
          {(state === 'idle' || state === 'recording') && (
            <motion.div key="mic-area" className="relative flex flex-col items-center gap-4">
              {/* Pulsing ring during recording */}
              {state === 'recording' && (
                <motion.div
                  className="absolute inset-0 w-24 h-24 rounded-full bg-red-400 m-auto"
                  style={{ top: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Mic button */}
              <motion.button
                onClick={state === 'idle' ? startRecording : stopRecording}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-colors ${
                  state === 'recording' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                }`}
                whileTap={{ scale: 0.92 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="text-4xl">{state === 'recording' ? '⏹' : '🎤'}</span>
              </motion.button>

              {/* Waveform bars */}
              {state === 'recording' && (
                <div className="flex items-center gap-0.5 h-8">
                  {barHeights.map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-red-400 rounded-full"
                      animate={{ height: h }}
                      transition={{ duration: 0.08 }}
                    />
                  ))}
                </div>
              )}

              {/* Timer */}
              {state === 'recording' && (
                <motion.div
                  className="text-lg font-mono text-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {formatTime(duration)} / {formatTime(max_duration)}
                </motion.div>
              )}
            </motion.div>
          )}

          {(state === 'recorded' || state === 'submitting') && (
            <motion.div
              key="playback"
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Playback button */}
              <motion.button
                onClick={togglePlayback}
                disabled={state === 'submitting'}
                className="w-20 h-20 rounded-full bg-violet-500 flex items-center justify-center shadow-lg hover:bg-violet-500 transition-colors"
                whileTap={{ scale: 0.92 }}
              >
                <span className="text-3xl text-white">{isPlaying ? '⏸' : '▶'}</span>
              </motion.button>

              <span className="text-sm text-gray-500 font-medium">
                {formatTime(duration)} recorded
              </span>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <motion.button
                  onClick={handleReRecord}
                  disabled={state === 'submitting'}
                  className="flex-1 py-3 rounded-xl font-bold text-base bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Re-record
                </motion.button>
                <motion.button
                  onClick={handleSend}
                  disabled={state === 'submitting'}
                  className={`flex-1 py-3 rounded-xl font-bold text-base shadow-lg transition-colors ${
                    state === 'submitting' ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-600'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {state === 'submitting' ? 'Sending...' : 'Send'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.p
            className="text-red-500 text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  )
}

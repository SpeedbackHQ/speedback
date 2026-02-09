'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/types'

interface ShoppingCartQuestionProps {
  question: Question
  onAnswer: (answer: string[]) => void
}

const shelfColors = [
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', tag: 'bg-purple-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', tag: 'bg-pink-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', tag: 'bg-cyan-500' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', tag: 'bg-amber-500' },
]

export function ShoppingCartQuestion({ question, onAnswer }: ShoppingCartQuestionProps) {
  const { options: rawOptions = [] } = question.config as { options?: string[] }
  const options = (rawOptions as string[]).slice(0, 4)

  const [cart, setCart] = useState<string[]>([])
  const [flyingItem, setFlyingItem] = useState<string | null>(null)

  const handleAdd = useCallback((option: string) => {
    const isInCart = cart.includes(option)
    if (navigator.vibrate) navigator.vibrate(isInCart ? 20 : 40)

    if (isInCart) {
      setCart(prev => prev.filter(o => o !== option))
    } else {
      setFlyingItem(option)
      setTimeout(() => {
        setFlyingItem(null)
        setCart(prev => [...prev, option])
      }, 350)
    }
  }, [cart])

  const handleSubmit = useCallback(() => {
    if (cart.length === 0) return
    if (navigator.vibrate) navigator.vibrate([30, 50, 100])
    onAnswer(cart)
  }, [cart, onAnswer])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.h2
        className="text-2xl font-bold text-gray-800 text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {question.text}
      </motion.h2>

      <p className="text-gray-500 text-center mb-4 text-sm">
        Add items to your cart!
      </p>

      {/* Cart indicator */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-5"
        animate={flyingItem ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <span className="text-2xl">🛒</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={cart.length}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {cart.length}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Items on shelf */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isInCart = cart.includes(option)
          const isFlying = flyingItem === option
          const color = shelfColors[index % shelfColors.length]

          return (
            <motion.button
              key={option}
              onClick={() => handleAdd(option)}
              className={`w-full relative rounded-xl border-2 p-4 transition-all ${
                isInCart
                  ? `${color.bg} ${color.border} ${color.text}`
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isFlying ? 0.3 : 1,
                x: 0,
                scale: isFlying ? 0.8 : 1,
                y: isFlying ? -40 : 0,
              }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{option}</span>
                <motion.div
                  animate={{ rotate: isInCart ? 0 : 0, scale: isInCart ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {isInCart ? (
                    <span className="text-sm px-3 py-1 rounded-full bg-white/60 font-medium">
                      In cart ✓
                    </span>
                  ) : (
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                      + Add
                    </span>
                  )}
                </motion.div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={cart.length === 0}
        className={`w-full mt-5 py-4 font-bold text-lg rounded-xl shadow-lg transition-colors ${
          cart.length > 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
      >
        {cart.length > 0 ? `🛒 Checkout (${cart.length})` : 'Add items to cart'}
      </motion.button>
    </div>
  )
}

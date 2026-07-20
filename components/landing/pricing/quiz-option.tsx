'use client'

import { Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuizOptionProps {
  title: string
  description?: string
  ctaLabel: string
  selected: boolean
  onSelect: () => void
  index?: number
}

export function QuizOption({ title, description, ctaLabel, selected, onSelect, index = 0 }: QuizOptionProps) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full text-left rounded-xl sm:rounded-2xl border p-4 sm:p-6 overflow-hidden transition-colors duration-300 ${
        selected
          ? 'border-[#DDA46F] bg-[#DDA46F]/[0.07] shadow-lg shadow-[#DDA46F]/10'
          : 'border-[#420c14]/12 bg-white hover:border-[#DDA46F]/50 hover:bg-[#f5f2eb]/40'
      }`}
    >
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <span
          className={`font-serif text-xs sm:text-sm tracking-[0.15em] transition-colors duration-300 ${
            selected ? 'text-[#DDA46F]' : 'text-[#420c14]/25 group-hover:text-[#DDA46F]/60'
          }`}
        >
          {number}
        </span>
        <motion.span
          initial={false}
          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#DDA46F] text-[#420c14] flex items-center justify-center flex-shrink-0"
        >
          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
        </motion.span>
      </div>

      <p className="font-serif text-base sm:text-lg leading-snug text-[#420c14] mb-1.5">{title}</p>
      {description && (
        <p className="text-xs sm:text-sm text-[#420c14]/55 leading-relaxed mb-4 sm:mb-5">{description}</p>
      )}

      <div
        className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors duration-300 ${
          selected ? 'text-[#DDA46F]' : 'text-[#420c14]/45 group-hover:text-[#420c14]'
        }`}
      >
        {ctaLabel}
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>

      <motion.div
        initial={false}
        animate={{ width: selected ? '100%' : '0%' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 left-0 h-[3px] bg-[#DDA46F]"
      />
    </motion.button>
  )
}

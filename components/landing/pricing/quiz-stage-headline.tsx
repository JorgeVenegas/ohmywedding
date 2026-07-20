'use client'

import { motion } from 'framer-motion'

interface QuizStageHeadlineProps {
  eyebrow: string
  title: string
}

// The one headline treatment for every "stage" of the pricing quiz — mid-quiz
// hint, the skipped/compare view, and the recommendation heading — so moving
// between them reads as one continuous piece instead of three different
// headings bolted on at different times.
export function QuizStageHeadline({ eyebrow, title }: QuizStageHeadlineProps) {
  return (
    <div className="text-center">
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-block text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-3 sm:mb-4"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#420c14] leading-snug max-w-2xl mx-auto"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 40, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="h-[2px] bg-[#DDA46F]/50 mx-auto mt-4 sm:mt-5 rounded-full"
      />
    </div>
  )
}

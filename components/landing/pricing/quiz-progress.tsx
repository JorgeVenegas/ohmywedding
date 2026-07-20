'use client'

import { motion } from 'framer-motion'
import { QuizStageHeadline } from './quiz-stage-headline'

interface QuizProgressProps {
  step: number
  total: number
  hint: string
  stepLabel: string
}

export function QuizProgress({ step, total, hint, stepLabel }: QuizProgressProps) {
  return (
    <div className="mb-10 sm:mb-14">
      <QuizStageHeadline eyebrow={stepLabel} title={hint} />

      <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-7">
        {Array.from({ length: total }).map((_, i) => (
          <motion.span
            key={i}
            layout
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`h-1.5 rounded-full ${
              i === step
                ? 'w-9 sm:w-11 bg-[#DDA46F]'
                : i < step
                  ? 'w-4 sm:w-5 bg-[#DDA46F]/40'
                  : 'w-4 sm:w-5 bg-[#420c14]/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

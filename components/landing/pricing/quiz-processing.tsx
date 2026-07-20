'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function QuizProcessing({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 sm:mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-[#420c14]/10" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#DDA46F] border-r-[#DDA46F]/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 sm:inset-3 rounded-full bg-[#DDA46F]/15"
          animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#DDA46F]" />
          </motion.div>
        </div>
      </div>
      <motion.p
        className="text-sm sm:text-base text-[#420c14]/60 tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </motion.div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { PlannerBillingCycle } from '@/lib/pricing-quiz'

export type BillingCycle = PlannerBillingCycle

interface Labels {
  once?: string
  subscription?: string
  monthly?: string
  annual?: string
  save?: string
}

interface BillingCycleToggleProps {
  cycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
  // 'layered' (default): Per Wedding / Subscription with monthly|annual sub-toggle
  // 'flat': single row with all three options — used in the compare grid
  variant?: 'layered' | 'flat'
  labels?: Labels
}

export function BillingCycleToggle({ cycle, onChange, variant = 'layered', labels }: BillingCycleToggleProps) {
  const isSubscription = cycle === 'monthly' || cycle === 'annual'

  const l = {
    once:         labels?.once         ?? 'Per Wedding',
    subscription: labels?.subscription ?? 'Subscription',
    monthly:      labels?.monthly      ?? 'Monthly',
    annual:       labels?.annual       ?? 'Annual',
    save:         labels?.save         ?? 'Save ~44%',
  }

  const btnBase = 'px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300'
  const active  = 'bg-[#420c14] text-white shadow-sm'
  const idle    = 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
  const goldActive = 'bg-[#DDA46F] text-[#420c14] shadow-sm'

  if (variant === 'flat') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-center mb-6 sm:mb-8"
      >
        <div className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1">
          <button onClick={() => onChange('once')}    className={`${btnBase} ${cycle === 'once'    ? active : idle}`}>{l.once}</button>
          <button onClick={() => onChange('monthly')} className={`${btnBase} ${cycle === 'monthly' ? active : idle}`}>{l.monthly}</button>
          <button onClick={() => onChange('annual')}  className={`${btnBase} flex items-center gap-1.5 ${cycle === 'annual'  ? active : idle}`}>
            {l.annual}
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${cycle === 'annual' ? 'bg-white/20 text-white' : 'bg-[#DDA46F]/20 text-[#DDA46F]'}`}>
              {l.save}
            </span>
          </button>
        </div>
      </motion.div>
    )
  }

  // layered variant (default): two-row structure for result/recommendation views
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3 mb-8 sm:mb-10"
    >
      <div className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1">
        <button onClick={() => onChange('once')} className={`${btnBase} ${!isSubscription ? active : idle}`}>{l.once}</button>
        <button onClick={() => onChange(cycle === 'annual' ? 'annual' : 'monthly')} className={`${btnBase} ${isSubscription ? active : idle}`}>{l.subscription}</button>
      </div>

      <AnimatePresence>
        {isSubscription && (
          <motion.div
            key="sub-toggle"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1"
          >
            <button onClick={() => onChange('monthly')} className={`${btnBase} ${cycle === 'monthly' ? goldActive : idle}`}>{l.monthly}</button>
            <button onClick={() => onChange('annual')}  className={`${btnBase} flex items-center gap-1.5 ${cycle === 'annual' ? goldActive : idle}`}>
              {l.annual}
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${cycle === 'annual' ? 'bg-[#420c14]/15 text-[#420c14]' : 'bg-[#DDA46F]/20 text-[#DDA46F]'}`}>
                {l.save}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

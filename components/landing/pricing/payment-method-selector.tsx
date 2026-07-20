'use client'

import { CreditCard } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'
import { motion } from 'framer-motion'

export type PaymentMethod = 'card' | 'msi'

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod
  onChange: (method: PaymentMethod) => void
  msiEnabled?: boolean
}

export function PaymentMethodSelector({ paymentMethod, onChange, msiEnabled = false }: PaymentMethodSelectorProps) {
  const { t } = useI18n()

  // When MSI is disabled globally, don't render anything
  if (!msiEnabled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center mb-8 sm:mb-10"
    >
      <div>
        <p className="text-center text-[10px] text-[#420c14]/40 mb-2 tracking-wider uppercase">{t('landing.pricing.paymentMethod')}</p>
        <div className="inline-flex items-center rounded-xl bg-white border border-[#420c14]/10 shadow-sm p-1 gap-1">
          <button
            onClick={() => onChange('card')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              paymentMethod === 'card' ? 'bg-[#420c14] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t('landing.pricing.card')}
          </button>
          <button
            onClick={() => onChange('msi')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              paymentMethod === 'msi' ? 'bg-[#420c14] text-white shadow-sm' : 'text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            3 o 6 MSI
          </button>
        </div>
      </div>
    </motion.div>
  )
}

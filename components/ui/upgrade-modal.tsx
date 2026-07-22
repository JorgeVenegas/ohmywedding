"use client"

import React from 'react'
import { Crown, Sparkles, Check, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  INVITATION_PRICING,
  MANAGEMENT_PRICING,
  getTierLocaleCopy,
  type InvitationTier,
  type ManagementTier,
} from '@/lib/subscription-shared'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/components/contexts/i18n-context'

export type UpgradeReason =
  | 'general'
  | 'custom_registry'
  | 'plan_indicator'
  | 'guest_limit'
  | 'group_limit'
  | 'send_invites'
  | 'invite_settings'
  | 'invitation_tracking'
  | 'rsvp_system'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason: UpgradeReason
  currentCount?: number
  limit?: number
  weddingId?: string
}

const INV_TIERS: InvitationTier[] = ['basic', 'personalized', 'bespoke']
const MGMT_TIERS: ManagementTier[] = ['basic', 'pro', 'agency']

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  currentCount,
  limit,
  weddingId,
}: UpgradeModalProps) {
  const { t, locale } = useI18n()

  const content = t(`upgradeModal.reasons.${reason}` as any) as unknown as { title: string; description: string }
  const settingsHref = weddingId
    ? `/admin/${encodeURIComponent(weddingId)}/settings?section=subscription`
    : '/admin'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#f5f2eb] rounded-[1.5rem] shadow-2xl pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#DDA46F] via-[#c99560] to-[#DDA46F]" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#420c14]/5 hover:bg-[#420c14]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#420c14]/60" />
              </button>

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DDA46F] to-[#c99560] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#DDA46F]/20">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#420c14]">{content.title}</h2>
                    <p className="text-sm text-[#420c14]/60 mt-1">{content.description}</p>
                  </div>
                </div>

                {/* Usage bar (if applicable) */}
                {currentCount !== undefined && limit !== undefined && (
                  <div className="bg-white rounded-xl p-4 border border-[#420c14]/10 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#420c14]/70">
                        {locale === 'es' ? 'Uso actual' : 'Current Usage'}
                      </span>
                      <span className="text-sm font-bold text-[#420c14]">
                        {currentCount} / {limit}
                      </span>
                    </div>
                    <div className="w-full bg-[#420c14]/5 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-[#DDA46F] to-[#c99560] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Two-axis tier overview */}
                <div className="space-y-4 mb-6">
                  {/* Invitation Design axis */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DDA46F] mb-2">
                      {t('upgradeModal.invitationAxis')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {INV_TIERS.map((tier, i) => {
                        const pricing = INVITATION_PRICING[tier]
                        const name = getTierLocaleCopy('invitation', tier, locale).name
                        const isPopular = tier === 'personalized'
                        return (
                          <motion.div
                            key={tier}
                            className={`relative rounded-xl border-2 p-3 ${
                              isPopular
                                ? 'border-[#DDA46F] bg-[#DDA46F]/5'
                                : 'border-border/60 bg-white'
                            }`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * i }}
                          >
                            {isPopular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#420c14] text-[#f5f2eb] whitespace-nowrap">
                                <Sparkles className="w-2 h-2" />
                                {t('upgradeModal.popular')}
                              </span>
                            )}
                            <p className="text-xs font-semibold text-[#420c14] mb-0.5">{name}</p>
                            <p className="text-[10px] text-[#420c14]/50">{pricing.priceDisplayMXN}</p>
                            <p className="text-[9px] text-[#420c14]/35">{t('upgradeModal.onetime')}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Management axis */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DDA46F] mb-2">
                      {t('upgradeModal.managementAxis')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {MGMT_TIERS.map((tier, i) => {
                        const pricing = MANAGEMENT_PRICING[tier]
                        const name = getTierLocaleCopy('management', tier, locale).name
                        const isPopular = tier === 'pro'
                        return (
                          <motion.div
                            key={tier}
                            className={`relative rounded-xl border-2 p-3 ${
                              isPopular
                                ? 'border-[#DDA46F] bg-[#DDA46F]/5'
                                : 'border-border/60 bg-white'
                            }`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * i + 0.15 }}
                          >
                            {isPopular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#420c14] text-[#f5f2eb] whitespace-nowrap">
                                <Sparkles className="w-2 h-2" />
                                {t('upgradeModal.popular')}
                              </span>
                            )}
                            <p className="text-xs font-semibold text-[#420c14] mb-0.5">{name}</p>
                            <p className="text-[10px] text-[#420c14]/50">{pricing.priceDisplayMXN}</p>
                            <p className="text-[9px] text-[#420c14]/35">{t('upgradeModal.onetime')}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {FEATURE_HIGHLIGHTS[locale === 'es' ? 'es' : 'en'].map((f, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-2 bg-white rounded-lg px-3 py-2.5 border border-[#420c14]/5"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.05 * i + 0.3 }}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#DDA46F]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#DDA46F]" />
                      </div>
                      <span className="text-[11px] text-[#420c14]/75 leading-snug">{f}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={settingsHref} className="flex-1" onClick={onClose}>
                    <Button
                      className="w-full h-12 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] tracking-wide transition-all duration-300 gap-2"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('upgradeModal.viewAllPlans')}
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    size="lg"
                    className="text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5"
                  >
                    {t('upgradeModal.maybeLater')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const FEATURE_HIGHLIGHTS: Record<string, string[]> = {
  en: [
    'Personalized WhatsApp invitations',
    'Full RSVP & confirmation tracking',
    'Custom subdomain for your wedding site',
    'Seating chart designer',
    'Custom gift registry with Stripe payouts',
    'Activity reports & analytics',
  ],
  es: [
    'Invitaciones personalizadas por WhatsApp',
    'Sistema completo de RSVP y confirmaciones',
    'Subdominio personalizado para tu boda',
    'Diseñador de mapa de mesas',
    'Mesa de regalos con pagos seguros',
    'Reportes de actividad y analíticas',
  ],
}

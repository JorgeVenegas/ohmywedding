'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Users, Sparkles, ClipboardList, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizOption } from './quiz-option'
import { QuizProcessing } from './quiz-processing'
import { QuizProgress } from './quiz-progress'
import { QuizStageHeadline } from './quiz-stage-headline'
import { PlanCard } from './plan-card'
import { PaymentMethodSelector, type PaymentMethod } from './payment-method-selector'
import { getLocalizedInvitationCard, getLocalizedManagementCard } from './localized-cards'
import type { CheckoutTarget } from './types'
import { INVITATION_PRICING, MANAGEMENT_PRICING, formatMXNFromCents, type InvitationTier } from '@/lib/subscription-shared'
import {
  recommendCouplePlan,
  type CoupleQuizAnswers,
  type GuestBand,
  type InvitationStyleAnswer,
  type ManagementNeedAnswer,
} from '@/lib/pricing-quiz'

const NS = 'landingCouples'

const GUEST_OPTIONS: GuestBand[] = ['under100', '100to250', 'over250']
const STYLE_OPTIONS: InvitationStyleAnswer[] = ['simple', 'unique', 'custom']
const MANAGEMENT_OPTIONS: ManagementNeedAnswer[] = ['essentials', 'fullToolkit', 'hasPlanner']
const INVITATION_TIERS = Object.keys(INVITATION_PRICING) as InvitationTier[]

interface CouplePricingQuizProps {
  onCheckout: (target: CheckoutTarget) => void
  isLoading: (target: CheckoutTarget) => boolean
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  msiEnabled?: boolean
}

export function CouplePricingQuiz({ onCheckout, isLoading, paymentMethod, onPaymentMethodChange, msiEnabled = false }: CouplePricingQuizProps) {
  const { t, locale } = useTranslation()
  const [step, setStep] = useState(0) // 0..2 = questions, 3 = result
  const [skipped, setSkipped] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [guestBand, setGuestBand] = useState<GuestBand | null>(null)
  const [invitationStyle, setInvitationStyle] = useState<InvitationStyleAnswer | null>(null)
  const [managementNeed, setManagementNeed] = useState<ManagementNeedAnswer | null>(null)
  const processingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (processingTimeout.current) clearTimeout(processingTimeout.current)
  }, [])

  const advanceWithProcessing = (next: () => void) => {
    setIsProcessing(true)
    processingTimeout.current = setTimeout(() => {
      setIsProcessing(false)
      next()
    }, 1100)
  }

  const reset = () => {
    if (processingTimeout.current) clearTimeout(processingTimeout.current)
    setIsProcessing(false)
    setStep(0)
    setSkipped(false)
    setShowCompare(false)
    setGuestBand(null)
    setInvitationStyle(null)
    setManagementNeed(null)
  }

  const answers: CoupleQuizAnswers | null =
    guestBand && invitationStyle && managementNeed
      ? { guestBand, invitationStyle, managementNeed }
      : null

  const recommendation = answers ? recommendCouplePlan(answers) : null

  const rsvpNote = locale === 'es'
    ? '* La función de RSVP solo está disponible con un Plan de Gestión de Invitados. Sin gestión, el RSVP no estará habilitado.'
    : '* RSVP is only available when paired with a Guest Management plan. Without management, RSVP is disabled.'

  const renderInvitationGrid = () => (
    <div>
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8">
        {INVITATION_TIERS.map((tierKey, index) => (
          <PlanCard
            key={tierKey}
            card={getLocalizedInvitationCard(locale, tierKey)}
            index={index}
            isFeatured={tierKey === 'personalized'}
            isTop={tierKey === 'bespoke'}
            loading={isLoading({ axis: 'invitation', tier: tierKey })}
            onCheckout={() => onCheckout({ axis: 'invitation', tier: tierKey })}
          />
        ))}
      </div>
      <p className="text-center text-xs text-[#420c14]/40 mt-4 max-w-xl mx-auto">{rsvpNote}</p>
    </div>
  )

  if (skipped) {
    return (
      <div>
        <div className="mb-8">
          <QuizStageHeadline eyebrow={t('landing.pricing.label')} title={t('landing.pricing.comparePlans')} />
          <div className="text-center mt-4">
            <button onClick={reset} className="text-sm text-[#420c14]/60 underline hover:text-[#420c14]">
              {t(`${NS}.pricingQuiz.takeQuiz`)}
            </button>
          </div>
        </div>
        <PaymentMethodSelector paymentMethod={paymentMethod} onChange={onPaymentMethodChange} msiEnabled={msiEnabled} />
        {renderInvitationGrid()}
      </div>
    )
  }

  if (isProcessing) {
    return <QuizProcessing label={t(`${NS}.pricingQuiz.processing`)} />
  }

  if (step === 3 && recommendation) {
    const invitationCard = getLocalizedInvitationCard(locale, recommendation.invitationTier)
    const managementCard = getLocalizedManagementCard(locale, recommendation.managementTier)
    const invitationPricing = INVITATION_PRICING[recommendation.invitationTier]
    const managementPricing = MANAGEMENT_PRICING[recommendation.managementTier]
    const managementDiscountedCents = Math.round(managementPricing.price_mxn / 2)
    const totalCents = invitationPricing.price_mxn + managementDiscountedCents

    const handleBundleCheckout = () => {
      try {
        sessionStorage.setItem('omw_pending_bundle', JSON.stringify({
          axis: 'management',
          tier: recommendation.managementTier,
        }))
      } catch {
        // sessionStorage unavailable (private browsing, etc.) — bundle continuation
        // is a nice-to-have; the invitation checkout below still proceeds normally.
      }
      onCheckout({ axis: 'invitation', tier: recommendation.invitationTier })
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-10 sm:mb-12">
          <QuizStageHeadline eyebrow={t(`${NS}.pricingQuiz.result.eyebrow`)} title={t(`${NS}.pricingQuiz.result.heading`)} />
        </div>

        <PaymentMethodSelector paymentMethod={paymentMethod} onChange={onPaymentMethodChange} msiEnabled={msiEnabled} />

        {/* Bundle — the primary, emphasized path. Benefits sit to the right of the
            price/CTA at lg instead of stacking underneath. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-md lg:max-w-3xl xl:max-w-4xl mx-auto relative"
        >
          <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#DDA46F] text-[#420c14] text-xs sm:text-sm font-medium tracking-wider">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              {t(`${NS}.pricingQuiz.result.bundleBadge`)}
            </span>
          </div>

          <div className="rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 pt-8 sm:pt-10 lg:p-12 lg:pt-14 bg-[#420c14] border-2 border-[#420c14] text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-x-14 lg:items-start">
            <div>
              <p className="text-xs sm:text-sm text-[#DDA46F] tracking-wide mb-3">{t(`${NS}.pricingQuiz.result.bundleLabel`)}</p>
              <span className="block text-4xl sm:text-5xl lg:text-6xl font-serif text-[#f5f2eb] mb-1">{formatMXNFromCents(totalCents)}</span>
              <p className="text-xs sm:text-sm text-[#f5f2eb]/45 mb-6 sm:mb-8">{t(`${NS}.pricingQuiz.result.bundleTotalNote`)}</p>

              <div className="text-left space-y-2.5 mb-6 sm:mb-8 bg-[#f5f2eb]/5 rounded-xl p-4 lg:p-6">
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-[#f5f2eb]/70">{invitationCard.name} — {t(`${NS}.pricingQuiz.result.invitationAxisLabel`)}</span>
                  <span className="text-[#f5f2eb]/70">{invitationCard.priceDisplayMXN}</span>
                </div>
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-[#f5f2eb]/70">{managementCard.name} — {t(`${NS}.pricingQuiz.result.managementAxisLabel`)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[#f5f2eb]/30 line-through">{managementCard.priceDisplayMXN}</span>
                    <span className="text-[#DDA46F] font-medium">{formatMXNFromCents(managementDiscountedCents)}</span>
                  </span>
                </div>
                <p className="text-xs lg:text-sm text-[#DDA46F] font-medium pt-1">{t(`${NS}.pricingQuiz.result.discountNote`)}</p>
              </div>

              <Button
                onClick={handleBundleCheckout}
                disabled={isLoading({ axis: 'invitation', tier: recommendation.invitationTier })}
                className="w-full h-12 sm:h-14 lg:h-16 bg-[#DDA46F] hover:bg-[#c99560] text-[#420c14] text-sm sm:text-base lg:text-lg tracking-wider"
              >
                {isLoading({ axis: 'invitation', tier: recommendation.invitationTier }) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t(`${NS}.pricingQuiz.result.bundleCta`)}
              </Button>
              <p className="text-[11px] lg:text-xs text-[#f5f2eb]/35 mt-3">{t(`${NS}.pricingQuiz.result.bundleFlowNote`)}</p>
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-0 pt-6 sm:pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#f5f2eb]/10 lg:pl-14 text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#DDA46F] mb-3 sm:mb-4">
                {invitationCard.name} {t(`${NS}.pricingQuiz.result.invitationAxisLabel`)}
              </p>
              <div className="space-y-2.5 lg:space-y-3 mb-6 sm:mb-8">
                {invitationCard.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 text-[#DDA46F] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={`text-sm lg:text-base ${feature.highlight ? 'font-semibold text-[#f5f2eb]' : 'text-[#f5f2eb]/55'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#DDA46F] mb-3 sm:mb-4">
                {managementCard.name} {t(`${NS}.pricingQuiz.result.managementAxisLabel`)}
              </p>
              <div className="space-y-2.5 lg:space-y-3">
                {managementCard.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 text-[#DDA46F] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={`text-sm lg:text-base ${feature.highlight ? 'font-semibold text-[#f5f2eb]' : 'text-[#f5f2eb]/55'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invitation-only — present, but visually secondary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto mt-8 sm:mt-10"
        >
          <p className="text-center text-xs sm:text-sm text-[#420c14]/40 mb-4">{t(`${NS}.pricingQuiz.result.invitationOnlyLabel`)}</p>
          <PlanCard
            card={invitationCard}
            layout="split"
            loading={isLoading({ axis: 'invitation', tier: recommendation.invitationTier })}
            onCheckout={() => onCheckout({ axis: 'invitation', tier: recommendation.invitationTier })}
          />
        </motion.div>

        {recommendation.suggestPlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="max-w-md lg:max-w-xl xl:max-w-2xl mx-auto mt-4 text-center text-sm text-[#420c14]/60"
          >
            {t(`${NS}.pricingQuiz.result.plannerNudge`)}{' '}
            <a href="/planners" className="text-[#DDA46F] underline hover:text-[#c99560]">
              {t(`${NS}.pricingQuiz.result.plannerNudgeCta`)}
            </a>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 flex items-center justify-center gap-6 flex-wrap"
        >
          <button onClick={() => setShowCompare(v => !v)} className="text-sm text-[#420c14] underline hover:text-[#DDA46F]">
            {t('landing.pricing.comparePlans')}
          </button>
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-[#420c14]/60 hover:text-[#420c14]">
            <RotateCcw className="w-3.5 h-3.5" />
            {t(`${NS}.pricingQuiz.retake`)}
          </button>
        </motion.div>

        <AnimatePresence>
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden mt-6"
            >
              {renderInvitationGrid()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const steps = [
    {
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t(`${NS}.pricingQuiz.guestCount.title`),
      render: () => (
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {GUEST_OPTIONS.map((option, index) => (
            <QuizOption
              key={option}
              index={index}
              title={t(`${NS}.pricingQuiz.guestCount.options.${option}.title`)}
              description={t(`${NS}.pricingQuiz.guestCount.options.${option}.description`)}
              ctaLabel={t(`${NS}.pricingQuiz.selectCta`)}
              selected={guestBand === option}
              onSelect={() => { setGuestBand(option); setStep(1) }}
            />
          ))}
        </div>
      ),
    },
    {
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t(`${NS}.pricingQuiz.invitationStyle.title`),
      render: () => (
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {STYLE_OPTIONS.map((option, index) => (
            <QuizOption
              key={option}
              index={index}
              title={t(`${NS}.pricingQuiz.invitationStyle.options.${option}.title`)}
              description={t(`${NS}.pricingQuiz.invitationStyle.options.${option}.description`)}
              ctaLabel={t(`${NS}.pricingQuiz.selectCta`)}
              selected={invitationStyle === option}
              onSelect={() => { setInvitationStyle(option); setStep(2) }}
            />
          ))}
        </div>
      ),
    },
    {
      icon: <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t(`${NS}.pricingQuiz.managementNeed.title`),
      render: () => (
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {MANAGEMENT_OPTIONS.map((option, index) => (
            <QuizOption
              key={option}
              index={index}
              title={t(`${NS}.pricingQuiz.managementNeed.options.${option}.title`)}
              description={t(`${NS}.pricingQuiz.managementNeed.options.${option}.description`)}
              ctaLabel={t(`${NS}.pricingQuiz.selectCta`)}
              selected={managementNeed === option}
              onSelect={() => {
                setManagementNeed(option)
                advanceWithProcessing(() => setStep(3))
              }}
            />
          ))}
        </div>
      ),
    },
  ]

  return (
    <div>
      <QuizProgress
        step={step}
        total={steps.length}
        hint={t(`${NS}.pricingQuiz.progressHint`)}
        stepLabel={t(`${NS}.pricingQuiz.stepOf`, { current: step + 1, total: steps.length })}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <span className="text-[#DDA46F]">{steps[step].icon}</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#420c14] text-center">
              {steps[step].title}
            </h3>
          </div>
          {steps[step].render()}
        </motion.div>
      </AnimatePresence>

      <div className="text-center mt-10 sm:mt-12">
        <button
          onClick={() => setSkipped(true)}
          className="text-xs sm:text-sm text-[#420c14]/40 underline decoration-[#420c14]/20 underline-offset-4 hover:text-[#420c14]/70 transition-colors"
        >
          {t(`${NS}.pricingQuiz.skip`)}
        </button>
      </div>
    </div>
  )
}

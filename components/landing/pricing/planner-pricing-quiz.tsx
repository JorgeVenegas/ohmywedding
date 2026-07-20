'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, TrendingUp, Target, Sparkles, Bot, Send } from 'lucide-react'
import { QuizOption } from './quiz-option'
import { QuizProcessing } from './quiz-processing'
import { QuizProgress } from './quiz-progress'
import { QuizStageHeadline } from './quiz-stage-headline'
import { PlanCard } from './plan-card'
import { PaymentMethodSelector, type PaymentMethod } from './payment-method-selector'
import { BillingCycleToggle, type BillingCycle } from './billing-cycle-toggle'
import { getLocalizedManagementCard, getLocalizedManagementCardWithCycle } from './localized-cards'
import type { CheckoutTarget } from './types'
import { MANAGEMENT_PRICING, MANAGEMENT_SUBSCRIPTION_PRICING, type ManagementTier } from '@/lib/subscription-shared'
import {
  recommendPlannerPlan,
  type WeddingVolume,
  type PlannerPriority,
  type PlannerBillingCycle,
} from '@/lib/pricing-quiz'

const NS = 'landingPlanners'

const VOLUME_OPTIONS: WeddingVolume[] = ['low', 'mid', 'high']
const PRIORITY_OPTIONS: PlannerPriority[] = ['branding', 'dashboard', 'support']
const MANAGEMENT_TIERS = Object.keys(MANAGEMENT_PRICING) as ManagementTier[]

interface PlannerPricingQuizProps {
  onCheckout: (target: CheckoutTarget) => void
  isLoading: (target: CheckoutTarget) => boolean
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  msiEnabled?: boolean
}

export function PlannerPricingQuiz({ onCheckout, isLoading, paymentMethod, onPaymentMethodChange, msiEnabled = false }: PlannerPricingQuizProps) {
  const { t, locale } = useTranslation()
  const [step, setStep] = useState(0) // 0 = volume, 1 = priority, 2 = result
  const [skipped, setSkipped] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [volume, setVolume] = useState<WeddingVolume | null>(null)
  const [priority, setPriority] = useState<PlannerPriority | null>(null)
  // compare-grid cycle starts at 'once'; result cycle is set by recommendation
  const [compareCycle, setCompareCycle] = useState<BillingCycle>('once')
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
    setVolume(null)
    setPriority(null)
  }

  const recommendation = volume && priority ? recommendPlannerPlan({ weddingVolume: volume, priority }) : null
  const isResult = step >= 2 && recommendation !== null

  const mailtoHref = `mailto:support@ohmy.wedding?subject=${encodeURIComponent(t(`${NS}.pricingQuiz.result.subscriptionEmailSubject`))}`

  const cycleLabels = locale === 'es'
    ? { once: 'Por Boda', subscription: 'Suscripción', monthly: 'Mensual', annual: 'Anual', save: 'Ahorra ~44%' }
    : undefined

  // Compare/skip grid — flat 3-way toggle, all 3 tiers update prices
  const renderManagementGrid = (cycle: BillingCycle = 'once') => (
    <div>
      <BillingCycleToggle
        cycle={cycle}
        onChange={setCompareCycle}
        variant="flat"
        labels={cycleLabels}
      />
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {MANAGEMENT_TIERS.map((tierKey, index) => (
          <PlanCard
            key={`${tierKey}-${cycle}`}
            card={getLocalizedManagementCardWithCycle(locale, tierKey, cycle)}
            index={index}
            isFeatured={tierKey === 'pro'}
            isTop={tierKey === 'agency'}
            loading={isLoading({ axis: 'management', tier: tierKey })}
            onCheckout={() => onCheckout({ axis: 'management', tier: tierKey })}
          />
        ))}
      </div>
      {cycle !== 'once' && (
        <p className="text-center text-xs text-[#420c14]/40 mt-4">
          {locale === 'es'
            ? '* Suscripción — acceso ilimitado a todas las bodas del período.'
            : '* Subscription — unlimited access for all weddings during the billing period.'}
        </p>
      )}
    </div>
  )

  // Result card for subscription recommendation
  const renderSubscriptionResult = (rec: { managementTier: ManagementTier; billingCycle: PlannerBillingCycle }) => {
    const card = getLocalizedManagementCard(locale, rec.managementTier)
    const isAnnual = rec.billingCycle === 'annual'
    const sub = isAnnual
      ? MANAGEMENT_SUBSCRIPTION_PRICING[rec.managementTier].annual
      : MANAGEMENT_SUBSCRIPTION_PRICING[rec.managementTier].monthly
    const otpPrice = MANAGEMENT_PRICING[rec.managementTier].priceDisplayMXN
    const period = locale === 'es' ? sub.periodES : sub.period
    const perMonthNote = isAnnual
      ? (locale === 'es'
          ? `${MANAGEMENT_SUBSCRIPTION_PRICING[rec.managementTier].annual.perMonthDisplayMXN}/mes, facturado anualmente`
          : `${MANAGEMENT_SUBSCRIPTION_PRICING[rec.managementTier].annual.perMonthDisplayMXN}/month, billed annually`)
      : null

    return (
      <div className="max-w-md lg:max-w-3xl xl:max-w-4xl mx-auto">
        <div className="rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-[#DDA46F] to-[#c99560] border-2 border-[#DDA46F] lg:grid lg:grid-cols-2 lg:gap-x-14 lg:items-start">
          <div>
            <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-[#420c14]/10 text-[#420c14] text-[10px] sm:text-xs font-medium tracking-wider uppercase">
              <Sparkles className="w-3 h-3" />
              {isAnnual
                ? (locale === 'es' ? 'Mejor Valor — Anual' : 'Best Value — Annual')
                : (locale === 'es' ? 'Recomendado — Mensual' : 'Recommended — Monthly')}
            </span>
            <h4 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#420c14] mb-1">{card.name}</h4>
            <p className="text-xs sm:text-sm lg:text-base text-[#420c14]/70 mb-4 sm:mb-6">{card.tagline}</p>

            <div className="mb-1">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#420c14]">{sub.priceDisplayMXN}</span>
              <span className="ml-2 text-sm sm:text-base text-[#420c14]/70">{period}</span>
            </div>
            {perMonthNote ? (
              <p className="text-xs sm:text-sm text-[#420c14]/60 mb-6 sm:mb-8">{perMonthNote}</p>
            ) : (
              <div className="mb-6 sm:mb-8" />
            )}

            <div className="space-y-3 mb-6 sm:mb-8 bg-[#420c14]/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-[#420c14]/80">
                <Send className="w-4 h-4 flex-shrink-0 text-[#420c14]" />
                <span className="font-medium">{locale === 'es' ? 'Envía invitaciones con un clic' : 'Send invitations with one click'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#420c14]/80">
                <Bot className="w-4 h-4 flex-shrink-0 text-[#420c14]" />
                <span className="font-medium">{locale === 'es' ? 'Chatbot de IA para preguntas de invitados' : 'AI chatbot answers guest FAQs'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#420c14]/80">
                <Bot className="w-4 h-4 flex-shrink-0 text-[#420c14]" />
                <span className="font-medium">{locale === 'es' ? 'Asistente de IA para planeación de bodas' : 'AI wedding planning assistant'}</span>
              </div>
            </div>

            <a
              href={mailtoHref}
              className="block text-center w-full h-12 sm:h-14 leading-[3rem] sm:leading-[3.5rem] rounded-md bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] text-sm sm:text-base tracking-wider transition-colors"
            >
              {locale === 'es' ? 'Hablar con nosotros' : "Let's Talk"}
            </a>
            <p className="text-center text-[11px] text-[#420c14]/50 mt-3">
              {locale === 'es'
                ? `¿Prefieres pagar por boda? ${otpPrice} por evento`
                : `Prefer to pay per wedding? ${otpPrice} per event`}
            </p>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-0 pt-8 sm:pt-10 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#420c14]/10 lg:pl-14 space-y-4 sm:space-y-5">
            {card.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 sm:gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[#420c14]/20 text-[#420c14]">
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className={`text-sm sm:text-base ${feature.highlight ? 'font-semibold text-[#420c14]' : 'text-[#420c14]/60'}`}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Skipped / compare view ──────────────────────────────────────────────────
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
        {renderManagementGrid(compareCycle)}
      </div>
    )
  }

  if (isProcessing) {
    return <QuizProcessing label={t(`${NS}.pricingQuiz.processing`)} />
  }

  // ── Result view ─────────────────────────────────────────────────────────────
  if (isResult && recommendation) {
    const isSubscription = recommendation.billingCycle !== 'once'
    const managementCard = getLocalizedManagementCard(locale, recommendation.managementTier)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-10 sm:mb-12">
          <QuizStageHeadline eyebrow={t(`${NS}.pricingQuiz.result.eyebrow`)} title={t(`${NS}.pricingQuiz.result.heading`)} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {isSubscription ? (
            renderSubscriptionResult(recommendation)
          ) : (
            <>
              <PaymentMethodSelector paymentMethod={paymentMethod} onChange={onPaymentMethodChange} msiEnabled={msiEnabled} />
              <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
                <PlanCard
                  card={managementCard}
                  isFeatured
                  layout="split"
                  badgeLabel={t(`${NS}.pricingQuiz.result.recommendedBadge`)}
                  loading={isLoading({ axis: 'management', tier: recommendation.managementTier })}
                  onCheckout={() => onCheckout({ axis: 'management', tier: recommendation.managementTier })}
                />
                <p className="text-center text-xs text-[#420c14]/40 mt-4">
                  {locale === 'es'
                    ? 'Haciendo crecer tu negocio? Una suscripción mensual o anual podría ser más económica.'
                    : 'Growing your volume? A monthly or annual subscription could save you money.'}
                </p>
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
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
              {renderManagementGrid(compareCycle)}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ── Quiz questions ───────────────────────────────────────────────────────────
  const steps = [
    {
      key: 'volume',
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t(`${NS}.pricingQuiz.volume.title`),
      render: () => (
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {VOLUME_OPTIONS.map((option, index) => (
            <QuizOption
              key={option}
              index={index}
              title={t(`${NS}.pricingQuiz.volume.options.${option}.title`)}
              description={t(`${NS}.pricingQuiz.volume.options.${option}.description`)}
              ctaLabel={t(`${NS}.pricingQuiz.selectCta`)}
              selected={volume === option}
              onSelect={() => { setVolume(option); setStep(1) }}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'priority',
      icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />,
      title: t(`${NS}.pricingQuiz.priority.title`),
      render: () => (
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {PRIORITY_OPTIONS.map((option, index) => (
            <QuizOption
              key={option}
              index={index}
              title={t(`${NS}.pricingQuiz.priority.options.${option}.title`)}
              description={t(`${NS}.pricingQuiz.priority.options.${option}.description`)}
              ctaLabel={t(`${NS}.pricingQuiz.selectCta`)}
              selected={priority === option}
              onSelect={() => {
                setPriority(option)
                advanceWithProcessing(() => setStep(2))
              }}
            />
          ))}
        </div>
      ),
    },
  ]

  const currentStep = steps[step] ?? steps[0]

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
          key={currentStep.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <span className="text-[#DDA46F]">{currentStep.icon}</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#420c14] text-center">{currentStep.title}</h3>
          </div>
          {currentStep.render()}
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

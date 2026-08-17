'use client'

import { useState, useEffect, useRef } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Video, Calendar, X, MessageCircle, Users, CheckSquare, Sparkles, ChevronUp, Clock, Monitor } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'
import { getTranslations } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

const TOPIC_ICONS = [
  <Sparkles key="sparkles" className="w-4 h-4" />,
  <MessageCircle key="message" className="w-4 h-4" />,
  <CheckSquare key="check" className="w-4 h-4" />,
  <Users key="users" className="w-4 h-4" />,
]

interface ConsultationCalEmbedProps {
  calLink: string
  namespace: string
}

function ConsultationCalEmbed({ calLink, namespace }: ConsultationCalEmbedProps) {
  useEffect(() => {
    ;(async () => {
      const cal = await getCalApi({ namespace })
      cal('ui', {
        theme: 'light',
        colorScheme: 'light',
        styles: { branding: { brandColor: '#420c14' } },
        cssVarsPerTheme: {
          light: {
            '--cal-brand-color': '#420c14',
            '--cal-bg': '#fefdfb',
            '--cal-bg-emphasis': '#f9f2ee',
            '--cal-bg-muted': '#f3e8e2',
            '--cal-text': '#420c14',
            '--cal-text-emphasis': '#2c0810',
            '--cal-text-subtle': '#7a3a42',
            '--cal-text-muted': '#a06070',
            '--cal-text-inverted': '#fefdfb',
            '--cal-border-subtle': '#f0e0d8',
            '--cal-border-muted': '#ddc8be',
          },
          dark: {
            '--cal-brand-color': '#c9856a',
            '--cal-bg': '#1c0a08',
            '--cal-bg-emphasis': '#2a1210',
            '--cal-bg-muted': '#381a16',
            '--cal-text': '#f0d8d0',
            '--cal-text-emphasis': '#f9f2ee',
            '--cal-text-subtle': '#c0907a',
            '--cal-text-muted': '#9a7060',
            '--cal-text-inverted': '#1c0a08',
            '--cal-border-subtle': '#2a1210',
            '--cal-border-muted': '#4a2820',
          },
        },
      })
    })()
  }, [namespace])

  return (
    <Cal
      namespace={namespace}
      calLink={calLink}
      style={{ width: '100%' }}
      config={{ layout: 'month_view', theme: 'light' }}
    />
  )
}

interface ConsultationSectionProps {
  ns: string
  calSlug: string
}

export function ConsultationSection({ ns, calSlug }: ConsultationSectionProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef(null)
  const embedRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const { t, locale } = useTranslation()

  const username = process.env.NEXT_PUBLIC_CALCOM_USERNAME
  const localizedSlug = locale !== 'en' ? `${calSlug}-${locale}` : calSlug
  const calLink = username ? `${username}/${localizedSlug}` : null

  const namespace = `omw-consult-${calSlug}`

  // t() only returns strings — read arrays directly from the translation tree
  const rawTranslations = getTranslations(locale as Locale) as Record<string, any>
  const topics: Array<{ title: string; description: string }> =
    rawTranslations[ns]?.consultation?.topics?.items ?? []
  const metaBadges = (t(`${ns}.consultation.dialogMeta`) as string).split(' · ')

  function handleToggle() {
    if (!calLink) return
    if (!open) {
      setMounted(true)
      setOpen(true)
      setTimeout(() => {
        embedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } else {
      setOpen(false)
    }
  }

  return (
    <section ref={ref} className="relative py-24 sm:py-32 bg-[#f5f2eb] overflow-hidden">
      {/* Border shimmers */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#DDA46F]/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#DDA46F]/30 to-transparent" />

      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #420c14 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header row: headline left, booking meta right ── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-end mb-16">

          {/* Left: eyebrow + headline */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-[#420c14]/50 mb-5"
            >
              <Video className="w-3 h-3" />
              {t(`${ns}.consultation.eyebrow`)}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl text-[#420c14] leading-[1.05]"
            >
              <span className="font-serif font-light block">{t(`${ns}.consultation.title`)}</span>
              <span className="font-['Elegant',cursive] text-[#DDA46F] text-[1.3em] block mt-1">
                {t(`${ns}.consultation.subtitle`)}
              </span>
            </motion.h2>
          </div>

          {/* Right: meta badges + booking title + description */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:pb-2"
          >
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              {metaBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#420c14]/6 border border-[#420c14]/10 text-[#420c14]/60 text-[11px] font-medium tracking-wide"
                >
                  {badge}
                </span>
              ))}
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-[#420c14] leading-snug mb-3">
              {t(`${ns}.consultation.dialogTitle`)}
            </h3>
            <p className="text-[#420c14]/55 text-base leading-relaxed mb-8">
              {t(`${ns}.consultation.description`)}
            </p>

            <button
              onClick={handleToggle}
              disabled={!calLink}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#420c14] hover:bg-[#2c0810] disabled:opacity-40 disabled:cursor-not-allowed text-[#f5f2eb] text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_8px_30px_rgba(66,12,20,0.25)] hover:-translate-y-0.5"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {t(`${ns}.consultation.cta`)}
            </button>

            {!calLink && (
              <p className="text-[#420c14]/30 text-xs mt-2">Calendar not configured yet</p>
            )}
          </motion.div>
        </div>

        {/* ── Expandable Cal embed — below button, above topics ── */}
        <div ref={embedRef}>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="cal-embed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mb-16 rounded-3xl overflow-hidden border border-[#420c14]/8 bg-white shadow-[0_16px_60px_rgba(66,12,20,0.08)]">
                  <div className="flex items-center justify-between px-6 py-4 bg-[#420c14] border-b border-[#DDA46F]/15">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F]/70 mb-0.5">
                        {t(`${ns}.consultation.dialogMeta`)}
                      </p>
                      <h3 className="font-serif text-lg text-[#f5f2eb]">
                        {t(`${ns}.consultation.dialogTitle`)}
                      </h3>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#f5f2eb]/40 hover:text-[#f5f2eb] hover:bg-[#f5f2eb]/8 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {mounted && calLink && (
                    <div className="p-2">
                      <ConsultationCalEmbed calLink={calLink} namespace={namespace} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Divider ── */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
          className="h-px bg-gradient-to-r from-[#420c14]/15 via-[#DDA46F]/30 to-transparent mb-16"
        />

        {/* ── Topics ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#420c14]/40 mb-6">
            {t(`${ns}.consultation.topics.title`)}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(topics) && topics.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.07 }}
                className="flex flex-col gap-3 p-5 rounded-2xl bg-white/70 border border-[#420c14]/6 hover:border-[#DDA46F]/30 hover:bg-white transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#420c14]/6 group-hover:bg-[#DDA46F]/12 flex items-center justify-center shrink-0 text-[#420c14]/50 group-hover:text-[#DDA46F] transition-colors">
                  {TOPIC_ICONS[i]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#420c14] mb-1">{item.title}</p>
                  <p className="text-xs text-[#420c14]/50 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

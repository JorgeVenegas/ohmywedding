'use client'

import { useState, useEffect, useRef } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { motion, useInView } from 'framer-motion'
import { Calendar, Video, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const CALCOM_USERNAME = process.env.NEXT_PUBLIC_CALCOM_USERNAME
const DEMO_SLUG = process.env.NEXT_PUBLIC_CALCOM_DEMO_EVENT_SLUG ?? 'demo'
const DEMO_CAL_LINK = CALCOM_USERNAME ? `${CALCOM_USERNAME}/${DEMO_SLUG}` : null

function DemoCalEmbed() {
  const namespace = 'omw-demo'

  useEffect(() => {
    ;(async () => {
      const cal = await getCalApi({ namespace })
      cal('ui', {
        theme: 'light',
        colorScheme: 'light',
        styles: { branding: { brandColor: '#b91c1c' } },
        cssVarsPerTheme: {
          light: {
            '--cal-brand-color': '#b91c1c',
            '--cal-bg': '#fff9f9',
            '--cal-bg-emphasis': '#fee2e2',
            '--cal-bg-muted': '#fecaca',
            '--cal-text': '#7f1d1d',
            '--cal-text-emphasis': '#450a0a',
            '--cal-text-subtle': '#991b1b',
            '--cal-text-muted': '#b91c1c',
            '--cal-text-inverted': '#ffffff',
            '--cal-border-subtle': '#fee2e2',
            '--cal-border-muted': '#fca5a5',
          },
          dark: {
            '--cal-brand-color': '#ef4444',
            '--cal-bg': '#1a0202',
            '--cal-bg-emphasis': '#280404',
            '--cal-bg-muted': '#380606',
            '--cal-text': '#fecaca',
            '--cal-text-emphasis': '#fee2e2',
            '--cal-text-subtle': '#f87171',
            '--cal-text-muted': '#ef4444',
            '--cal-text-inverted': '#1a0202',
            '--cal-border-subtle': '#280404',
            '--cal-border-muted': '#4a0a0a',
          },
        },
      })
    })()
  }, [])

  if (!DEMO_CAL_LINK) return null

  return (
    <Cal
      namespace={namespace}
      calLink={DEMO_CAL_LINK}
      style={{ width: '100%', overflow: 'scroll' }}
      config={{ layout: 'month_view', theme: 'light' }}
    />
  )
}

export function DemoSection() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  if (!DEMO_CAL_LINK) return null

  return (
    <section ref={ref} className="relative py-32 sm:py-40 overflow-hidden bg-[#0f0203]">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #DDA46F 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Top/bottom gradient blends */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#420c14] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#420c14] to-transparent" />
      {/* Red glow orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#b91c1c]/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#b91c1c]/10 border border-[#b91c1c]/25 text-[#f87171] text-[10px] tracking-[0.35em] uppercase mb-8"
        >
          <Video className="w-3 h-3" />
          30 min · Google Meet
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#f5f2eb] leading-[1.1] mb-5"
        >
          See it in action
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="text-[#f5f2eb]/45 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-12"
        >
          No commitment. We'll walk you through the platform and show you exactly how your invitation comes to life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <button
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-sm font-medium tracking-wide transition-all duration-300 shadow-[0_0_50px_rgba(185,28,28,0.25)] hover:shadow-[0_0_70px_rgba(185,28,28,0.45)] hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4" />
            Request a Demo
            <span className="opacity-40 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-300">→</span>
          </button>
        </motion.div>

        {/* Decorative line */}
        <div className="mt-16 flex items-center gap-4 justify-center opacity-20">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#b91c1c]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#b91c1c]" />
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full p-0 border border-[#b91c1c]/20 overflow-hidden bg-[#fff9f9]" style={{ maxHeight: '90vh' }}>
          <DialogTitle className="sr-only">Request a Demo</DialogTitle>

          {/* Dialog header */}
          <div className="flex items-center justify-between px-6 py-5 bg-[#7f1d1d] border-b border-[#b91c1c]/30">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#fca5a5] mb-0.5">30 min · Google Meet · Free</p>
              <h3 className="font-serif text-xl text-white">Request a Demo</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cal embed */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <DemoCalEmbed />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

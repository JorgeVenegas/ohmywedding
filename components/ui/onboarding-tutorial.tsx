'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import {
  Globe,
  Mail,
  LayoutGrid,
  Gift,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  image: string
}

const STEPS: OnboardingStep[] = [
  {
    icon: <Sparkles className="w-7 h-7" />,
    title: 'Welcome to OhMyWedding!',
    description: "Let's take a quick tour. Everything you need to plan and celebrate your perfect day — all in one beautiful place.",
    color: '#DDA46F',
    image: '/images/demo_images/demo-img-3.jpg',
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: 'Wedding Website',
    description: 'Create a stunning personalized wedding website with custom themes, colors, and sections. Share your love story with every guest.',
    color: '#9ba082',
    image: '/images/demo_images/demo-img-12.jpg',
  },
  {
    icon: <Mail className="w-7 h-7" />,
    title: 'Invitations & Guests',
    description: 'Send beautiful digital invitations, manage your guest list, track RSVPs, and organize groups — all effortlessly.',
    color: '#c9956e',
    image: '/images/demo_images/demo-img-27.jpg',
  },
  {
    icon: <LayoutGrid className="w-7 h-7" />,
    title: 'Seating Layout',
    description: 'Design your floor plan and arrange tables with our drag-and-drop editor. Assign guests with a click.',
    color: '#b08e7a',
    image: '/images/demo_images/demo-img-18.jpg',
  },
  {
    icon: <Gift className="w-7 h-7" />,
    title: 'Gift Registry',
    description: 'Create custom registries and let your guests contribute to what matters most — from honeymoon funds to new home essentials.',
    color: '#732c2c',
    image: '/images/demo_images/demo-img-34.jpg',
  },
  {
    icon: <CalendarDays className="w-7 h-7" />,
    title: 'Event Itinerary',
    description: 'Plan and share your event schedule with guests. From ceremony to reception — keep everyone informed and on time.',
    color: '#6b7a48',
    image: '/images/demo_images/demo-img-41.jpg',
  },
]

interface OnboardingTutorialProps {
  onComplete: () => void
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)

  const handleComplete = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { tutorial_completed: true }
      })
    } catch (error) {
      console.error('Failed to save tutorial completion:', error)
    }
    onComplete()
  }, [onComplete])

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const isFirst = currentStep === 0

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Hidden image prefetch — loads all images in background */}
        <div className="sr-only" aria-hidden="true">
          {STEPS.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.image} src={s.image} alt="" />
          ))}
        </div>

        <motion.div
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Close */}
          <button
            onClick={handleComplete}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-[#420c14]/60 hover:text-[#420c14] transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row md:min-h-[480px]">
            {/* Left: Image panel */}
            <div className="relative w-full h-56 md:h-auto md:w-5/12 flex-shrink-0 overflow-hidden bg-[#f5f2eb]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 460px"
                  />
                  {/* Warm tinted overlay */}
                  <div className="absolute inset-0" style={{ background: `${step.color}20` }} />
                  {/* Bottom fade into white on mobile, right fade on desktop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/30" />

                  {/* Video placeholder badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md bg-white/70 shadow-lg"
                      style={{ border: `1.5px solid ${step.color}40` }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: step.color }}
                      >
                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                      </div>
                      <span className="text-xs font-medium text-[#420c14]/70">Demo video coming soon</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Step number pill */}
              <div
                className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white tracking-wider uppercase"
                style={{ backgroundColor: step.color }}
              >
                {currentStep + 1} / {STEPS.length}
              </div>
            </div>

            {/* Right: Content + Footer */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Content */}
              <div className="flex-1 px-8 pt-8 pb-4">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Icon */}
                    <div
                      className="inline-flex p-3.5 rounded-2xl mb-5"
                      style={{ backgroundColor: `${step.color}18`, color: step.color }}
                    >
                      {step.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-[#420c14] font-serif leading-snug mb-3">
                      {step.title}
                    </h2>

                    <p className="text-sm text-[#420c14]/60 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 flex items-center justify-between">
                {/* Dots + Skip */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5 items-center">
                    {STEPS.map((s, i) => (
                      <motion.button
                        key={i}
                        onClick={() => {
                          setDirection(i > currentStep ? 1 : -1)
                          setCurrentStep(i)
                        }}
                        className="rounded-full transition-colors duration-300 focus:outline-none"
                        style={{
                          width: i === currentStep ? 20 : 7,
                          height: 7,
                          backgroundColor: i === currentStep ? step.color : `${step.color}35`,
                        }}
                        layout
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        aria-label={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleComplete}
                    className="text-xs text-[#420c14]/40 hover:text-[#420c14]/70 transition-colors text-left"
                  >
                    Skip tour
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  {!isFirst && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goPrev}
                      className="text-[#420c14]/50 hover:text-[#420c14] hover:bg-[#420c14]/5"
                    >
                      <ChevronLeft className="w-4 h-4 mr-0.5" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={goNext}
                    className="font-semibold text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {isLast ? 'Get Started' : 'Next'}
                    {!isLast && <ChevronRight className="w-4 h-4 ml-0.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Lock, AlertTriangle, ArrowRight, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"

function WeddingLockedContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const weddingId = searchParams.get("wedding")

  const upgradeHref = weddingId
    ? `/upgrade?wedding=${weddingId}&source=wedding_locked`
    : `/upgrade?source=wedding_locked`

  return (
    <main className="min-h-screen bg-[#f5f2eb] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Ambient blobs */}
      <motion.div
        className="absolute top-1/4 left-[5%] w-72 h-72 rounded-full bg-[#420c14]/6 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-[5%] w-96 h-96 rounded-full bg-[#DDA46F]/8 blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-0 right-0 flex justify-center"
      >
        <span className="font-['Elegant',cursive] text-[#DDA46F] text-3xl">OhMyWedding</span>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* Lock icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#420c14]/8 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#420c14]/12 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#420c14]/40" strokeWidth={1.5} />
              </div>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border border-[#420c14]/10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] tracking-[0.35em] uppercase text-[#DDA46F] mb-4"
        >
          {t("weddingLocked.subtitle")}
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl sm:text-5xl font-serif font-light text-[#420c14] mb-5 leading-tight"
        >
          {t("weddingLocked.title")}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[#420c14]/60 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto"
        >
          {t("weddingLocked.description")}
        </motion.p>

        {/* Deletion warning */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 mx-auto max-w-md"
        >
          <div className="flex items-start gap-3 bg-red-50 border border-red-200/60 rounded-2xl px-5 py-4 text-left">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">
              {t("weddingLocked.deletionWarning")}
            </p>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            asChild
            className="h-13 px-8 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] font-medium tracking-wide gap-2 text-sm rounded-full"
          >
            <Link href={upgradeHref}>
              {t("weddingLocked.upgradeButton")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-13 px-6 border-[#420c14]/20 text-[#420c14]/70 hover:bg-[#420c14]/5 hover:text-[#420c14] font-medium text-sm rounded-full gap-2"
          >
            <Link href="mailto:hola@ohmywedding.mx">
              <LifeBuoy className="w-4 h-4" />
              {t("weddingLocked.contactSupport")}
            </Link>
          </Button>
        </motion.div>

        {/* Already paid note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-xs text-[#420c14]/35"
        >
          {t("weddingLocked.alreadyPaid")}
        </motion.p>
      </motion.div>
    </main>
  )
}

export default function WeddingLockedPage() {
  return (
    <Suspense>
      <WeddingLockedContent />
    </Suspense>
  )
}

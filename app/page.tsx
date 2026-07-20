"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { useTranslation } from "@/components/contexts/i18n-context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { AudiencePickerCard } from "@/components/landing/audience-picker-card"

function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      const callbackUrl = `/auth/callback?code=${code}&redirect=/`
      window.location.href = callbackUrl
    }
  }, [code, router])

  return null
}

export default function ChooserPage() {
  const { t } = useTranslation()

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#420c14]">
      <Suspense fallback={null}>
        <AuthCodeHandler />
      </Suspense>

      {/* Full-bleed 50/50 split — flex-row on desktop, flex-col (stacked, full width) on mobile */}
      <div className="absolute inset-0 z-0 flex flex-col sm:flex-row">
        <AudiencePickerCard
          href="/couples"
          label={t('audienceChooser.couple.label')}
          sublabel={t('audienceChooser.couple.sublabel')}
          cta={t('audienceChooser.cta')}
          video="/videos/vid1.mp4"
        />
        <AudiencePickerCard
          href="/planners"
          label={t('audienceChooser.planner.label')}
          sublabel={t('audienceChooser.planner.sublabel')}
          cta={t('audienceChooser.cta')}
          video="/videos/vid15.mp4"
        />
      </div>

      {/* Center seam */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-[#DDA46F]/20 sm:inset-y-0 sm:inset-x-auto sm:left-1/2 sm:top-0 sm:h-full sm:w-px" />

      {/* Header + question overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <Link href="/" className="pointer-events-auto flex items-center gap-3">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              width={36}
              height={36}
              className="h-8 sm:h-9 w-auto"
              priority
            />
            <span className="font-serif text-base sm:text-lg text-[#f5f2eb] tracking-[0.15em] hidden sm:block">
              OhMyWedding
            </span>
          </Link>
          <div className="pointer-events-auto">
            <LanguageSwitcher variant="pill" />
          </div>
        </div>

        <div className="flex flex-col items-center px-4 pb-4 sm:pb-6 text-center">
          <span className="text-[#DDA46F] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-1.5 sm:mb-2">
            {t('audienceChooser.kicker')}
          </span>
          <h1 className="font-serif font-light text-2xl sm:text-3xl md:text-4xl text-[#f5f2eb]">
            {t('audienceChooser.title')}
          </h1>
        </div>
      </div>

      {/* Footer overlay */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-center">
        <p className="text-[#f5f2eb]/40 text-[10px] sm:text-xs tracking-wide">
          &copy; {new Date().getFullYear()} OhMyWedding. {t('landing.footer.madeWith')}{' '}
          <Heart className="w-3 h-3 inline text-[#DDA46F] fill-[#DDA46F] mx-1" />
        </p>
      </footer>
    </main>
  )
}

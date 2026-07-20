"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Sparkles, Palette, Send, Images } from "lucide-react"
import { LuxuryHeader } from "@/components/landing/luxury-header"
import { HeroSection } from "@/components/landing/hero-section"
import { AudienceTeaserSection } from "@/components/landing/audience-teaser-section"

const NS = "landingPlanners"
const SOURCE = "planners"

// Dynamically import below-fold sections to reduce initial bundle
const AboutSection = dynamic(() => import("@/components/landing/about-section").then(m => ({ default: m.AboutSection })), { ssr: false })
const FeaturesSection = dynamic(() => import("@/components/landing/features-section").then(m => ({ default: m.FeaturesSection })), { ssr: false })
const ExperienceSection = dynamic(() => import("@/components/landing/experience-section").then(m => ({ default: m.ExperienceSection })), { ssr: false })
const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then(m => ({ default: m.PricingSection })), { ssr: false })
const GoldenBannerSection = dynamic(() => import("@/components/landing/golden-banner-section").then(m => ({ default: m.GoldenBannerSection })), { ssr: false })
const TemplatesSection = dynamic(() => import("@/components/landing/templates-section").then(m => ({ default: m.TemplatesSection })), { ssr: false })
const TestimonialsSection = dynamic(() => import("@/components/landing/testimonials-section").then(m => ({ default: m.TestimonialsSection })), { ssr: false })
const FinalCTASection = dynamic(() => import("@/components/landing/final-cta-section").then(m => ({ default: m.FinalCTASection })), { ssr: false })
const LuxuryFooter = dynamic(() => import("@/components/landing/luxury-footer").then(m => ({ default: m.LuxuryFooter })), { ssr: false })

function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      const callbackUrl = `/auth/callback?code=${code}&redirect=/planners`
      window.location.href = callbackUrl
    }
  }, [code, router])

  return null
}

export default function PlannersLandingPage() {
  return (
    <main className="min-h-screen bg-[#420c14] overflow-x-hidden">
      <Suspense fallback={null}>
        <AuthCodeHandler />
      </Suspense>

      <LuxuryHeader source={SOURCE} />
      <HeroSection ns={NS} source={SOURCE} />
      <AboutSection ns={NS} />
      <FeaturesSection ns={NS} />
      <ExperienceSection ns={NS} />
      <PricingSection source={SOURCE} />
      <GoldenBannerSection ns={NS} />
      <TemplatesSection ns={NS} source={SOURCE} />
      <TestimonialsSection ns={NS} />
      <FinalCTASection ns={NS} source={SOURCE} />
      <AudienceTeaserSection
        ns={NS}
        sectionKey="coupleTeaser"
        ctaHref="/couples"
        icons={[
          <Sparkles key="sparkle" className="w-5 h-5 sm:w-6 sm:h-6" />,
          <Palette key="palette" className="w-5 h-5 sm:w-6 sm:h-6" />,
          <Send key="send" className="w-5 h-5 sm:w-6 sm:h-6" />,
          <Images key="gallery" className="w-5 h-5 sm:w-6 sm:h-6" />,
        ]}
      />
      <LuxuryFooter />
    </main>
  )
}

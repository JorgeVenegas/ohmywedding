"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { LuxuryHeader } from "@/components/landing/luxury-header"
import { HeroSection } from "@/components/landing/hero-section"

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
      const callbackUrl = `/auth/callback?code=${code}&redirect=/`
      window.location.href = callbackUrl
    }
  }, [code, router])
  
  return null
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#420c14] overflow-x-hidden">
      <Suspense fallback={null}>
        <AuthCodeHandler />
      </Suspense>
      
      <LuxuryHeader />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <ExperienceSection />
      <PricingSection />
      <GoldenBannerSection />
      <TemplatesSection />
      <TestimonialsSection />
      <FinalCTASection />
      <LuxuryFooter />
    </main>
  )
}

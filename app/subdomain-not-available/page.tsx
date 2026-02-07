"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TierComparison } from "@/components/ui/tier-comparison"
import { Crown, Home } from "lucide-react"
import { motion } from "framer-motion"

function SubdomainNotAvailableContent() {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain') || 'your-wedding'

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f5f2eb] to-[#f0ebe3]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#DDA46F] to-[#c99560] flex items-center justify-center shadow-xl shadow-[#DDA46F]/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#420c14] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Subdomains are a Premium Feature
          </motion.h1>

          <motion.p
            className="text-lg text-[#420c14]/70 max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your wedding is currently using a path-based URL. To use the custom subdomain
            <span className="font-semibold text-[#DDA46F]"> {subdomain}.ohmy.wedding</span>,
            upgrade to a Premium or Deluxe plan.
          </motion.p>
        </div>

        {/* Main Content Card */}
        <div className="mb-12">
          <p className="text-center text-[#420c14]/70 mb-8 text-lg">
            The subdomain <span className="font-semibold text-[#DDA46F]">{subdomain}.ohmy.wedding</span> is a Premium feature. Upgrade to unlock it and more benefits.
          </p>
          
          <TierComparison highlightSubdomain={true} showDeluxe={true} />
        </div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-[#420c14]/70 mb-6 text-lg">
            Ready to unlock your custom subdomain and premium features?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upgrade">
              <Button
                size="lg"
                className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] tracking-wider px-8"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>

            <Link href={`/${subdomain}`}>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#DDA46F]/30 text-[#420c14] hover:bg-[#DDA46F]/5 px-8"
              >
                <Home className="w-4 h-4 mr-2" />
                Use Path-based URL
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          className="mt-16 p-6 bg-white/60 backdrop-blur border border-[#420c14]/10 rounded-2xl text-center text-sm text-[#420c14]/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p>
            Your wedding site is always accessible at{" "}
            <span className="font-medium text-[#420c14]">ohmy.wedding/{subdomain}</span>
          </p>
          <p className="mt-2">
            Subdomains are a Premium feature that provides a more professional and branded experience.
          </p>
        </motion.div>
      </div>
    </main>
  )
}

export default function SubdomainNotAvailable() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f2eb]" />}>
      <SubdomainNotAvailableContent />
    </Suspense>
  )
}

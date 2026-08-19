"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, Home } from "lucide-react"
import { motion } from "framer-motion"

function SubdomainNotAvailableContent() {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain') || 'your-wedding'

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f5f2eb] to-[#f0ebe3] flex items-center justify-center">
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-[#420c14]/10 flex items-center justify-center">
            <Globe className="w-10 h-10 text-[#420c14]" />
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl font-serif text-[#420c14] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          URL not available
        </motion.h1>

        <motion.p
          className="text-lg text-[#420c14]/70 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          The address <span className="font-semibold text-[#DDA46F]">{subdomain}.ohmy.wedding</span> does not have an active wedding. It may have been renamed or the subscription may have changed.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href={`/${subdomain}`}>
            <Button
              size="lg"
              className="bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] tracking-wider px-8"
            >
              <Home className="w-4 h-4 mr-2" />
              Try path-based URL
            </Button>
          </Link>
        </motion.div>

        <motion.p
          className="mt-8 text-sm text-[#420c14]/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Looking for your admin? Go to{" "}
          <Link href="/admin" className="underline hover:text-[#420c14]/80 transition-colors">
            ohmy.wedding/admin
          </Link>
        </motion.p>
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

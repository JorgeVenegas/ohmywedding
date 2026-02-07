"use client"

import { Card } from "@/components/ui/card"
import { Sparkles, Check } from "lucide-react"
import { motion } from "framer-motion"

export interface TierComparisonProps {
  highlightSubdomain?: boolean
  showDeluxe?: boolean
}

export function TierComparison({ highlightSubdomain = false, showDeluxe = true }: TierComparisonProps) {
  return (
    <div className={`grid gap-8 ${showDeluxe ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      {/* Free Tier */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white border-2 border-[#420c14]/10 p-8 h-full">
          <h3 className="text-xl font-serif text-[#420c14] mb-6">Free</h3>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-[#DDA46F]" />
              </div>
              <div>
                <p className="font-medium text-[#420c14]">50 guests</p>
                <p className="text-sm text-[#420c14]/60">Basic capacity</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-[#DDA46F]" />
              </div>
              <div>
                <p className="font-medium text-[#420c14]">Basic features</p>
                <p className="text-sm text-[#420c14]/60">Build your site</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-[#DDA46F]" />
              </div>
              <div>
                <p className="font-medium text-[#420c14]">Path-based URL</p>
                <p className="text-sm text-[#420c14]/60">ohmy.wedding/yourname</p>
              </div>
            </div>

            {!highlightSubdomain && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#DDA46F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#DDA46F]" />
                </div>
                <div>
                  <p className="font-medium text-[#420c14]">Email invites</p>
                  <p className="text-sm text-[#420c14]/60">Send invitations</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center pt-6 border-t border-[#420c14]/10">
            <p className="text-3xl font-serif text-[#420c14]">Free</p>
          </div>
        </Card>
      </motion.div>

      {/* Premium Tier */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className={`${highlightSubdomain ? 'bg-white border-2 border-[#420c14]/10 p-8' : 'bg-gradient-to-br from-[#DDA46F]/10 to-[#c99560]/5 border-2 border-[#DDA46F] p-8'} h-full relative overflow-hidden`}>
          {!highlightSubdomain && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDA46F]/10 rounded-full -mr-16 -mt-16" />
          )}

          <div className={highlightSubdomain ? '' : 'relative z-10'}>
            {!highlightSubdomain && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDA46F] text-white text-xs font-bold tracking-wider mb-6">
                <Sparkles className="w-3 h-3" />
                POPULAR
              </div>
            )}

            <h3 className="text-xl font-serif text-[#420c14] mb-6">Premium</h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${highlightSubdomain ? 'bg-[#DDA46F]/20' : 'bg-[#DDA46F]'}`}>
                  <Check className={`w-3 h-3 ${highlightSubdomain ? 'text-[#DDA46F]' : 'text-white'}`} />
                </div>
                <div>
                  <p className="font-medium text-[#420c14]">250 guests</p>
                  <p className="text-sm text-[#420c14]/70">Larger celebrations</p>
                </div>
              </div>

              {highlightSubdomain && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Custom subdomain</p>
                    <p className="text-sm text-[#420c14]/70">Your custom domain</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${highlightSubdomain ? 'bg-[#DDA46F]/20' : 'bg-[#DDA46F]'}`}>
                  <Check className={`w-3 h-3 ${highlightSubdomain ? 'text-[#DDA46F]' : 'text-white'}`} />
                </div>
                <div>
                  <p className="font-medium text-[#420c14]">Custom registry</p>
                  <p className="text-sm text-[#420c14]/70">Registry with payments</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${highlightSubdomain ? 'bg-[#DDA46F]/20' : 'bg-[#DDA46F]'}`}>
                  <Check className={`w-3 h-3 ${highlightSubdomain ? 'text-[#DDA46F]' : 'text-white'}`} />
                </div>
                <div>
                  <p className="font-medium text-[#420c14]">Send WhatsApp invites</p>
                  <p className="text-sm text-[#420c14]/70">Direct invitations</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${highlightSubdomain ? 'bg-[#DDA46F]/20' : 'bg-[#DDA46F]'}`}>
                  <Check className={`w-3 h-3 ${highlightSubdomain ? 'text-[#DDA46F]' : 'text-white'}`} />
                </div>
                <div>
                  <p className="font-medium text-[#420c14]">Full RSVP system</p>
                  <p className="text-sm text-[#420c14]/70">Track confirmations</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t border-[#420c14]/10">
              <p className="text-3xl font-serif text-[#420c14]">$250</p>
              <p className="text-xs text-[#420c14]/60 mt-1">one-time</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Deluxe Tier */}
      {showDeluxe && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-[#DDA46F]/15 to-[#c99560]/10 border-2 border-[#DDA46F]/50 p-8 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDA46F]/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#DDA46F]/20 border border-[#DDA46F]/50 text-xs font-bold text-[#420c14]">
              Best Value
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-serif text-[#420c14] mb-6">Deluxe</h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Unlimited guests</p>
                    <p className="text-sm text-[#420c14]/70">No limits</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Custom subdomain</p>
                    <p className="text-sm text-[#420c14]/70">Premium domain</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Custom registry</p>
                    <p className="text-sm text-[#420c14]/70">With payments</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Send WhatsApp invites</p>
                    <p className="text-sm text-[#420c14]/70">Direct invitations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#DDA46F] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#420c14]">Priority support</p>
                    <p className="text-sm text-[#420c14]/70">Premium assistance</p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-6 border-t border-[#DDA46F]/20">
                <p className="text-3xl font-serif text-[#420c14]">$500</p>
                <p className="text-xs text-[#420c14]/60 mt-1">one-time</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

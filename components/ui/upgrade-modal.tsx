"use client"

import React from 'react'
import Link from 'next/link'
import { Crown, Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export type UpgradeReason = 
  | 'general'
  | 'guest_limit'
  | 'group_limit'
  | 'send_invites'
  | 'invite_settings'
  | 'invitation_tracking'
  | 'rsvp_system'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason: UpgradeReason
  currentCount?: number
  limit?: number
}

const CONTENT_MAP: Record<UpgradeReason, { title: string; description: string; features: string[]; imagePlaceholder?: string; planLevel?: string }> = {
  general: {
    title: 'Upgrade Your Wedding Plan',
    description: 'Unlock premium features to make your wedding planning experience even better.',
    features: [
      'Up to 250 guests (Premium) or Unlimited (Deluxe)',
      'Send personalized WhatsApp invitations',
      'Full RSVP system with confirmation tracking',
      'Custom invitation templates & settings',
      'Activity reports and analytics',
      'Custom subdomain for your wedding site',
    ],
    imagePlaceholder: 'general',
  },
  guest_limit: {
    title: 'Guest Limit Reached',
    description: 'Upgrade to add more guests to your celebration.',
    features: [
      'Up to 250 guests (Premium) or Unlimited (Deluxe)',
      'Personalized digital invitations',
      'Advanced RSVP tracking',
      'Confirmation & activity tracking',
    ],
    imagePlaceholder: 'guests',
  },
  group_limit: {
    title: 'Group Limit Reached',
    description: 'Upgrade to organize unlimited guest groups.',
    features: [
      'Unlimited guest groups',
      'Bulk invite management',
      'Group travel coordination',
      'Advanced organization tools',
    ],
    imagePlaceholder: 'groups',
  },
  send_invites: {
    title: 'Send WhatsApp Invitations',
    description: 'Send personalized WhatsApp invitations directly to your guests. Group-level sending available with Deluxe plan.',
    features: [
      'Send invites via WhatsApp to individual guests',
      'Send to entire groups at once (Deluxe)',
      'Personalized invitation templates',
      'Track who opened invitations',
      'Automatic confirmation tracking',
      'Direct messaging to multiple guests',
    ],
    imagePlaceholder: 'send-invites',
    planLevel: 'deluxe',
  },
  invite_settings: {
    title: 'Invitation Settings',
    description: 'Customize your invitation messages and templates to match your wedding style.',
    features: [
      'Custom invitation templates',
      'Personalized message variables',
      'Template variables support',
      'Professional invitation management',
      'Multi-language support',
      'Brand customization',
    ],
    imagePlaceholder: 'invite-settings',
  },
  invitation_tracking: {
    title: 'Invitation Tracking',
    description: 'See exactly when your guests view and confirm their invitations.',
    features: [
      'See who opened invitations',
      'Confirmation timestamps',
      'Activity reports & timeline',
      'Detailed analytics & insights',
      'Bulk action capabilities',
      'Export reports',
    ],
    imagePlaceholder: 'tracking',
  },
  rsvp_system: {
    title: 'RSVP System',
    description: 'Enable advanced RSVP management with comprehensive guest tracking.',
    features: [
      'Full RSVP system with confirmations',
      'Guest confirmation tracking',
      'Travel information collection',
      'Dietary restrictions management',
      'Guest status workflow',
      'Export guest data',
    ],
    imagePlaceholder: 'rsvp',
  },
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const content = CONTENT_MAP[reason]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#f5f2eb] rounded-[1.5rem] shadow-2xl pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#DDA46F] via-[#c99560] to-[#DDA46F]" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#420c14]/5 hover:bg-[#420c14]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#420c14]/60" />
              </button>

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DDA46F] to-[#c99560] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#DDA46F]/20">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#420c14]">{content.title}</h2>
                    <p className="text-sm text-[#420c14]/60 mt-1">{content.description}</p>
                    {content.planLevel && (
                      <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-[#DDA46F]/10 border border-[#DDA46F]/30">
                        <Crown className="w-3.5 h-3.5 text-[#DDA46F]" />
                        <span className="text-xs font-medium text-[#DDA46F] uppercase tracking-wide">{content.planLevel} Feature</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Demo Image/Video Placeholder */}
                <div className="mb-6 rounded-xl overflow-hidden border border-[#420c14]/10 bg-gradient-to-br from-[#420c14]/5 to-[#DDA46F]/5">
                  <div className="aspect-video w-full flex items-center justify-center bg-[#f0ebe3]">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DDA46F]/10 mb-3">
                        <Sparkles className="w-8 h-8 text-[#DDA46F]" />
                      </div>
                      <p className="text-sm text-[#420c14]/50">Demo image or video coming soon</p>
                      <p className="text-xs text-[#420c14]/30 mt-1">Shows how this feature works in action</p>
                    </div>
                  </div>
                </div>

                {/* Usage bar (if applicable) */}
                {currentCount !== undefined && limit !== undefined && (
                  <div className="bg-white rounded-xl p-4 border border-[#420c14]/10 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#420c14]/70">Current Usage</span>
                      <span className="text-sm font-bold text-[#420c14]">
                        {currentCount} / {limit}
                      </span>
                    </div>
                    <div className="w-full bg-[#420c14]/5 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-[#DDA46F] to-[#c99560] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Features list */}
                <div className="mb-6">
                  <h4 className="font-medium text-[#420c14] mb-3 flex items-center gap-2 text-sm tracking-wider uppercase">
                    <Sparkles className="w-4 h-4 text-[#DDA46F]" />
                    {content.planLevel === 'deluxe' ? 'Deluxe Features' : 'Unlock with Premium'}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {content.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-2.5 text-sm bg-white rounded-lg px-3 py-2.5 border border-[#420c14]/5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#420c14]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#420c14]" />
                        </div>
                        <span className="text-[#420c14]/80">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick pricing comparison */}
                <div className={`grid gap-3 mb-6 ${content.planLevel === 'deluxe' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="rounded-xl border border-[#420c14]/10 p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-[#420c14]/70">Free</h5>
                      <span className="text-xl font-serif text-[#420c14]">$0</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#420c14]/50">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        <span>Up to 50 guests</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        <span>15 guest groups</span>
                      </li>
                    </ul>
                  </div>
                  <div className={`rounded-xl border-2 p-4 relative ${content.planLevel === 'deluxe' ? 'border-[#420c14]/20 bg-white' : 'border-[#DDA46F] bg-[#DDA46F]/5'}`}>
                    {content.planLevel !== 'deluxe' && (
                      <div className="absolute -top-2 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#420c14] text-[#f5f2eb]">
                          <Sparkles className="w-2.5 h-2.5" />
                          Popular
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-[#420c14]">Premium</h5>
                      <div className="text-right">
                        <span className="text-xl font-serif text-[#420c14]">$250</span>
                        <span className="text-[10px] text-[#420c14]/50 block">one-time</span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-xs text-[#420c14]/70">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#DDA46F]" />
                        <span className="font-medium">250 guests</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#DDA46F]" />
                        <span className="font-medium">Unlimited groups</span>
                      </li>
                    </ul>
                  </div>
                  {content.planLevel === 'deluxe' && (
                    <div className="rounded-xl border-2 border-[#DDA46F] p-4 bg-[#DDA46F]/5 relative">
                      <div className="absolute -top-2 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#420c14] text-[#f5f2eb]">
                          <Crown className="w-2.5 h-2.5" />
                          Best
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-[#420c14]">Deluxe</h5>
                        <div className="text-right">
                          <span className="text-xl font-serif text-[#420c14]">$500</span>
                          <span className="text-[10px] text-[#420c14]/50 block">one-time</span>
                        </div>
                      </div>
                      <ul className="space-y-1 text-xs text-[#420c14]/70">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#DDA46F]" />
                          <span className="font-medium">Unlimited guests</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#DDA46F]" />
                          <span className="font-medium">Unlimited groups</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/upgrade" className="flex-1">
                    <Button 
                      className="w-full h-12 bg-[#420c14] hover:bg-[#5a1a22] text-[#f5f2eb] tracking-wider transition-all duration-300"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Plans & Upgrade
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    size="lg"
                    className="text-[#420c14]/60 hover:text-[#420c14] hover:bg-[#420c14]/5"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

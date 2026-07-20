// Pure recommendation logic for the interactive landing-page pricing quizzes.
// No React/UI here — components/landing/pricing/* consume these.

import type { InvitationTier, ManagementTier } from '@/lib/subscription-shared'

// --- Couples ---

export type GuestBand = 'under100' | '100to250' | 'over250'
export type InvitationStyleAnswer = 'simple' | 'unique' | 'custom'
export type ManagementNeedAnswer = 'essentials' | 'fullToolkit' | 'hasPlanner'

export interface CoupleQuizAnswers {
  guestBand: GuestBand
  invitationStyle: InvitationStyleAnswer
  managementNeed: ManagementNeedAnswer
}

export interface CoupleRecommendation {
  invitationTier: InvitationTier
  managementTier: ManagementTier
  suggestPlanner: boolean
}

export function recommendCouplePlan(answers: CoupleQuizAnswers): CoupleRecommendation {
  const invitationTier: InvitationTier =
    answers.invitationStyle === 'simple' ? 'basic'
      : answers.invitationStyle === 'custom' ? 'bespoke'
      : 'personalized'

  const suggestPlanner = answers.managementNeed === 'hasPlanner'

  let managementTier: ManagementTier
  if (suggestPlanner || answers.guestBand === 'over250') {
    managementTier = 'agency'
  } else if (answers.guestBand === 'under100' || answers.managementNeed === 'essentials') {
    managementTier = 'basic'
  } else {
    managementTier = 'agency'
  }

  return { invitationTier, managementTier, suggestPlanner }
}

// --- Planners ---

export type WeddingVolume = 'low' | 'mid' | 'high' // 1-5, 6-15, 16+
export type PlannerPriority = 'branding' | 'dashboard' | 'support'
export type PlannerBillingCycle = 'once' | 'monthly' | 'annual'

export interface PlannerQuizAnswers {
  weddingVolume: WeddingVolume
  priority: PlannerPriority
}

export interface PlannerRecommendation {
  managementTier: ManagementTier
  billingCycle: PlannerBillingCycle
}

// Planners always land on Agency (the tier built for them).
// Volume drives billing: low volume → pay per wedding (OTP);
// growing studios → monthly; high-volume agencies → annual (best economics).
export function recommendPlannerPlan(answers: PlannerQuizAnswers): PlannerRecommendation {
  const billingCycle: PlannerBillingCycle =
    answers.weddingVolume === 'high' ? 'annual' :
    answers.weddingVolume === 'mid'  ? 'monthly' :
    'once'

  return { managementTier: 'agency', billingCycle }
}

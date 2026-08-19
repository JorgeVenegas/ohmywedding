// Invitation design workflow — status types, transition map, and enforcement logic.
// This is the single source of truth for which transitions are valid and who can trigger them.
// Every API route that mutates status must call canTransition() before proceeding.

export const DESIGN_STATUSES = [
  'not_started',
  'discovery_meeting',
  'design_started',
  'ready_for_review',
  'review_meeting',
  'changes_in_progress',
  'approved',
  'delivery_meeting',
  'live',
] as const

export type DesignStatus = typeof DESIGN_STATUSES[number]
export type TransitionActor = 'superadmin' | 'reviewer'
export type WorkflowPlan = 'free' | 'premium' | 'deluxe'

// Global allowed transitions — union of all plans and actors.
// API routes use this for validation; the UI uses PLAN_SUPERADMIN_NEXT for guided progression.
export const ALLOWED_TRANSITIONS: Record<DesignStatus, DesignStatus[]> = {
  not_started:         ['discovery_meeting', 'design_started'],
  discovery_meeting:   ['design_started'],
  design_started:      ['ready_for_review'],
  ready_for_review:    ['review_meeting', 'changes_in_progress', 'approved', 'live'],
  review_meeting:      ['changes_in_progress', 'live'],
  changes_in_progress: ['ready_for_review', 'delivery_meeting', 'live'],
  approved:            ['delivery_meeting', 'live'],
  delivery_meeting:    ['live'],
  live:                ['ready_for_review'],
}

// Per-plan superadmin transitions — drives the "Next Status" select in the UI.
// Bespoke has meeting checkpoints and allows unlimited revision loops.
// Personalized has no meetings; Basic is a straight line.
const PLAN_SUPERADMIN_NEXT: Record<WorkflowPlan, Partial<Record<DesignStatus, DesignStatus[]>>> = {
  deluxe: {
    not_started:         ['discovery_meeting'],
    discovery_meeting:   ['design_started'],
    design_started:      ['ready_for_review'],
    ready_for_review:    ['review_meeting'],
    review_meeting:      ['changes_in_progress'],
    changes_in_progress: ['ready_for_review', 'delivery_meeting'],
    approved:            ['delivery_meeting'],
    delivery_meeting:    ['live'],
    live:                ['ready_for_review'],
  },
  premium: {
    not_started:         ['design_started'],
    design_started:      ['ready_for_review'],
    ready_for_review:    ['changes_in_progress', 'live'],
    changes_in_progress: ['ready_for_review', 'delivery_meeting', 'live'],
    approved:            ['delivery_meeting', 'live'],
    delivery_meeting:    ['live'],
    live:                ['ready_for_review'],
  },
  free: {
    not_started:         ['design_started'],
    design_started:      ['ready_for_review'],
    ready_for_review:    ['changes_in_progress', 'live'],
    changes_in_progress: ['ready_for_review', 'live'],
    approved:            ['live'],
    live:                ['ready_for_review'],
  },
}

export function canTransition(
  from: DesignStatus,
  to: DesignStatus,
  actor: TransitionActor,
): boolean {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) return false
  // Only reviewers (the couple / assigned reviewer) can set approved
  if (to === 'approved') return actor === 'reviewer'
  return actor === 'superadmin'
}

// Returns the statuses the given actor can transition to from `from`.
// When actor is superadmin and plan is provided, returns only the plan-appropriate next steps.
export function availableTransitions(
  from: DesignStatus,
  actor: TransitionActor,
  plan?: WorkflowPlan,
): DesignStatus[] {
  if (actor === 'reviewer') {
    return canTransition(from, 'approved', 'reviewer') ? ['approved'] : []
  }
  if (plan) {
    const next = PLAN_SUPERADMIN_NEXT[plan][from] ?? []
    return next.filter((to) => canTransition(from, to, 'superadmin'))
  }
  // Fallback: all superadmin-allowed transitions (no plan context)
  return ALLOWED_TRANSITIONS[from].filter((to) => canTransition(from, to, 'superadmin'))
}

export const STATUS_LABELS: Record<DesignStatus, string> = {
  not_started:         'Not Started',
  discovery_meeting:   'Discovery Meeting',
  design_started:      'Design Started',
  ready_for_review:    'Ready for Review',
  review_meeting:      'Review Meeting',
  changes_in_progress: 'Changes in Progress',
  approved:            'Approved',
  delivery_meeting:    'Delivery Meeting',
  live:                'Live',
}

export const STATUS_DESCRIPTIONS: Record<DesignStatus, string> = {
  not_started:         "Your invitation is in the queue. We'll begin design shortly.",
  discovery_meeting:   'We\'re scheduling your discovery meeting to define your moodboard and brief.',
  design_started:      'Our team is actively designing your invitation.',
  ready_for_review:    'Your invitation is ready. Review it and share your thoughts.',
  review_meeting:      'We\'re scheduling a meeting to walk you through the design.',
  changes_in_progress: 'Our team is incorporating your feedback.',
  approved:            'Design approved. Our team is preparing the final presentation.',
  delivery_meeting:    'We\'re scheduling your delivery meeting for the grand reveal.',
  live:                'Your invitation is live and ready for your guests.',
}

export function isPreviewable(status: DesignStatus): boolean {
  return ['ready_for_review', 'review_meeting', 'changes_in_progress', 'approved', 'live'].includes(status)
}

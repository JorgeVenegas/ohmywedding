// Invitation design workflow — status types, transition map, and enforcement logic.
// This is the single source of truth for which transitions are valid and who can trigger them.
// Every API route that mutates status must call canTransition() before proceeding.
// DB CHECK constraints are a secondary backstop only.

export const DESIGN_STATUSES = [
  'not_started',
  'design_started',
  'ready_for_review',
  'approved',
  'live',
] as const

export type DesignStatus = typeof DESIGN_STATUSES[number]

export type TransitionActor = 'superadmin' | 'reviewer'

// All valid transitions
export const ALLOWED_TRANSITIONS: Record<DesignStatus, DesignStatus[]> = {
  not_started:      ['design_started'],
  design_started:   ['not_started', 'ready_for_review'],
  ready_for_review: ['design_started', 'approved'],
  approved:         ['ready_for_review', 'live'],
  live:             ['ready_for_review'],
}

type TransitionKey = `${DesignStatus}->${DesignStatus}`

// Who is permitted to trigger each individual transition
export const TRANSITION_ACTOR: Partial<Record<TransitionKey, TransitionActor>> = {
  'not_started->design_started':      'superadmin',
  'design_started->not_started':      'superadmin',
  'design_started->ready_for_review': 'superadmin',
  'ready_for_review->design_started': 'superadmin',
  'ready_for_review->approved':       'reviewer',
  'approved->ready_for_review':       'superadmin',
  'approved->live':                   'superadmin',
  'live->ready_for_review':           'superadmin',
}

export function canTransition(
  from: DesignStatus,
  to: DesignStatus,
  actor: TransitionActor,
): boolean {
  const key = `${from}->${to}` as TransitionKey
  const allowed = ALLOWED_TRANSITIONS[from]
  if (!allowed.includes(to)) return false
  const required = TRANSITION_ACTOR[key]
  if (!required) return false
  return actor === required
}

// Returns all statuses that the given actor can transition to from `from`
export function availableTransitions(
  from: DesignStatus,
  actor: TransitionActor,
): DesignStatus[] {
  return ALLOWED_TRANSITIONS[from].filter((to) => {
    const key = `${from}->${to}` as TransitionKey
    return TRANSITION_ACTOR[key] === actor
  })
}

export const STATUS_LABELS: Record<DesignStatus, string> = {
  not_started:      'Not Started',
  design_started:   'Design Started',
  ready_for_review: 'Ready for Review',
  approved:         'Approved',
  live:             'Live',
}

export const STATUS_DESCRIPTIONS: Record<DesignStatus, string> = {
  not_started:      'Your invitation is in the queue. We\'ll begin design shortly.',
  design_started:   'Our team is actively designing your invitation.',
  ready_for_review: 'Your invitation is ready. Review it and share your approval.',
  approved:         'Design approved. Our team is preparing the final launch.',
  live:             'Your invitation is live and ready for your guests.',
}

export function isPreviewable(status: DesignStatus): boolean {
  return status === 'ready_for_review' || status === 'approved' || status === 'live'
}

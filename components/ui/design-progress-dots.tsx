"use client"

import { cn } from "@/lib/utils"

type PlanType = 'free' | 'premium' | 'deluxe'
type DesignStatus = 'not_started' | 'discovery_meeting' | 'design_started' | 'ready_for_review' | 'review_meeting' | 'changes_in_progress' | 'approved' | 'delivery_meeting' | 'live'

export interface WorkflowStage {
  id: string        // primary DB status this stage represents
  label: string
  sublabel: string
  meeting: boolean
}

// Linear journey stages per plan.
// Loops (changes_in_progress ↔ ready_for_review) are shown as a single stage;
// the progress indicator shows the current position regardless of how many loops occurred.
export const WORKFLOWS: Record<PlanType, WorkflowStage[]> = {
  deluxe: [
    { id: 'discovery_meeting',   label: 'Discovery',    sublabel: 'Moodboard & brief',        meeting: true  },
    { id: 'design_started',      label: 'Design',       sublabel: 'Creating your invitation',  meeting: false },
    { id: 'ready_for_review',    label: 'First Look',   sublabel: 'Sent for review',           meeting: false },
    { id: 'review_meeting',      label: 'Presentation', sublabel: 'Design walk-through',       meeting: true  },
    { id: 'changes_in_progress', label: 'Refinement',   sublabel: 'Incorporating feedback',    meeting: false },
    { id: 'delivery_meeting',    label: 'Delivery',     sublabel: 'Grand reveal',              meeting: true  },
    { id: 'live',                label: 'Live',         sublabel: 'Ready for guests',          meeting: false },
  ],
  premium: [
    { id: 'design_started',      label: 'Brief',        sublabel: 'Style preferences',         meeting: false },
    { id: 'ready_for_review',    label: 'First Draft',  sublabel: 'Sent for review',           meeting: false },
    { id: 'changes_in_progress', label: 'Revisions',    sublabel: 'Up to 2 rounds',            meeting: false },
    { id: 'live',                label: 'Published',    sublabel: 'Design live',               meeting: false },
  ],
  free: [
    { id: 'design_started',      label: 'In Design',    sublabel: 'Template applied',          meeting: false },
    { id: 'ready_for_review',    label: 'Review',       sublabel: 'Final check',               meeting: false },
    { id: 'live',                label: 'Live',         sublabel: 'Published',                 meeting: false },
  ],
}

// Maps a DB status to a 0-based stage index for each plan. -1 = not yet started.
// Loop statuses (e.g. ready_for_review after changes) map to their stage position in the
// forward journey — the dot shows where you are now, not how many loops you've done.
export function getActiveStageIndex(plan: PlanType, status: DesignStatus): number {
  const map: Record<DesignStatus, Record<PlanType, number>> = {
    not_started:         { deluxe: -1, premium: -1, free: -1 },
    discovery_meeting:   { deluxe:  0, premium: -1, free: -1 },
    design_started:      { deluxe:  1, premium:  0, free:  0 },
    ready_for_review:    { deluxe:  2, premium:  1, free:  1 },
    review_meeting:      { deluxe:  3, premium:  1, free:  1 },
    changes_in_progress: { deluxe:  4, premium:  2, free:  1 },
    approved:            { deluxe:  5, premium:  3, free:  2 },
    delivery_meeting:    { deluxe:  5, premium: -1, free: -1 },
    live:                { deluxe:  6, premium:  3, free:  2 },
  }
  return map[status]?.[plan] ?? -1
}

export function getActiveStageLabel(plan: PlanType, status: DesignStatus): string {
  if (status === 'not_started') return 'Not started'
  const stages = WORKFLOWS[plan]
  const idx = getActiveStageIndex(plan, status)
  return stages[idx]?.label ?? 'Not started'
}

// ────────────────────────────────────────────────────────────────
// Compact version — fits in a table cell
// ────────────────────────────────────────────────────────────────
export function DesignProgressDots({
  plan,
  status,
}: {
  plan: PlanType
  status: DesignStatus
}) {
  const stages = WORKFLOWS[plan]
  const activeIdx = getActiveStageIndex(plan, status)
  const isNotStarted = status === 'not_started'
  const isDeluxe = plan === 'deluxe'

  return (
    <div className="flex flex-col gap-1.5">
      {/* Node track */}
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const isComplete = i < activeIdx
          const isActive   = i === activeIdx
          const isPending  = i > activeIdx || isNotStarted

          return (
            <div key={stage.id} className="flex items-center">
              {isDeluxe ? (
                /* Diamond node for Bespoke */
                <div
                  title={`${stage.label}${stage.meeting ? ' (meeting)' : ''}`}
                  className={cn(
                    "relative w-[9px] h-[9px] rotate-45 rounded-[1.5px] transition-all duration-200",
                    isComplete && "bg-[#420c14]",
                    isActive   && "bg-[#DDA46F] shadow-[0_0_0_2px_rgba(221,164,111,0.25)]",
                    isPending  && "bg-[#420c14]/10 border border-[#420c14]/15",
                  )}
                >
                  {stage.meeting && !isPending && (
                    <div className={cn(
                      "absolute -top-[3px] -right-[3px] w-[4px] h-[4px] rotate-0 rounded-full",
                      isComplete ? "bg-[#DDA46F]" : isActive ? "bg-white" : "hidden"
                    )} />
                  )}
                </div>
              ) : (
                /* Circle node */
                <div
                  title={stage.label}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    plan === 'free' ? "w-[7px] h-[7px]" : "w-[8px] h-[8px]",
                    isComplete && (plan === 'premium' ? "bg-[#DDA46F]" : "bg-[#420c14]/35"),
                    isActive   && (plan === 'premium' ? "bg-[#DDA46F] shadow-[0_0_0_2px_rgba(221,164,111,0.2)]" : "bg-[#420c14]/50"),
                    isPending  && "bg-[#420c14]/8 border border-[#420c14]/12",
                  )}
                />
              )}

              {/* Connector */}
              {i < stages.length - 1 && (
                <div className={cn(
                  "h-px",
                  isDeluxe ? "w-[11px]" : plan === 'free' ? "w-[10px]" : "w-[12px]",
                  isComplete ? (isDeluxe ? "bg-[#420c14]/30" : "bg-[#420c14]/15") : "bg-[#420c14]/8"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Current stage label */}
      <span className={cn(
        "text-[9.5px] font-medium leading-none whitespace-nowrap",
        isNotStarted
          ? "text-[#420c14]/25"
          : isDeluxe
          ? "text-[#420c14]/55 uppercase tracking-[0.12em]"
          : "text-[#420c14]/50"
      )}>
        {isNotStarted ? "Not started" : stages[activeIdx]?.label}
      </span>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Full (horizontal journey) version — for progress pages
// ────────────────────────────────────────────────────────────────
export function DesignProgressJourney({
  plan,
  status,
}: {
  plan: PlanType
  status: DesignStatus
}) {
  const stages = WORKFLOWS[plan]
  const activeIdx = getActiveStageIndex(plan, status)
  const isDeluxe = plan === 'deluxe'
  const isPremium = plan === 'premium'

  return (
    <div className="w-full">
      <div className="flex items-start">
        {stages.map((stage, i) => {
          const isComplete = i < activeIdx
          const isActive   = i === activeIdx
          const isPending  = i > activeIdx

          return (
            <div key={stage.id} className="flex items-start flex-1">
              {/* Stage column */}
              <div className="flex flex-col items-center flex-1 relative">
                {/* Node */}
                <div className="relative flex items-center justify-center mb-3">
                  {isDeluxe ? (
                    <div className={cn(
                      "w-5 h-5 rotate-45 rounded-[2px] transition-all duration-300",
                      isComplete && "bg-[#420c14]",
                      isActive   && "bg-[#DDA46F] shadow-md shadow-[#DDA46F]/30",
                      isPending  && "bg-white border-2 border-[#420c14]/15",
                    )}>
                      {stage.meeting && (
                        <div className={cn(
                          "absolute -top-[5px] -right-[5px] w-[9px] h-[9px] rounded-full rotate-[-45deg]",
                          isComplete ? "bg-[#DDA46F]" : isActive ? "bg-white border border-[#DDA46F]/60" : "hidden"
                        )} />
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center",
                      isComplete && (isPremium ? "bg-[#DDA46F]" : "bg-[#420c14]/40"),
                      isActive   && (isPremium ? "bg-[#DDA46F] shadow-md shadow-[#DDA46F]/25" : "bg-[#420c14]/60"),
                      isPending  && "bg-white border-2 border-[#420c14]/12",
                    )}>
                      {isComplete && (
                        <svg viewBox="0 0 8 8" className="w-2 h-2" fill="none">
                          <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="text-center px-1">
                  <p className={cn(
                    "text-[11px] font-semibold leading-tight",
                    isDeluxe ? "uppercase tracking-[0.1em]" : "",
                    isActive   ? "text-[#420c14]" :
                    isComplete ? "text-[#420c14]/60" :
                                 "text-[#420c14]/25"
                  )}>
                    {stage.label}
                  </p>
                  <p className={cn(
                    "text-[9.5px] mt-0.5 leading-tight",
                    isActive ? "text-[#420c14]/50" : "text-[#420c14]/25"
                  )}>
                    {stage.sublabel}
                  </p>
                  {isDeluxe && stage.meeting && (
                    <p className={cn(
                      "text-[8px] mt-0.5 uppercase tracking-wider",
                      isActive ? "text-[#DDA46F]" : isComplete ? "text-[#DDA46F]/50" : "text-[#420c14]/15"
                    )}>
                      meeting
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line between stages */}
              {i < stages.length - 1 && (
                <div className="flex-shrink-0 w-8 mt-[10px]">
                  <div className={cn(
                    "h-px w-full",
                    isComplete ? (isDeluxe ? "bg-[#420c14]/25" : "bg-[#420c14]/15") : "bg-[#420c14]/8"
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

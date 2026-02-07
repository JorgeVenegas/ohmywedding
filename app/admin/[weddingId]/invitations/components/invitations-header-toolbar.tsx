"use client"

import { InvitationsHeaderContent } from "./invitations-header"
import { InvitationsToolbarContent } from "./invitations-toolbar"
import type { InvitationsHeaderProps } from "./invitations-header"
import type { InvitationsToolbarProps } from "./invitations-toolbar"

interface InvitationsHeaderToolbarProps {
  headerProps: InvitationsHeaderProps
  toolbarProps: InvitationsToolbarProps
}

export function InvitationsHeaderToolbar({
  headerProps,
  toolbarProps,
}: InvitationsHeaderToolbarProps) {
  return (
    <div className="sticky top-[57px] z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="py-4">
          <InvitationsHeaderContent {...headerProps} />
        </div>

        {/* Toolbar Section */}
        <div className="border-t border-border/30 py-3">
          <InvitationsToolbarContent {...toolbarProps} />
        </div>
      </div>
    </div>
  )
}

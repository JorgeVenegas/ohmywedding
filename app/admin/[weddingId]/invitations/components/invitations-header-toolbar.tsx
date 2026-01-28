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
    <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur">
      {/* Header Section */}
      <div className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <InvitationsHeaderContent {...headerProps} />
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="py-3 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InvitationsToolbarContent {...toolbarProps} />
        </div>
      </div>
    </div>
  )
}

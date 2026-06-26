"use client"

import React from 'react'
import { SpecialGuestsOldMoneyVariant, BaseSpecialGuestsProps } from './special-guests-variants'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface SpecialGuestsSectionProps extends BaseSpecialGuestsProps {
  variant?: 'old-money'
}

export function SpecialGuestsSection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  introText,
  showTitle = true,
  showSubtitle = true,
  showIntroText = true,
  showParents = true,
  brideParentsTitle,
  brideParents,
  showBrideParents = true,
  groomParentsTitle,
  groomParents,
  showGroomParents = true,
  partyGroups,
  variant = 'old-money',
  useColorBackground,
  backgroundColorChoice,
}: SpecialGuestsSectionProps) {
  const customizeContext = useCustomizeSafe()
  const customConfig = customizeContext?.getSectionConfig('special-guests') || {}

  const effectiveTitle             = customConfig.sectionTitle       ?? sectionTitle
  const effectiveSubtitle          = customConfig.sectionSubtitle    ?? sectionSubtitle
  const effectiveIntroText         = customConfig.introText          ?? introText
  const effectiveShowTitle         = customConfig.showTitle          ?? showTitle
  const effectiveShowSubtitle      = customConfig.showSubtitle       ?? showSubtitle
  const effectiveShowIntroText     = customConfig.showIntroText      ?? showIntroText
  const effectiveShowParents       = customConfig.showParents        ?? showParents
  const effectiveBrideParentsTitle = customConfig.brideParentsTitle  ?? brideParentsTitle
  const effectiveBrideParents      = customConfig.brideParents       ?? brideParents
  const effectiveShowBrideParents  = customConfig.showBrideParents   ?? showBrideParents
  const effectiveGroomParentsTitle = customConfig.groomParentsTitle  ?? groomParentsTitle
  const effectiveGroomParents      = customConfig.groomParents       ?? groomParents
  const effectiveShowGroomParents  = customConfig.showGroomParents   ?? showGroomParents
  const effectivePartyGroups       = customConfig.partyGroups        ?? partyGroups
  const effectiveUseColorBg        = customConfig.useColorBackground ?? useColorBackground
  const effectiveBgChoice          = customConfig.backgroundColorChoice ?? backgroundColorChoice

  const commonProps: BaseSpecialGuestsProps = {
    theme,
    alignment,
    sectionTitle: effectiveTitle,
    sectionSubtitle: effectiveSubtitle,
    introText: effectiveIntroText,
    showTitle: effectiveShowTitle,
    showSubtitle: effectiveShowSubtitle,
    showIntroText: effectiveShowIntroText,
    showParents: effectiveShowParents,
    brideParentsTitle: effectiveBrideParentsTitle,
    brideParents: effectiveBrideParents,
    showBrideParents: effectiveShowBrideParents,
    groomParentsTitle: effectiveGroomParentsTitle,
    groomParents: effectiveGroomParents,
    showGroomParents: effectiveShowGroomParents,
    partyGroups: effectivePartyGroups,
    useColorBackground: effectiveUseColorBg,
    backgroundColorChoice: effectiveBgChoice,
  }

  const onEditClick = (_sectionId: string, sectionType: string) => {
    customizeContext?.openCustomizer('special-guests', sectionType, commonProps)
  }

  return (
    <EditableSectionWrapper sectionId="special-guests" sectionType="special-guests" onEditClick={onEditClick}>
      <SpecialGuestsOldMoneyVariant {...commonProps} />
    </EditableSectionWrapper>
  )
}

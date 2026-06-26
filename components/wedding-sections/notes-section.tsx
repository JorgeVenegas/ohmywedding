"use client"

import React from 'react'
import { NotesOldMoneyVariant, BaseNotesProps } from './notes-variants'
import { useCustomizeSafe } from '@/components/contexts/customize-context'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface NotesSectionProps extends BaseNotesProps {
  variant?: 'old-money'
}

export function NotesSection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  bodyText,
  showTitle = true,
  showSubtitle = true,
  showBodyText = true,
  sectionHeight = 'normal',
  variant = 'old-money',
  useColorBackground,
  backgroundColorChoice,
}: NotesSectionProps) {
  const customizeContext = useCustomizeSafe()
  const customConfig = customizeContext?.getSectionConfig('notes') || {}

  const effectiveTitle = customConfig.sectionTitle ?? sectionTitle
  const effectiveSubtitle = customConfig.sectionSubtitle ?? sectionSubtitle
  const effectiveBodyText = customConfig.bodyText ?? bodyText
  const effectiveShowTitle = customConfig.showTitle ?? showTitle
  const effectiveShowSubtitle = customConfig.showSubtitle ?? showSubtitle
  const effectiveShowBodyText = customConfig.showBodyText ?? showBodyText
  const effectiveSectionHeight = customConfig.sectionHeight ?? sectionHeight
  const effectiveUseColorBackground = customConfig.useColorBackground ?? useColorBackground
  const effectiveBackgroundColorChoice = customConfig.backgroundColorChoice ?? backgroundColorChoice

  const commonProps: BaseNotesProps = {
    theme,
    alignment,
    sectionTitle: effectiveTitle,
    sectionSubtitle: effectiveSubtitle,
    bodyText: effectiveBodyText,
    showTitle: effectiveShowTitle,
    showSubtitle: effectiveShowSubtitle,
    showBodyText: effectiveShowBodyText,
    sectionHeight: effectiveSectionHeight,
    useColorBackground: effectiveUseColorBackground,
    backgroundColorChoice: effectiveBackgroundColorChoice,
  }

  const onEditClick = (_sectionId: string, sectionType: string) => {
    customizeContext?.openCustomizer('notes', sectionType, {
      variant: customConfig.variant || variant,
      sectionTitle: effectiveTitle || '',
      sectionSubtitle: effectiveSubtitle || '',
      bodyText: effectiveBodyText || '',
      showTitle: effectiveShowTitle,
      showSubtitle: effectiveShowSubtitle,
      showBodyText: effectiveShowBodyText,
      sectionHeight: effectiveSectionHeight,
      useColorBackground: effectiveUseColorBackground ?? false,
      backgroundColorChoice: effectiveBackgroundColorChoice || 'none',
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="notes"
      sectionType="notes"
      onEditClick={onEditClick}
    >
      <NotesOldMoneyVariant {...commonProps} />
    </EditableSectionWrapper>
  )
}

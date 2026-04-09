"use client"

import React from 'react'
import {
  DressCodeHaciendaVariant,
  BaseDressCodeProps
} from './dress-code-variants'
import {
  useSectionVariants,
  createVariantConfig,
  VariantOption
} from './base-section'
import { EditableSectionWrapper } from '@/components/ui/editable-section-wrapper'

interface DressCodeSectionProps extends BaseDressCodeProps {
  variant?: 'hacienda'
  showVariantSwitcher?: boolean
}

export function DressCodeSection({
  theme,
  alignment,
  sectionTitle,
  sectionSubtitle,
  dressCodeType,
  description,
  images,
  useColorBackground,
  backgroundColorChoice,
  variant = 'hacienda',
  showVariantSwitcher = true,
}: DressCodeSectionProps) {
  const {
    activeVariant,
    customConfig,
    handleEditClick,
  } = useSectionVariants('dressCode', 'dress-code', 'hacienda', variant, showVariantSwitcher)

  const config = createVariantConfig(customConfig, {
    sectionTitle,
    sectionSubtitle,
    dressCodeType,
    description,
    images,
    useColorBackground: useColorBackground ?? false,
    backgroundColorChoice: backgroundColorChoice || 'none',
  })

  const commonProps: BaseDressCodeProps = {
    theme,
    alignment,
    sectionTitle: config.sectionTitle || sectionTitle,
    sectionSubtitle: config.sectionSubtitle || sectionSubtitle,
    dressCodeType: config.dressCodeType || dressCodeType,
    description: config.description || description,
    images: config.images || images,
    useColorBackground: config.useColorBackground ?? false,
    backgroundColorChoice: config.backgroundColorChoice || 'none',
  }

  const renderContent = () => {
    switch (activeVariant) {
      case 'hacienda':
      default:
        return <DressCodeHaciendaVariant {...commonProps} />
    }
  }

  const onEditClick = (sectionId: string, sectionType: string) => {
    handleEditClick(sectionType, {
      sectionTitle: config.sectionTitle || '',
      sectionSubtitle: config.sectionSubtitle || '',
      dressCodeType: config.dressCodeType || '',
      description: config.description || '',
      images: config.images || [],
      useColorBackground: config.useColorBackground ?? false,
      backgroundColorChoice: config.backgroundColorChoice || 'none',
    })
  }

  return (
    <EditableSectionWrapper
      sectionId="dress-code"
      sectionType="dress-code"
      onEditClick={onEditClick}
    >
      {renderContent()}
    </EditableSectionWrapper>
  )
}

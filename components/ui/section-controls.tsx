"use client"

import React from 'react'
import { Pencil } from 'lucide-react'
import { DeleteSectionButton } from './delete-section-button'
import { SectionReorderMenu } from './section-reorder-menu'
import { useI18n } from '@/components/contexts/i18n-context'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

interface SectionInfo {
  id: string
  type: string
  label: string
}

interface SectionControlsProps {
  componentId: string
  componentType: string
  canMoveUp: boolean
  canMoveDown: boolean
  allSections: SectionInfo[]
  currentIndex: number
  onDelete: (componentId: string) => void
  onMoveUp: (componentId: string) => void
  onMoveDown: (componentId: string) => void
  onMoveTo: (componentId: string, targetIndex: number) => void
  onEdit: (componentId: string, componentType: string) => void
}

export function SectionControls({
  componentId,
  componentType,
  canMoveUp,
  canMoveDown,
  allSections,
  currentIndex,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onEdit
}: SectionControlsProps) {
  const { t } = useI18n()
  const editingContext = useEditingModeSafe()
  
  // Only show in editing mode
  if (!editingContext?.isEditingMode) return null
  
  return (
    <div className="absolute top-16 sm:top-4 right-2 z-30 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
      <button
        onClick={() => onEdit(componentId, componentType)}
        className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        title={t('editing.edit')}
      >
        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{t('editing.edit')}</span>
      </button>

      <SectionReorderMenu
        componentId={componentId}
        componentType={componentType}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        allSections={allSections}
        currentIndex={currentIndex}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onMoveTo={onMoveTo}
      />
      <DeleteSectionButton 
        componentId={componentId}
        componentType={componentType}
        onDelete={onDelete}
      />
    </div>
  )
}

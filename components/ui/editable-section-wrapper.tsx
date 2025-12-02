"use client"

import React, { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useI18n } from '@/components/contexts/i18n-context'

interface EditableSectionWrapperProps {
  children: ReactNode
  sectionId: string
  sectionType: string
  onEditClick: (sectionId: string, sectionType: string) => void
  className?: string
}

export function EditableSectionWrapper({ 
  children, 
  sectionId, 
  sectionType, 
  onEditClick,
  className = '' 
}: EditableSectionWrapperProps) {
  const editingContext = useEditingModeSafe()
  const { t } = useI18n()
  const isEditingMode = editingContext?.isEditingMode ?? false

  return (
    <div className={`relative group ${className}`}>
      {/* Edit Button - only visible in editing mode, always visible on mobile, positioned lower on mobile to avoid top bar */}
      {isEditingMode && (
        <button
          onClick={() => onEditClick(sectionId, sectionType)}
          className="absolute top-16 sm:top-4 right-2 sm:right-[110px] z-30 flex items-center gap-1 sm:gap-2 h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title={t('editing.edit')}
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">{t('editing.edit')}</span>
        </button>
      )}
      
      {/* Section content */}
      {children}
      
      {/* Editing mode overlay indicator */}
      {isEditingMode && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg pointer-events-none transition-colors duration-200" />
      )}
    </div>
  )
}
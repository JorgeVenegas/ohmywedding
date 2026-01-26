"use client"

import React, { ReactNode } from 'react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'

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
  const isEditingMode = editingContext?.isEditingMode ?? false

  return (
    <div className={`relative ${className}`}>
      {/* Section content */}
      {children}
      
      {/* Editing mode overlay indicator */}
      {isEditingMode && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg pointer-events-none transition-colors duration-200" />
      )}
    </div>
  )
}
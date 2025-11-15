"use client"

import React, { ReactNode } from 'react'
import { Settings } from 'lucide-react'
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
    <div className={`relative group ${className}`}>
      {/* Edit Button - only visible in editing mode */}
      {isEditingMode && (
        <button
          onClick={() => onEditClick(sectionId, sectionType)}
          className="absolute top-4 left-4 z-10 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
          title={`Customize ${sectionType} section`}
        >
          <Settings className="w-4 h-4" />
        </button>
      )}
      
      {/* Section content */}
      {children}
      
      {/* Editing mode overlay indicator */}
      {isEditingMode && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-lg pointer-events-none transition-colors duration-200" />
      )}
    </div>
  )
}
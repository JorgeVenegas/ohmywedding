"use client"

import React, { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
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
          className="absolute top-4 right-[110px] z-40 flex items-center gap-2 h-9 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 opacity-0 group-hover:opacity-100"
          title={`Customize ${sectionType} section`}
        >
          <Pencil className="w-4 h-4" />
          <span className="text-sm font-medium">Edit</span>
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
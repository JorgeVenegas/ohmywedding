"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { SectionSelectorModal } from './section-selector-modal'

interface AddSectionButtonProps {
  position: number // Position where the section should be inserted
  onAddSection: (position: number, sectionType: string) => void
  enabledComponents?: string[]
}

export function AddSectionButton({ position, onAddSection, enabledComponents = [] }: AddSectionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const editingContext = useEditingModeSafe()
  const isEditingMode = editingContext?.isEditingMode ?? false

  // Don't render if not in editing mode
  if (!isEditingMode) return null

  const handleSelectSection = (sectionType: string) => {
    onAddSection(position, sectionType)
  }

  return (
    <>
      <div className="flex justify-center py-6 group">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 opacity-60 group-hover:opacity-100 hover:scale-105"
          title="Add a new section here"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Section</span>
        </button>
      </div>
      
      <SectionSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectSection={handleSelectSection}
        position={position}
        enabledComponents={enabledComponents}
      />
    </>
  )
}
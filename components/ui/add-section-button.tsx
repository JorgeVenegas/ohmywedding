"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { SectionSelectorModal } from './section-selector-modal'

interface AddSectionButtonProps {
  position: number // Position where the section should be inserted
  onAddSection: (position: number, sectionType: string) => void
  enabledComponents?: string[]
  hasWeddingDate?: boolean
}

export function AddSectionButton({ position, onAddSection, enabledComponents = [], hasWeddingDate = false }: AddSectionButtonProps) {
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 h-9 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105"
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
        hasWeddingDate={hasWeddingDate}
      />
    </>
  )
}
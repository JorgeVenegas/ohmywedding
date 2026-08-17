"use client"

"use client"

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { SectionSelectorModal } from './section-selector-modal'
import type { SubPage } from '@/lib/page-config'

interface AddSectionButtonProps {
  position: number
  onAddSection: (position: number, sectionType: string) => void
  onAddSubPage?: (subPage: SubPage) => void
  enabledComponents?: string[]
  enabledSubPageTypes?: string[]
  hasWeddingDate?: boolean
  isSubPageEditor?: boolean
}

export function AddSectionButton({
  position,
  onAddSection,
  onAddSubPage,
  enabledComponents = [],
  enabledSubPageTypes = [],
  hasWeddingDate = false,
  isSubPageEditor = false,
}: AddSectionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const editingContext = useEditingModeSafe()
  const isEditingMode = editingContext?.isEditingMode ?? false

  if (!isEditingMode) return null

  return (
    <>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
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
        onSelectSection={(sectionType) => onAddSection(position, sectionType)}
        onAddSubPage={onAddSubPage}
        position={position}
        enabledComponents={enabledComponents}
        enabledSubPageTypes={enabledSubPageTypes}
        hasWeddingDate={hasWeddingDate}
        isSubPageEditor={isSubPageEditor}
      />
    </>
  )
}
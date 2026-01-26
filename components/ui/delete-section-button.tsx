"use client"

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useI18n } from '@/components/contexts/i18n-context'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

interface DeleteSectionButtonProps {
  componentId: string
  componentType: string
  onDelete: (componentId: string) => void
}

export function DeleteSectionButton({ 
  componentId, 
  componentType, 
  onDelete 
}: DeleteSectionButtonProps) {
  const editingContext = useEditingModeSafe()
  const { t } = useI18n()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Only show in editing mode
  if (!editingContext?.isEditingMode) return null

  const handleDeleteClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = () => {
    onDelete(componentId)
    setShowConfirmDialog(false)
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
  }

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="flex items-center justify-center gap-1 sm:gap-2 min-w-[2rem] sm:min-w-[2.25rem] h-8 sm:h-9 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        title={t('common.delete')}
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{t('common.delete')}</span>
      </button>
      
      <ConfirmDeleteDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        componentType={componentType}
      />
    </>
  )
}
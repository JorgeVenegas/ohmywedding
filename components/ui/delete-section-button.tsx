"use client"

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
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
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDeleteClick}
          className="
            flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 
            text-white text-xs rounded-md shadow-lg
            transition-colors duration-200
          "
          title={`Delete ${componentType} section`}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
      
      <ConfirmDeleteDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        componentType={componentType}
      />
    </>
  )
}
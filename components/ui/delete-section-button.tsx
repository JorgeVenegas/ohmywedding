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
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDeleteClick}
          className="flex items-center gap-2 h-9 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg transition-all duration-200"
          title={`Delete ${componentType} section`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Delete</span>
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
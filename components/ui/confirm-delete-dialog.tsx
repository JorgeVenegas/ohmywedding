"use client"

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from '@/components/contexts/i18n-context'

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  componentType: string
}

export function ConfirmDeleteDialog({
  isOpen,
  onConfirm,
  onCancel,
  componentType
}: ConfirmDeleteDialogProps) {
  const { t } = useI18n()
  const [isClosing, setIsClosing] = React.useState(false)

  // Handle Escape key to close and lock body scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsClosing(false)
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onCancel()
    }, 200)
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'}`}
      onClick={handleClose}
    >
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${isClosing ? 'animate-out fade-out zoom-out-95 duration-200' : 'animate-in fade-in zoom-in-95 duration-300'}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('common.deleteConfirmTitle')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {componentType === 'collaborator' 
              ? t('common.deleteCollaboratorMessage')
              : t('common.deleteConfirmMessage')}
          </p>
          <p className="text-sm text-gray-500">
            {componentType === 'collaborator'
              ? t('common.deleteCollaboratorWarning')
              : t('common.deleteConfirmWarning')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {componentType === 'collaborator'
              ? t('common.remove')
              : t('common.deleteSection')}
          </Button>
        </div>
      </div>
    </div>
  )
}
"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Check, AlertCircle, Loader2, X } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'

interface SaveConfigButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function SaveConfigButton({ className, variant = 'default', size = 'default' }: SaveConfigButtonProps) {
  const { saveConfiguration, discardChanges, isSaving, hasUnsavedChanges } = usePageConfig()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSave = async () => {
    try {
      const result = await saveConfiguration()
      
      if (result.success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const getButtonContent = () => {
    if (isSaving) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium ml-2">Saving...</span>
        </>
      )
    }

    if (saveStatus === 'success') {
      return (
        <>
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium ml-2">Saved!</span>
        </>
      )
    }

    if (saveStatus === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium ml-2">Error</span>
        </>
      )
    }

    return (
      <>
        <Save className="w-4 h-4" />
        <span className="text-sm font-medium ml-2">{'Save'}</span>
      </>
    )
  }

  const getButtonVariant = () => {
    if (saveStatus === 'success') return 'default'
    if (saveStatus === 'error') return 'outline'
    if (hasUnsavedChanges) return 'default'
    return variant
  }

  const handleDiscard = () => {
    if (showConfirm) {
      discardChanges()
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {hasUnsavedChanges && (
        <Button
          onClick={handleDiscard}
          disabled={isSaving}
          variant={showConfirm ? 'destructive' : 'outline'}
          size={size}
          className={`h-9 px-3 py-2 gap-2`}
        >
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">{showConfirm ? 'Confirm?' : 'Discard'}</span>
        </Button>
      )}
      <Button
        onClick={handleSave}
        disabled={isSaving || !hasUnsavedChanges}
        variant={getButtonVariant()}
        size={size}
        className={`h-9 px-3 py-2 gap-2 ${className || ''}`}
      >
        {getButtonContent()}
      </Button>
    </div>
  )
}
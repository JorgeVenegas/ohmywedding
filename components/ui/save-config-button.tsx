"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'

interface SaveConfigButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function SaveConfigButton({ className, variant = 'default', size = 'default' }: SaveConfigButtonProps) {
  const { saveConfiguration, isSaving, hasUnsavedChanges } = usePageConfig()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

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
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      )
    }

    if (saveStatus === 'success') {
      return (
        <>
          <Check className="w-4 h-4 mr-2" />
          Saved!
        </>
      )
    }

    if (saveStatus === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          Error
        </>
      )
    }

    return (
      <>
        <Save className="w-4 h-4 mr-2" />
        {hasUnsavedChanges ? 'Save Changes' : 'Save Configuration'}
      </>
    )
  }

  const getButtonVariant = () => {
    if (saveStatus === 'success') return 'default'
    if (saveStatus === 'error') return 'outline'
    if (hasUnsavedChanges) return 'default'
    return variant
  }

  return (
    <Button
      onClick={handleSave}
      disabled={isSaving}
      variant={getButtonVariant()}
      size={size}
      className={className}
    >
      {getButtonContent()}
    </Button>
  )
}
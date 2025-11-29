"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useWeddingPermissions, type WeddingPermissions } from '@/hooks/use-auth'

interface EditingModeContextType {
  isEditingMode: boolean
  toggleEditingMode: () => void
  setEditingMode: (isEditing: boolean) => void
  permissions: WeddingPermissions
  permissionsLoading: boolean
  canEdit: boolean
}

const defaultPermissions: WeddingPermissions = {
  canEdit: false,
  canDelete: false,
  canManageCollaborators: false,
  isOwner: false,
  isCollaborator: false,
  role: 'guest',
  userId: null
}

const EditingModeContext = createContext<EditingModeContextType | undefined>(undefined)

interface EditingModeProviderProps {
  children: ReactNode
  initialEditingMode?: boolean
  weddingNameId?: string | null
}

export function EditingModeProvider({ 
  children, 
  initialEditingMode = false,
  weddingNameId = null
}: EditingModeProviderProps) {
  const [isEditingMode, setIsEditingMode] = useState<boolean>(initialEditingMode)
  const { 
    permissions, 
    loading: permissionsLoading 
  } = useWeddingPermissions(weddingNameId)

  // If user can't edit, force editing mode off
  useEffect(() => {
    if (!permissionsLoading && !permissions.canEdit && isEditingMode) {
      setIsEditingMode(false)
    }
  }, [permissions.canEdit, permissionsLoading, isEditingMode])

  const toggleEditingMode = () => {
    if (permissions.canEdit) {
      setIsEditingMode(prev => !prev)
    }
  }

  const setEditingMode = (isEditing: boolean) => {
    if (isEditing && !permissions.canEdit) {
      return // Don't allow editing if no permission
    }
    setIsEditingMode(isEditing)
  }

  return (
    <EditingModeContext.Provider 
      value={{ 
        isEditingMode, 
        toggleEditingMode, 
        setEditingMode,
        permissions,
        permissionsLoading,
        canEdit: permissions.canEdit
      }}
    >
      {children}
    </EditingModeContext.Provider>
  )
}

export function useEditingMode() {
  const context = useContext(EditingModeContext)
  if (context === undefined) {
    throw new Error('useEditingMode must be used within an EditingModeProvider')
  }
  return context
}

// Safe hook that doesn't throw if no provider (for server-side rendering)
export function useEditingModeSafe() {
  const context = useContext(EditingModeContext)
  return context // Returns undefined if no provider
}
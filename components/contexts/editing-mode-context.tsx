"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface EditingModeContextType {
  isEditingMode: boolean
  toggleEditingMode: () => void
  setEditingMode: (isEditing: boolean) => void
}

const EditingModeContext = createContext<EditingModeContextType | undefined>(undefined)

interface EditingModeProviderProps {
  children: ReactNode
  initialEditingMode?: boolean
}

export function EditingModeProvider({ 
  children, 
  initialEditingMode = false 
}: EditingModeProviderProps) {
  const [isEditingMode, setIsEditingMode] = useState<boolean>(initialEditingMode)

  const toggleEditingMode = () => {
    setIsEditingMode(prev => !prev)
  }

  const setEditingMode = (isEditing: boolean) => {
    setIsEditingMode(isEditing)
  }

  return (
    <EditingModeContext.Provider 
      value={{ 
        isEditingMode, 
        toggleEditingMode, 
        setEditingMode 
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
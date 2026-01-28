'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface EnvelopeContextValue {
  /** Whether the page has an envelope */
  hasEnvelope: boolean
  /** Whether the envelope has been opened */
  isOpened: boolean
  /** Mark the envelope as opened */
  markOpened: () => void
}

const EnvelopeContext = createContext<EnvelopeContextValue>({
  hasEnvelope: false,
  isOpened: true, // Default to true so animations play if no envelope
  markOpened: () => {},
})

export function EnvelopeProvider({
  children,
  hasEnvelope,
}: {
  children: React.ReactNode
  hasEnvelope: boolean
}) {
  const [isOpened, setIsOpened] = useState(!hasEnvelope) // If no envelope, consider it opened

  const markOpened = useCallback(() => {
    setIsOpened(true)
  }, [])

  return (
    <EnvelopeContext.Provider value={{ hasEnvelope, isOpened, markOpened }}>
      {children}
    </EnvelopeContext.Provider>
  )
}

export function useEnvelope() {
  return useContext(EnvelopeContext)
}

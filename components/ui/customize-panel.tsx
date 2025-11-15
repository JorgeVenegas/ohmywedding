"use client"

import React, { ReactNode } from 'react'
import { X, Settings } from 'lucide-react'

interface CustomizePanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
}

export function CustomizePanel({ 
  isOpen, 
  onClose, 
  title, 
  icon = <Settings className="w-5 h-5" />, 
  children 
}: CustomizePanelProps) {
  return (
    <>
      {/* Side Panel */}
      <div className={`
        fixed top-0 right-0 h-full bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-96 border-l border-gray-200
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
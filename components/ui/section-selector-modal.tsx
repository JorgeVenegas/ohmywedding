"use client"

import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface SectionType {
  id: string
  name: string
  description: string
  icon: string
}

const AVAILABLE_SECTIONS: SectionType[] = [
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Main banner with names, date, and call-to-action',
    icon: '🏠'
  },
  {
    id: 'our-story',
    name: 'Our Story',
    description: 'Share your love story and journey together',
    icon: '💕'
  },
  {
    id: 'countdown',
    name: 'Countdown Timer',
    description: 'Display time remaining until the wedding',
    icon: '⏰'
  },
  {
    id: 'event-details',
    name: 'Event Details',
    description: 'Ceremony and reception information',
    icon: '📍'
  },
  {
    id: 'gallery',
    name: 'Photo Gallery',
    description: 'Showcase your favorite photos together',
    icon: '📸'
  },
  {
    id: 'rsvp',
    name: 'RSVP',
    description: 'Allow guests to respond to your invitation',
    icon: '📝'
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Answer common questions from guests',
    icon: '❓'
  }
]

interface SectionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSection: (sectionType: string) => void
  position: number
  enabledComponents?: string[]
  hasWeddingDate?: boolean
}

export function SectionSelectorModal({ 
  isOpen, 
  onClose, 
  onSelectSection, 
  position,
  enabledComponents = [],
  hasWeddingDate = false
}: SectionSelectorModalProps) {
  if (!isOpen) return null

  // Date-dependent sections that require a wedding date
  const dateDependentSections = ['countdown']

  // Filter out already enabled sections and date-dependent sections if no date
  const availableSections = AVAILABLE_SECTIONS.filter(section => {
    // Skip if already enabled
    if (enabledComponents.includes(section.id)) return false
    
    // Skip date-dependent sections if no wedding date is set
    if (!hasWeddingDate && dateDependentSections.includes(section.id)) return false
    
    return true
  })

  const handleSelectSection = (sectionId: string) => {
    onSelectSection(sectionId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">Position {position + 1}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          {/* Section List */}
          <div className="p-3 overflow-y-auto max-h-[50vh]">
            {availableSections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">All available sections have been added.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className="w-full p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-700 text-sm">
                        {section.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>          {/* Footer */}
          <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
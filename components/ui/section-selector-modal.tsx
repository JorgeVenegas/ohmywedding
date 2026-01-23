"use client"

import React from 'react'
import { X, Crown, Heart, Clock, MapPin, Image, Mail, HelpCircle, Gift } from 'lucide-react'
import { Button } from './button'

// Gold color for elegant icons
const GOLD_COLOR = '#B8860B'

interface SectionType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const AVAILABLE_SECTIONS: SectionType[] = [
  {
    id: 'hero',
    name: 'Main Banner',
    description: 'Main banner with names, date, and call-to-action',
    icon: <Crown className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Full-width banner image with optional text overlay',
    icon: <Image className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'our-story',
    name: 'Our Story',
    description: 'Share your love story and journey together',
    icon: <Heart className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'countdown',
    name: 'Countdown Timer',
    description: 'Display time remaining until the wedding',
    icon: <Clock className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'event-details',
    name: 'Event Details',
    description: 'Ceremony and reception information',
    icon: <MapPin className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'gallery',
    name: 'Photo Gallery',
    description: 'Showcase your favorite photos together',
    icon: <Image className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'rsvp',
    name: 'RSVP',
    description: 'Allow guests to respond to your invitation',
    icon: <Mail className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Answer common questions from guests',
    icon: <HelpCircle className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
  },
  {
    id: 'registry',
    name: 'Gift Registry',
    description: 'Share your wedding registry links',
    icon: <Gift className="w-5 h-5" style={{ color: GOLD_COLOR }} strokeWidth={1.5} />
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
  const [isClosing, setIsClosing] = React.useState(false)

  // Lock body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsClosing(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }

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
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'}`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-out fade-out zoom-out-95 duration-200' : 'animate-in fade-in zoom-in-95 duration-300'}`} onClick={handleClose}>
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">Position {position + 1}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
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
                {availableSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 text-left group animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-amber-50/80 group-hover:bg-amber-100/80 transition-colors duration-200">
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-amber-900 text-sm transition-colors duration-200">
                        {section.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}
          </div>
          {/* Footer */}
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
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ArrowDown, ArrowUp, MoreVertical } from 'lucide-react'
import { Button } from './button'
import { useEditingModeSafe } from '@/components/contexts/editing-mode-context'
import { useI18n } from '@/components/contexts/i18n-context'

interface SectionInfo {
  id: string
  type: string
  label: string
}

interface SectionReorderMenuProps {
  componentId: string
  componentType: string
  canMoveUp: boolean
  canMoveDown: boolean
  allSections: SectionInfo[]
  currentIndex: number
  onMoveUp: (componentId: string) => void
  onMoveDown: (componentId: string) => void
  onMoveTo: (componentId: string, targetIndex: number) => void
}

export function SectionReorderMenu({
  componentId,
  componentType,
  canMoveUp,
  canMoveDown,
  allSections,
  currentIndex,
  onMoveUp,
  onMoveDown,
  onMoveTo
}: SectionReorderMenuProps) {
  const editingContext = useEditingModeSafe()
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [showMoveToSubmenu, setShowMoveToSubmenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowMoveToSubmenu(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Only show in editing mode
  if (!editingContext?.isEditingMode) return null
  
  // Hero section is always first and cannot be moved
  const isHero = componentType === 'hero' || componentType.startsWith('hero-')
  if (isHero) return null

  const handleMoveUp = () => {
    // Add visual animation class
    const sectionElement = document.querySelector(`[data-section-id="${componentId}"]`) as HTMLElement
    if (sectionElement) {
      sectionElement.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      sectionElement.style.transform = 'translateY(-10px)'
      sectionElement.style.opacity = '0.5'
      
      setTimeout(() => {
        sectionElement.style.transform = 'translateY(0)'
        sectionElement.style.opacity = '1'
      }, 100)
    }
    
    onMoveUp(componentId)
    setIsOpen(false)
  }

  const handleMoveDown = () => {
    // Add visual animation class
    const sectionElement = document.querySelector(`[data-section-id="${componentId}"]`) as HTMLElement
    if (sectionElement) {
      sectionElement.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      sectionElement.style.transform = 'translateY(10px)'
      sectionElement.style.opacity = '0.5'
      
      setTimeout(() => {
        sectionElement.style.transform = 'translateY(0)'
        sectionElement.style.opacity = '1'
      }, 100)
    }
    
    onMoveDown(componentId)
    setIsOpen(false)
  }

  const handleMoveTo = (targetIndex: number) => {
    // Add visual animation class
    const sectionElement = document.querySelector(`[data-section-id="${componentId}"]`) as HTMLElement
    if (sectionElement) {
      const isMovingUp = targetIndex < currentIndex
      sectionElement.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      sectionElement.style.transform = isMovingUp ? 'translateY(-10px)' : 'translateY(10px)'
      sectionElement.style.opacity = '0.5'
      
      setTimeout(() => {
        sectionElement.style.transform = 'translateY(0)'
        sectionElement.style.opacity = '1'
      }, 100)
    }
    
    onMoveTo(componentId, targetIndex)
    setIsOpen(false)
    setShowMoveToSubmenu(false)
  }

  const hasAnyAction = canMoveUp || canMoveDown

  if (!hasAnyAction) return null

  // Get section label for display
  const getSectionLabel = (type: string) => {
    const baseType = type.replace(/-\d+$/, '')
    switch (baseType) {
      case 'hero': return t('nav.home')
      case 'our-story': return t('nav.ourStory')
      case 'event-details': return t('nav.eventDetails')
      case 'countdown': return t('countdown.title')
      case 'gallery': return t('nav.gallery')
      case 'rsvp': return t('nav.rsvp')
      case 'faq': return t('nav.faq')
      case 'registry': return t('registry.title')
      case 'banner': return t('banner.title')
      default: return baseType
    }
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="gap-1 sm:gap-2"
        title={t('common.move')}
      >
        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{t('common.move')}</span>
      </Button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 right-0 z-50 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-lg shadow-xl min-w-[200px] overflow-hidden origin-top-right"
          >
            <motion.button
              onClick={handleMoveUp}
              disabled={!canMoveUp}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent text-gray-700 hover:text-primary disabled:text-gray-400 transition-colors duration-200"
              title={canMoveUp ? t('editing.moveUp') : t('editing.moveUpDisabled')}
            >
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('editing.moveUp')}</span>
            </motion.button>
            <div className="border-t border-primary/10" />
            <motion.button
              onClick={handleMoveDown}
              disabled={!canMoveDown}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent text-gray-700 hover:text-primary disabled:text-gray-400 transition-colors duration-200"
              title={canMoveDown ? t('editing.moveDown') : t('editing.moveDownDisabled')}
            >
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('editing.moveDown')}</span>
            </motion.button>
          
          {/* Move to specific position submenu */}
          {allSections.length > 2 && (
            <>
              <div className="border-t border-primary/10" />
              <div className="relative">
                <motion.button
                  onClick={() => setShowMoveToSubmenu(!showMoveToSubmenu)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: 0.15 }}
                  className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm hover:bg-white/60 text-gray-700 hover:text-primary transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{t('editing.moveTo')}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showMoveToSubmenu ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </motion.button>
                
                {/* Submenu with sections */}
                <AnimatePresence>
                  {showMoveToSubmenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="max-h-[200px] overflow-y-auto bg-white/60 backdrop-blur-sm"
                    >
                      {allSections.map((section, idx) => {
                        if (idx === currentIndex) return null // Skip current section
                        
                        // Don't allow moving before hero (index 0)
                        if (idx === 0) return null
                        
                        const label = getSectionLabel(section.type)
                        const position = idx < currentIndex ? t('editing.moveBefore') : t('editing.moveAfter')
                        const itemIndex = allSections.filter((_, i) => {
                          if (i === currentIndex) return false
                          if (i === 0) return false
                          return i < allSections.indexOf(section)
                        }).length
                        
                        return (
                          <motion.button
                            key={section.id}
                            onClick={() => handleMoveTo(idx < currentIndex ? idx : idx)}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: 0.05 + itemIndex * 0.03 }}
                            className="w-full flex items-center gap-2 px-6 sm:px-8 py-2 text-xs sm:text-sm hover:bg-white/60 text-gray-600 hover:text-primary transition-colors duration-200 text-left"
                          >
                            {idx < currentIndex ? (
                              <ArrowUp className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <ArrowDown className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="truncate">
                              {position} <strong>{label}</strong>
                            </span>
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  )
}

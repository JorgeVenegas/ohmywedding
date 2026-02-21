"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import Image from "next/image"
import {
  Circle,
  RectangleHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize,
  Wand2,
  Printer,
  Save,
  Loader2,
  ChevronDown,
  Plus,
  Heart,
  Undo2,
  Redo2,
  CheckCircle2,
  MoreHorizontal,
  RotateCcw,
  Music2,
  Mic2,
  DoorOpen,
  Wine,
  Headphones,
  Armchair,
  Sofa,
  MapPin,
  PenLine,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const VENUE_ELEMENT_ICONS: Record<string, LucideIcon> = {
  dance_floor: Music2,
  stage: Mic2,
  entrance: DoorOpen,
  bar: Wine,
  dj_booth: Headphones,
  periquera: Armchair,
  lounge: Sofa,
  area: MapPin,
  custom: PenLine,
}
import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import type { VenueElementType, VenueElementShape } from "../types"
import { VENUE_ELEMENT_LABELS, LOUNGE_SHAPE_LABELS } from "../types"

interface SeatingToolbarProps {
  onAddRoundTable: () => void
  onAddRectTable: () => void
  onAddSweetheart: () => void
  onAddVenueElement: (type: VenueElementType, options?: { shape?: VenueElementShape; label?: string; capacity?: number }) => Promise<unknown>
  onAutoAssign: () => void
  onPrint: () => void
  onSave: () => void
  onDiscard: () => void
  saving: boolean
  hasUnsavedChanges: boolean
  lastSavedAt: Date | null
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onUndo: () => void
  canUndo: boolean
  onRedo: () => void
  canRedo: boolean
}

export function SeatingToolbar({
  onAddRoundTable,
  onAddRectTable,
  onAddSweetheart,
  onAddVenueElement,
  onAutoAssign,
  onPrint,
  onSave,
  onDiscard,
  saving,
  hasUnsavedChanges,
  lastSavedAt,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
}: SeatingToolbarProps) {
  const { t } = useTranslation()
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [customLabelInput, setCustomLabelInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [addDropdownPos, setAddDropdownPos] = useState({ bottom: 0, left: 0 })
  const [actionsMenuPos, setActionsMenuPos] = useState({ bottom: 0, right: 0 })
  const addDropdownRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const addPortalRef = useRef<HTMLDivElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const actionsButtonRef = useRef<HTMLButtonElement>(null)
  const actionsPortalRef = useRef<HTMLDivElement>(null)
  const discardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleAddElement = useCallback((type: VenueElementType, shape: VenueElementShape = 'rect', label?: string, capacity?: number) => {
    onAddVenueElement(type, { shape, label, capacity })
    setShowAddDropdown(false)
    setShowCustomInput(false)
    setCustomLabelInput('')
  }, [onAddVenueElement])

  // Format last saved time
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  function formatSavedAgo(date: Date | null): string | null {
    if (!date) return null
    const secs = Math.floor((Date.now() - date.getTime()) / 1000)
    if (secs < 10) return 'Just saved'
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  // Auto-cancel discard confirmation after 4s
  const handleDiscardClick = () => {
    if (confirmDiscard) {
      if (discardTimerRef.current) clearTimeout(discardTimerRef.current)
      setConfirmDiscard(false)
      onDiscard()
    } else {
      setConfirmDiscard(true)
      discardTimerRef.current = setTimeout(() => setConfirmDiscard(false), 4000)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node
      const insideAdd = addDropdownRef.current?.contains(t) || addPortalRef.current?.contains(t)
      if (!insideAdd) setShowAddDropdown(false)
      const insideActions = actionsMenuRef.current?.contains(t) || actionsPortalRef.current?.contains(t)
      if (!insideActions) setShowActionsMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const savedAgoText = formatSavedAgo(lastSavedAt)

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* OMW Logo */}
      <div className="flex items-center gap-1.5 pl-1 pr-2 flex-shrink-0">
        <Image
          src="/images/logos/OMW Logo Gold.png"
          alt="OhMyWedding"
          width={18}
          height={18}
          className="h-[18px] w-auto flex-shrink-0 opacity-90"
        />
        <span className="text-[11px] font-serif text-gray-500 hidden xl:inline tracking-wide whitespace-nowrap">OhMyWedding</span>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Undo / Redo */}
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}
        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 disabled:opacity-30" title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}
        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 disabled:opacity-30" title="Redo (Ctrl+Y)">
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Add Items Dropdown */}
      <div className="relative" ref={addDropdownRef}>
        <Button
          ref={addButtonRef}
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-xs shadow-sm px-2.5"
          onClick={() => {
            if (addButtonRef.current) {
              const rect = addButtonRef.current.getBoundingClientRect()
              setAddDropdownPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left })
            }
            setShowAddDropdown(v => !v)
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </Button>
        {mounted && showAddDropdown && createPortal(
          <div
            ref={addPortalRef}
            className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-52 animate-in fade-in slide-in-from-bottom-1 duration-150"
            style={{ position: 'fixed', bottom: addDropdownPos.bottom, left: addDropdownPos.left, zIndex: 9999 }}
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tables</p>
            {[
              { icon: <Circle className="w-3.5 h-3.5 text-indigo-500" />, bg: 'bg-indigo-50', label: t('admin.seating.toolbar.addRoundTable'), action: onAddRoundTable },
              { icon: <RectangleHorizontal className="w-3.5 h-3.5 text-violet-500" />, bg: 'bg-violet-50', label: t('admin.seating.toolbar.addRectTable'), action: onAddRectTable },
              { icon: <Heart className="w-3.5 h-3.5 text-rose-500" />, bg: 'bg-rose-50', label: 'Sweetheart Table', action: onAddSweetheart },
            ].map(({ icon, bg, label, action }) => (
              <button key={label} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-sm transition-colors"
                onClick={() => { action(); setShowAddDropdown(false) }}>
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                <span className="text-gray-700">{label}</span>
              </button>
            ))}
            <div className="h-px bg-gray-100 my-1" />
            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Venue</p>
            {(Object.keys(VENUE_ELEMENT_LABELS) as VenueElementType[]).map((type) => {
              const info = VENUE_ELEMENT_LABELS[type]
              const isCustom = type === 'custom'
              const isLounge = type === 'lounge'
              const isPeriquera = type === 'periquera'
              // These types can be circular (non-lounge, non-periquera)
              const showCirclePicker = ['dance_floor', 'stage', 'dj_booth', 'custom'].includes(type)
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {(() => { const Icon = VENUE_ELEMENT_ICONS[type]; return Icon ? <Icon className="w-3.5 h-3.5 text-gray-500" /> : null })()}
                    </div>
                    <button className="flex-1 text-left text-sm text-gray-700"
                      onClick={() => {
                        if (isCustom) { setShowCustomInput(true); return }
                        if (isLounge) { handleAddElement(type, 'sofa_u'); return }
                        handleAddElement(type, 'rect')
                      }}>
                      {info.en}
                    </button>
                    {isLounge && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(Object.entries(LOUNGE_SHAPE_LABELS) as [VenueElementShape, { en: string; icon: string }][]).map(([shape, sInfo]) => (
                          <button
                            key={shape}
                            className="px-1 h-6 rounded flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 text-[11px] font-bold transition-colors"
                            title={sInfo.en}
                            onClick={() => handleAddElement(type, shape)}
                          >{sInfo.icon}</button>
                        ))}
                      </div>
                    )}
                    {isPeriquera && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {[4, 6, 8].map(n => (
                          <button
                            key={n}
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-bold transition-colors"
                            title={`${n} stools`}
                            onClick={() => handleAddElement(type, 'rect', undefined, n)}
                          >{n}</button>
                        ))}
                      </div>
                    )}
                    {showCirclePicker && !isCustom && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 text-[10px] font-bold transition-colors"
                          title="Add as rectangle"
                          onClick={() => handleAddElement(type, 'rect')}
                        >□</button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 text-[10px] font-bold transition-colors"
                          title="Add as circle"
                          onClick={() => handleAddElement(type, 'circle')}
                        >○</button>
                      </div>
                    )}
                  </div>
                  {isCustom && showCustomInput && (
                    <div className="px-3 pb-2 pt-1">
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          className="flex-1 text-xs px-2 py-1.5 rounded-md border border-gray-200 focus:border-indigo-400 focus:outline-none"
                          placeholder="Section name…"
                          value={customLabelInput}
                          onChange={e => setCustomLabelInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddElement('custom', 'rect', customLabelInput || 'Custom')
                            if (e.key === 'Escape') { setShowCustomInput(false); setCustomLabelInput('') }
                          }}
                        />
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 text-[10px] font-bold"
                          title="Add as rectangle"
                          onClick={() => handleAddElement('custom', 'rect', customLabelInput || 'Custom')}
                        >□</button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 text-[10px] font-bold"
                          title="Add as circle"
                          onClick={() => handleAddElement('custom', 'circle', customLabelInput || 'Custom')}
                        >○</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>,
          document.body
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
        <Button variant="ghost" size="sm" onClick={onZoomOut} className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-md">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[11px] text-gray-500 w-9 text-center tabular-nums font-medium select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={onZoomIn} className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-md">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onFitToScreen} className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-md" title={t('admin.seating.toolbar.fitToScreen')}>
          <Maximize className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Actions: visible inline on xl+, collapsed in menu on smaller */}
      <div className="hidden xl:flex items-center gap-0.5">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2.5" onClick={onAutoAssign}>
          <Wand2 className="w-3.5 h-3.5" />
          <span>{t('admin.seating.toolbar.autoAssign')}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2.5" onClick={onPrint}>
          <Printer className="w-3.5 h-3.5" />
          <span>{t('admin.seating.toolbar.printExport')}</span>
        </Button>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
      </div>

      {/* Collapsed actions menu for smaller screens */}
      <div className="xl:hidden relative" ref={actionsMenuRef}>
        <Button ref={actionsButtonRef} variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
          onClick={() => {
            if (actionsButtonRef.current) {
              const rect = actionsButtonRef.current.getBoundingClientRect()
              setActionsMenuPos({ bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right })
            }
            setShowActionsMenu(v => !v)
          }} title="More actions">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        {mounted && showActionsMenu && createPortal(
          <div
            ref={actionsPortalRef}
            className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-44 animate-in fade-in slide-in-from-bottom-1 duration-150"
            style={{ position: 'fixed', bottom: actionsMenuPos.bottom, right: actionsMenuPos.right, zIndex: 9999 }}
          >
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-sm transition-colors"
              onClick={() => { onAutoAssign(); setShowActionsMenu(false) }}>
              <Wand2 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{t('admin.seating.toolbar.autoAssign')}</span>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-sm transition-colors"
              onClick={() => { onPrint(); setShowActionsMenu(false) }}>
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{t('admin.seating.toolbar.printExport')}</span>
            </button>
          </div>,
          document.body
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-1.5">
        {/* Status indicator */}
        {saving && (
          <Loader2 className="w-3.5 h-3.5 text-primary/70 animate-spin" />
        )}
        {!hasUnsavedChanges && !saving && savedAgoText && (
          <span className="text-[10px] text-gray-400 hidden xl:block whitespace-nowrap">{savedAgoText}</span>
        )}
        {!hasUnsavedChanges && !saving && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        )}
        {hasUnsavedChanges && !saving && (
          <span className="w-2 h-2 rounded-full bg-amber-400 block" />
        )}

        {/* Discard button — only visible when there are unsaved changes */}
        {hasUnsavedChanges && !saving && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscardClick}
            className={`h-8 px-2.5 text-xs font-medium rounded-lg transition-all ${
              confirmDiscard
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 animate-pulse'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
            title={confirmDiscard ? 'Click again to confirm discard' : 'Discard unsaved changes'}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            {confirmDiscard ? 'Confirm?' : 'Discard'}
          </Button>
        )}

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className="h-8 px-3.5 text-xs font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t('admin.seating.toolbar.saving')}</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1.5" />{t('admin.seating.toolbar.save')}</>
          )}
        </Button>
      </div>
    </div>
  )
}


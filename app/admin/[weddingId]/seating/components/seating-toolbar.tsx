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
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { VenueElementType } from "../types"
import { VENUE_ELEMENT_LABELS } from "../types"

interface SeatingToolbarProps {
  onAddRoundTable: () => void
  onAddRectTable: () => void
  onAddSweetheart: () => void
  onAddVenueElement: (type: VenueElementType) => Promise<unknown>
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
  const addDropdownRef = useRef<HTMLDivElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const discardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false)
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const savedAgoText = formatSavedAgo(lastSavedAt)

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
      {/* OMW Logo */}
      <div className="flex items-center gap-1.5 pl-1.5 pr-3">
        <Image
          src="/images/logos/OMW Logo Gold.png"
          alt="OhMyWedding"
          width={18}
          height={18}
          className="h-[18px] w-auto flex-shrink-0 opacity-90"
        />
        <span className="text-[11px] font-serif text-gray-500 hidden md:inline tracking-wide">OhMyWedding</span>
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
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-xs shadow-sm px-2.5"
          onClick={() => setShowAddDropdown(!showAddDropdown)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </Button>
        {showAddDropdown && (
          <div className="absolute bottom-full left-0 mb-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-52 animate-in fade-in slide-in-from-bottom-1 duration-150">
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
              const label = VENUE_ELEMENT_LABELS[type]
              return (
                <button key={type} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-sm transition-colors"
                  onClick={() => { onAddVenueElement(type); setShowAddDropdown(false) }}>
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-sm">{label.icon}</div>
                  <span className="text-gray-700">{label.en}</span>
                </button>
              )
            })}
          </div>
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
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
          onClick={() => setShowActionsMenu(!showActionsMenu)} title="More actions">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        {showActionsMenu && (
          <div className="absolute bottom-full right-0 mb-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-44 animate-in fade-in slide-in-from-bottom-1 duration-150">
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
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-1.5">
        {/* Status indicator */}
        {saving && (
          <Loader2 className="w-3.5 h-3.5 text-primary/70 animate-spin" />
        )}
        {!hasUnsavedChanges && !saving && savedAgoText && (
          <span className="text-[10px] text-gray-400 hidden sm:block whitespace-nowrap">{savedAgoText}</span>
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
            <>{t('admin.seating.toolbar.saving')}</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1.5" />{t('admin.seating.toolbar.save')}</>
          )}
        </Button>
      </div>
    </div>
  )
}


"use client"

import { Button } from "@/components/ui/button"
import { X, Copy, FlipHorizontal, FlipVertical } from "lucide-react"
import type { TableWithAssignments } from "../types"

type AlignType =
  | "left" | "center-h" | "right"
  | "top" | "center-v" | "bottom"
  | "distribute-h" | "distribute-v"

interface MultiTablePanelProps {
  tables: TableWithAssignments[]
  selectedTableIds: string[]
  onAlign: (type: AlignType) => void
  onDuplicate: () => void
  onMirrorDuplicate: (axis: 'h' | 'v') => void
  onClose: () => void
}

const ALIGN_BUTTONS: { type: AlignType; icon: string; label: string }[] = [
  { type: "left",        icon: "⬛⬜⬜", label: "Align left" },
  { type: "center-h",   icon: "⬜⬛⬜", label: "Center horizontally" },
  { type: "right",      icon: "⬜⬜⬛", label: "Align right" },
  { type: "top",        icon: "⬛⬜⬜", label: "Align top" },
  { type: "center-v",   icon: "⬜⬛⬜", label: "Center vertically" },
  { type: "bottom",     icon: "⬜⬜⬛", label: "Align bottom" },
]

// SVG icons for alignment actions (similar to Figma/Illustrator)
function AlignIcon({ type }: { type: AlignType }) {
  const s = "stroke-current"
  switch (type) {
    case "left":        return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="2" x2="2" y2="14" className={s} strokeWidth="1.5"/><rect x="4" y="4" width="8" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="4" y="9" width="5" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "center-h":    return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="8" y1="2" x2="8" y2="14" className={s} strokeWidth="1.5"/><rect x="2" y="4" width="8" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="3.5" y="9" width="5" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "right":       return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="14" y1="2" x2="14" y2="14" className={s} strokeWidth="1.5"/><rect x="4" y="4" width="8" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="7" y="9" width="5" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "top":         return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="2" x2="14" y2="2" className={s} strokeWidth="1.5"/><rect x="3" y="4" width="4" height="8" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="9" y="4" width="4" height="5" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "center-v":    return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="8" x2="14" y2="8" className={s} strokeWidth="1.5"/><rect x="3" y="2" width="4" height="8" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="9" y="4" width="4" height="5" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "bottom":      return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="14" x2="14" y2="14" className={s} strokeWidth="1.5"/><rect x="3" y="4" width="4" height="8" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="9" y="7" width="4" height="5" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "distribute-h":return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="2" x2="2" y2="14" className={s} strokeWidth="1.5"/><line x1="14" y1="2" x2="14" y2="14" className={s} strokeWidth="1.5"/><rect x="5" y="5" width="3" height="6" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="8" y="5" width="3" height="6" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
    case "distribute-v":return <svg viewBox="0 0 16 16" className="w-4 h-4"><line x1="2" y1="2" x2="14" y2="2" className={s} strokeWidth="1.5"/><line x1="2" y1="14" x2="14" y2="14" className={s} strokeWidth="1.5"/><rect x="5" y="5" width="6" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/><rect x="5" y="8" width="6" height="3" rx="0.5" className={s} fill="none" strokeWidth="1.2"/></svg>
  }
}

export function MultiTablePanel({ tables, selectedTableIds, onAlign, onDuplicate, onMirrorDuplicate, onClose }: MultiTablePanelProps) {
  const count = selectedTableIds.length
  const canDistribute = count >= 3

  const alignBtn = (type: AlignType, label: string, disabled = false) => (
    <button
      key={type}
      title={label}
      disabled={disabled}
      onClick={() => onAlign(type)}
      className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <AlignIcon type={type} />
      <span className="text-[9px] text-gray-400 leading-none whitespace-nowrap">{label.replace("Align ", "").replace("Center ", "Ctr ").replace("horizontally", "horiz.").replace("vertically", "vert.")}</span>
    </button>
  )

  return (
    <div className="w-72 h-full bg-white flex flex-col rounded-2xl shadow-xl border border-gray-100/80 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Selection</p>
          <h3 className="font-semibold text-sm text-gray-900">{count} tables selected</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Duplicate / Mirror */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-2">Duplicate</p>
          <div className="flex gap-1">
            <button
              title="Duplicate selection"
              onClick={onDuplicate}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span className="text-[9px] text-gray-400">Copy</span>
            </button>
            <button
              title="Mirror duplicate horizontally"
              onClick={() => onMirrorDuplicate('h')}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-[9px] text-gray-400">Mirror ↔</span>
            </button>
            <button
              title="Mirror duplicate vertically"
              onClick={() => onMirrorDuplicate('v')}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FlipVertical className="w-4 h-4" />
              <span className="text-[9px] text-gray-400">Mirror ↕</span>
            </button>
          </div>
        </div>

        {/* Align */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-2">Align</p>
          <div className="grid grid-cols-3 gap-0.5">
            {alignBtn("left",     "Align left")}
            {alignBtn("center-h", "Center horizontally")}
            {alignBtn("right",    "Align right")}
            {alignBtn("top",      "Align top")}
            {alignBtn("center-v", "Center vertically")}
            {alignBtn("bottom",   "Align bottom")}
          </div>
        </div>

        {/* Distribute — only when 3+ selected */}
        <div>
          <p className={`text-[11px] font-medium mb-2 ${canDistribute ? "text-gray-500" : "text-gray-300"}`}>
            Distribute {!canDistribute && <span className="text-[10px] font-normal">(select 3+)</span>}
          </p>
          <div className="grid grid-cols-2 gap-0.5">
            {alignBtn("distribute-h", "Distribute horizontally", !canDistribute)}
            {alignBtn("distribute-v", "Distribute vertically",   !canDistribute)}
          </div>
        </div>

        {/* Tip */}
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Shift-click to add/remove tables. Drag on empty canvas to lasso-select. Hold Space to pan.
        </p>
      </div>
    </div>
  )
}

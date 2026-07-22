"use client"

import { useEffect } from "react"
import { AlertTriangle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  if (!open) return null

  const iconBg = variant === "danger" ? "bg-red-100" : "bg-amber-100"
  const iconColor = variant === "danger" ? "text-red-600" : "text-amber-600"
  const confirmBg = variant === "danger"
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-600 hover:bg-amber-700 text-white"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !loading && onOpenChange(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-[#420c14]/15 max-w-md w-full animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-serif text-[#420c14]">{title}</h2>
              <p className="text-sm text-[#420c14]/60 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            onClick={() => !loading && onOpenChange(false)}
            className="text-[#420c14]/30 hover:text-[#420c14] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-[#420c14]/15 text-[#420c14]/70 hover:bg-[#420c14]/5"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={`flex-1 ${confirmBg}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

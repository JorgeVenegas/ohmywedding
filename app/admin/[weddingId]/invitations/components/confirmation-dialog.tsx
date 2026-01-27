"use client"

import { Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  confirmVariant: 'default' | 'destructive'
  onConfirm: () => void
}

interface ConfirmationDialogProps {
  dialog: ConfirmDialogState
  onClose: () => void
}

export function ConfirmationDialog({
  dialog,
  onClose,
}: ConfirmationDialogProps) {
  if (!dialog.isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dialog.confirmVariant === 'destructive' ? 'bg-red-100' : 'bg-primary/10'
              }`}>
              {dialog.confirmVariant === 'destructive' ? (
                <Trash2 className="w-5 h-5 text-red-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{dialog.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{dialog.message}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant={dialog.confirmVariant === 'destructive' ? 'destructive' : 'default'}
              className={`flex-1 ${dialog.confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={dialog.onConfirm}
            >
              {dialog.confirmLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

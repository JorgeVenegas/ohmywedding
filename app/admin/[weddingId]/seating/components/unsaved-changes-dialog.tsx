"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/contexts/i18n-context"
import { AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-base text-gray-900 mb-1">
                {t('admin.seating.unsavedDialog.title')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('admin.seating.unsavedDialog.message')}
              </p>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2">
              <Button
                onClick={onSave}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {t('admin.seating.unsavedDialog.save')}
              </Button>
              <Button
                variant="outline"
                onClick={onDiscard}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {t('admin.seating.unsavedDialog.discard')}
              </Button>
              <Button
                variant="ghost"
                onClick={onCancel}
                className="w-full"
              >
                {t('admin.seating.unsavedDialog.cancel')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

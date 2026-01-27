"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, X } from "lucide-react"

interface NotificationToastProps {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  message: string
  onClose: () => void
}

export function NotificationToast({
  isOpen,
  type,
  title,
  message,
  onClose,
}: NotificationToastProps) {
  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className={`p-4 shadow-lg border ${type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
            {type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
              {title}
            </h4>
            <p className={`text-sm mt-0.5 ${type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  )
}

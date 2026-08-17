"use client"

import React from 'react'
import { X, Link2, Copy } from 'lucide-react'
import { Button } from './button'

interface ShareOrCopyDialogProps {
  isOpen: boolean
  onClose: () => void
  sectionName: string
  /** Called when the user chooses to share by reference (both pages update together) */
  onShare: () => void
  /** Called when the user chooses to copy by value (independent copies) */
  onCopy: () => void
}

export function ShareOrCopyDialog({
  isOpen,
  onClose,
  sectionName,
  onShare,
  onCopy,
}: ShareOrCopyDialogProps) {
  const [isClosing, setIsClosing] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsClosing(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 200)
  }

  const handleShare = () => { onShare(); handleClose() }
  const handleCopy = () => { onCopy(); handleClose() }

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'}`}
        onClick={handleClose}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-out fade-out zoom-out-95 duration-200' : 'animate-in fade-in zoom-in-95 duration-300'}`}
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add {sectionName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                This section already exists on another page
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Options */}
          <div className="p-4 space-y-3">
            <button
              onClick={handleShare}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-amber-50/80 group-hover:bg-amber-100/80 transition-colors mt-0.5">
                  <Link2 className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-amber-900 transition-colors">
                    Share
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Both pages reference the same section. Editing one updates the other.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleCopy}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50/80 group-hover:bg-blue-100/80 transition-colors mt-0.5">
                  <Copy className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-900 transition-colors">
                    Copy
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Create an independent copy. Changes on one page won't affect the other.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
            <Button onClick={handleClose} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

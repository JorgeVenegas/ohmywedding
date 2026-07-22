"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Link2 } from "lucide-react"
import { useI18n } from "@/components/contexts/i18n-context"

interface UpdateWeddingNameIdProps {
  currentWeddingNameId: string
}

export function UpdateWeddingNameId({ currentWeddingNameId }: UpdateWeddingNameIdProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [newNameId, setNewNameId] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    if (!newNameId.trim()) {
      setError(t('admin.settings.weddingUrl.errors.enterNewId'))
      return
    }

    if (newNameId === currentWeddingNameId) {
      setError(t('admin.settings.weddingUrl.errors.mustBeDifferent'))
      return
    }

    setIsUpdating(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(`/api/weddings/${encodeURIComponent(currentWeddingNameId)}/update-name-id`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newWeddingNameId: newNameId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('admin.settings.weddingUrl.errors.failed'))
        setIsUpdating(false)
        return
      }

      setSuccess(true)

      const newUrl = `/${encodeURIComponent(newNameId)}`

      setTimeout(() => {
        router.push(newUrl)
        router.refresh()
      }, 1500)

    } catch (err) {
      setError(t('admin.settings.weddingUrl.errors.unexpected'))
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">{t('admin.settings.weddingUrl.title')}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('admin.settings.weddingUrl.currentUrl')}</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {currentWeddingNameId}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('admin.settings.weddingUrl.newUrl')}</label>
          <Input
            value={newNameId}
            onChange={(e) => setNewNameId(e.target.value)}
            placeholder={t('admin.settings.weddingUrl.placeholder')}
            disabled={isUpdating || success}
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {t('admin.settings.weddingUrl.hint')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t('admin.settings.weddingUrl.updatedMessage')}</span>
          </div>
        )}

        <Button
          onClick={handleUpdate}
          disabled={isUpdating || success || !newNameId.trim()}
          size="sm"
          className="w-full"
        >
          {isUpdating
            ? t('admin.settings.weddingUrl.updatingButton')
            : success
            ? t('admin.settings.weddingUrl.updatedButton')
            : t('admin.settings.weddingUrl.updateButton')}
        </Button>

        <p className="text-xs text-gray-500">
          {t('admin.settings.weddingUrl.note')}
        </p>
      </div>
    </div>
  )
}

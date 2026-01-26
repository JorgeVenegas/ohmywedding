"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, Link2 } from "lucide-react"

interface UpdateWeddingNameIdProps {
  currentWeddingNameId: string
}

export function UpdateWeddingNameId({ currentWeddingNameId }: UpdateWeddingNameIdProps) {
  const router = useRouter()
  const [newNameId, setNewNameId] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    if (!newNameId.trim()) {
      setError("Please enter a new wedding name ID")
      return
    }

    if (newNameId === currentWeddingNameId) {
      setError("New ID must be different from current ID")
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
        setError(data.error || "Failed to update wedding name ID")
        setIsUpdating(false)
        return
      }

      setSuccess(true)
      
      // Redirect to the new wedding page
      const newUrl = `/${encodeURIComponent(newNameId)}`
      
      setTimeout(() => {
        router.push(newUrl)
        router.refresh()
      }, 1500)

    } catch (err) {
      setError("An unexpected error occurred")
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">Wedding URL</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Current URL</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {currentWeddingNameId}
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-2">New URL</label>
          <Input
            value={newNameId}
            onChange={(e) => setNewNameId(e.target.value)}
            placeholder="e.g., john&jane"
            disabled={isUpdating || success}
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Choose a unique identifier for your wedding page
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
            <span>Updated! Redirecting...</span>
          </div>
        )}

        <Button
          onClick={handleUpdate}
          disabled={isUpdating || success || !newNameId.trim()}
          size="sm"
          className="w-full"
        >
          {isUpdating ? "Updating..." : success ? "Updated!" : "Update URL"}
        </Button>
        
        <p className="text-xs text-gray-500">
          Note: You'll need to update any shared links after changing the URL
        </p>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Save, CheckCircle2 } from "lucide-react"
import { Header } from "@/components/header"

interface DetailsPageProps {
  params: Promise<{ weddingId: string }>
}

export default function DetailsPage({ params }: DetailsPageProps) {
  const { weddingId } = use(params)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    partner1: "Jorge",
    partner2: "Yuliana",
    date: "2025-03-25",
    time: "16:00",
    story: "Jorge and Yuliana met in college...",
    primaryColor: "#a86b8f",
    secondaryColor: "#8b9d6f",
    accentColor: "#e8a76a",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    // TODO: Submit to API
    setTimeout(() => {
      setIsSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header showBackButton backHref={`/admin/${weddingId}/dashboard`} title="Wedding Details" />

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {saved && (
          <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
            <p className="text-sm font-medium text-secondary">Changes saved successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Couple Info */}
          <Card className="p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Couple Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Partner 1 Name</label>
                <Input
                  name="partner1"
                  value={formData.partner1}
                  onChange={handleInputChange}
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Partner 2 Name</label>
                <Input
                  name="partner2"
                  value={formData.partner2}
                  onChange={handleInputChange}
                  className="border-border"
                />
              </div>
            </div>
          </Card>

          {/* Wedding Date & Time */}
          <Card className="p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Wedding Date & Time</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Date</label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Time</label>
                <Input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="border-border"
                />
              </div>
            </div>
          </Card>

          {/* Story */}
          <Card className="p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Your Story</h2>
            <Textarea
              name="story"
              value={formData.story}
              onChange={handleInputChange}
              className="border-border min-h-40 resize-none"
              placeholder="Share your love story..."
            />
          </Card>

          {/* Colors */}
          <Card className="p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Wedding Colors</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">Primary Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleColorChange}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hex Code</p>
                    <p className="text-sm font-mono text-foreground">{formData.primaryColor}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">Secondary Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleColorChange}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-secondary transition-colors"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hex Code</p>
                    <p className="text-sm font-mono text-foreground">{formData.secondaryColor}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">Accent Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleColorChange}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-accent transition-colors"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hex Code</p>
                    <p className="text-sm font-mono text-foreground">{formData.accentColor}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

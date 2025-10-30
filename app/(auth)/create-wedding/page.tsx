"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { Heart } from "lucide-react"

export default function CreateWeddingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    partner1FirstName: "",
    partner1LastName: "",
    partner2FirstName: "",
    partner2LastName: "",
    weddingDate: "",
    weddingTime: "",
    story: "",
    primaryColor: "#a86b8f",
    secondaryColor: "#8b9d6f",
    accentColor: "#e8a76a",
    venue1Name: "",
    venue1Address: "",
    venue2Name: "",
    venue2Address: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'applicatiofn/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create wedding website')
      }

      const result = await response.json()
      
      // Redirect to the newly created wedding page
      window.location.href = `/${result.dateId}/${result.weddingNameId}`
    } catch (error) {
      console.error('Error creating wedding:', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(
          formData.partner1FirstName.trim() &&
          formData.partner1LastName.trim() &&
          formData.partner2FirstName.trim() &&
          formData.partner2LastName.trim() &&
          formData.weddingDate &&
          formData.weddingTime
        )
      case 2:
        return formData.story.trim().length > 0
      case 3:
        return true // Venues are optional
      case 4:
        return true // Review step
      default:
        return false
    }
  }

  const canProceedToNextStep = validateStep(step)

  const steps = [
    { number: 1, title: "About You" },
    { number: 2, title: "Your Story" },
    { number: 3, title: "Venues" },
    { number: 4, title: "Review" },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Header
        showBackButton
        backHref="/"
        title="Create Your Wedding"
        rightContent={<div className="text-right text-sm font-medium text-primary">Step {step} of 4</div>}
      />

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-8 max-w-sm w-full mx-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Heart className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <h3 className="font-serif text-xl text-foreground">Creating Your Wedding Website</h3>
                <p className="text-muted-foreground">Please wait while we set up your beautiful website...</p>
              </div>
            </Card>
          </div>
        )}
        <div className="mb-12">
          <div className="flex justify-between mb-8">
            {steps.map((s) => {
              const isActive = s.number === step
              const isCompleted = s.number < step
              return (
                <div key={s.number} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.number}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Couple Info */}
          {step === 1 && (
            <div className="animate-in fade-in duration-300">
              <Card className="p-8 sm:p-10 border border-border shadow-sm">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Tell Us About You</h2>
                  <p className="text-muted-foreground">Let's start with the most important details</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      Partner Names
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                        <Input
                          name="partner1FirstName"
                          value={formData.partner1FirstName}
                          onChange={handleInputChange}
                          placeholder="e.g., Jorge"
                          className="border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                        <Input
                          name="partner1LastName"
                          value={formData.partner1LastName}
                          onChange={handleInputChange}
                          placeholder="e.g., Vasquez"
                          className="border-border"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      Partner Names
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                        <Input
                          name="partner2FirstName"
                          value={formData.partner2FirstName}
                          onChange={handleInputChange}
                          placeholder="e.g., Yuliana"
                          className="border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                        <Input
                          name="partner2LastName"
                          value={formData.partner2LastName}
                          onChange={handleInputChange}
                          placeholder="e.g., Chavez"
                          className="border-border"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      Wedding Date & Time
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                        <Input
                          name="weddingDate"
                          type="date"
                          value={formData.weddingDate}
                          onChange={handleInputChange}
                          className="border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                        <Input
                          name="weddingTime"
                          type="time"
                          value={formData.weddingTime}
                          onChange={handleInputChange}
                          className="border-border"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Story & Colors */}
          {step === 2 && (
            <div className="animate-in fade-in duration-300">
              <Card className="p-8 sm:p-10 border border-border shadow-sm">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Your Story & Colors</h2>
                  <p className="text-muted-foreground">Share your love story and choose your wedding colors</p>
                </div>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span>💕</span>
                      Your Love Story
                    </h3>
                    <Textarea
                      name="story"
                      value={formData.story}
                      onChange={handleInputChange}
                      placeholder="Share your story with your guests... How did you meet? What makes your love special?"
                      className="border-border min-h-40 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">{formData.story.length}/500 characters</p>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                      <span>🎨</span>
                      Choose Your Colors
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            name="primaryColor"
                            value={formData.primaryColor}
                            onChange={handleColorChange}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">Hex Code</p>
                            <p className="text-sm font-mono text-foreground">{formData.primaryColor}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground">Secondary Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            name="secondaryColor"
                            value={formData.secondaryColor}
                            onChange={handleColorChange}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-secondary transition-colors"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">Hex Code</p>
                            <p className="text-sm font-mono text-foreground">{formData.secondaryColor}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground">Accent Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            name="accentColor"
                            value={formData.accentColor}
                            onChange={handleColorChange}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-accent transition-colors"
                          />
                          <div>
                            <p className="text-xs text-muted-foreground">Hex Code</p>
                            <p className="text-sm font-mono text-foreground">{formData.accentColor}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Venues */}
          {step === 3 && (
            <div className="animate-in fade-in duration-300">
              <Card className="p-8 sm:p-10 border border-border shadow-sm">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Wedding Venues</h2>
                  <p className="text-muted-foreground">Add your ceremony and reception locations</p>
                </div>
                <div className="space-y-8">
                  <div className="bg-muted/30 p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span>📍</span>
                      Ceremony Venue
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Venue Name</label>
                        <Input
                          name="venue1Name"
                          value={formData.venue1Name}
                          onChange={handleInputChange}
                          placeholder="e.g., The Grand Ballroom"
                          className="border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                        <Input
                          name="venue1Address"
                          value={formData.venue1Address}
                          onChange={handleInputChange}
                          placeholder="e.g., 123 Main St, City, State"
                          className="border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span>📍</span>
                      Reception Venue
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Venue Name</label>
                        <Input
                          name="venue2Name"
                          value={formData.venue2Name}
                          onChange={handleInputChange}
                          placeholder="e.g., The Grand Ballroom"
                          className="border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                        <Input
                          name="venue2Address"
                          value={formData.venue2Address}
                          onChange={handleInputChange}
                          placeholder="e.g., 123 Main St, City, State"
                          className="border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-in fade-in duration-300">
              <Card className="p-8 sm:p-10 border border-border shadow-sm">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Review Your Information</h2>
                  <p className="text-muted-foreground">Make sure everything looks perfect before creating</p>
                </div>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">COUPLE NAMES</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formData.partner1FirstName} {formData.partner1LastName}
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        & {formData.partner2FirstName} {formData.partner2LastName}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">WEDDING DATE</p>
                      <p className="text-lg font-semibold text-foreground">{formData.weddingDate}</p>
                      <p className="text-sm text-muted-foreground">{formData.weddingTime}</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR STORY</p>
                    <p className="text-foreground leading-relaxed">{formData.story || "No story added yet"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-4">YOUR COLORS</p>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: formData.primaryColor }}
                        />
                        <p className="text-xs text-muted-foreground">Primary</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: formData.secondaryColor }}
                        />
                        <p className="text-xs text-muted-foreground">Secondary</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: formData.accentColor }}
                        />
                        <p className="text-xs text-muted-foreground">Accent</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      ✓ Everything looks great! Click the button below to create your wedding website.
                    </p>
                  </div>

                  {submitError && (
                    <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                      <p className="text-sm text-destructive">
                        ❌ {submitError}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="border-border"
            >
              Previous
            </Button>
            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(Math.min(4, step + 1))}
                disabled={!canProceedToNextStep}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Your Website..." : "Create Wedding Website"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

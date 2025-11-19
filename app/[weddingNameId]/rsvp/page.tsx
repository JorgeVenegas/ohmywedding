"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2 } from "lucide-react"
import { WeddingFooter } from "@/components/wedding-footer"

interface RSVPPageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default async function RSVPPage({ params }: RSVPPageProps) {
  const { dateId, weddingNameId } = await params
  
  return <RSVPPageClient dateId={dateId} weddingNameId={weddingNameId} />
}

function RSVPPageClient({ dateId, weddingNameId }: { dateId: string; weddingNameId: string }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    attending: "yes",
    companions: "0",
    dietaryRestrictions: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateId,
          weddingNameId,
          name: formData.name,
          email: formData.email,
          attending: formData.attending,
          companions: parseInt(formData.companions),
          dietaryRestrictions: formData.dietaryRestrictions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit RSVP')
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      // TODO: Show error message to user
    }
  }

  return (
    <main className="min-h-screen bg-background">

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!submitted ? (
          <Card className="p-8 sm:p-10 border border-border shadow-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">We'd Love to Have You!</h1>
              <p className="text-muted-foreground">Please let us know if you can make it to our wedding.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Your Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="border-border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email Address *</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="border-border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Will you be attending? *</label>
                <select
                  name="attending"
                  value={formData.attending}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground font-medium"
                >
                  <option value="yes">Yes, I'll be there!</option>
                  <option value="no">No, I can't make it</option>
                  <option value="maybe">Maybe, I'll let you know</option>
                </select>
              </div>

              {formData.attending === "yes" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Number of Companions</label>
                    <select
                      name="companions"
                      value={formData.companions}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground font-medium"
                    >
                      <option value="0">Just me</option>
                      <option value="1">1 companion</option>
                      <option value="2">2 companions</option>
                      <option value="3">3 companions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Dietary Restrictions</label>
                    <textarea
                      name="dietaryRestrictions"
                      value={formData.dietaryRestrictions}
                      onChange={handleInputChange}
                      placeholder="Let us know about any dietary restrictions or allergies"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-24 font-medium"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Submit RSVP
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-8 sm:p-10 border border-border shadow-sm text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-8">We've received your RSVP. We can't wait to celebrate with you!</p>
            <Link href={`/${weddingNameId}`}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Back to Wedding</Button>
            </Link>
          </Card>
        )}
      </div>
      <WeddingFooter />
    </main>
  )
}
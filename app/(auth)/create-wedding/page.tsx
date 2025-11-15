"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Header } from "@/components/header"
import { Heart, ChevronDown, ChevronRight, Settings, Calendar, Users, Camera, MessageSquare, HelpCircle, MapPin } from "lucide-react"

// Define available components with their props
interface ComponentSection {
  id: string
  name: string
  icon: React.ComponentType<any>
  description: string
  enabled: boolean
  expanded: boolean
  props: Record<string, any>
}

export default function CreateWeddingPage() {
  const [formData, setFormData] = useState({
    partner1FirstName: "",
    partner1LastName: "",
    partner2FirstName: "",
    partner2LastName: "",
    weddingDate: "",
    weddingTime: "",
    hasExistingWedding: false,
    primaryColor: "#a86b8f",
    secondaryColor: "#8b9d6f",
    accentColor: "#e8a76a",
  })

  const [componentSections, setComponentSections] = useState<ComponentSection[]>([
    {
      id: 'hero',
      name: 'Hero Section',
      icon: Heart,
      description: 'Welcome message with names, date, and tagline',
      enabled: true,
      expanded: false,
      props: {
        showTagline: true,
        tagline: "Join us as we tie the knot!",
        showCountdown: true,
        showRSVPButton: true,
        heroImageUrl: ""
      }
    },
    {
      id: 'our-story',
      name: 'Our Story',
      icon: MessageSquare,
      description: 'Share your love story and journey together',
      enabled: false,
      expanded: false,
      props: {
        showHowWeMet: true,
        showProposal: true,
        howWeMetText: "",
        proposalText: ""
      }
    },
    {
      id: 'countdown',
      name: 'Countdown Timer',
      icon: Calendar,
      description: 'Live countdown to your wedding day',
      enabled: false,
      expanded: false,
      props: {
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: false,
        message: 'Until we say "I do"'
      }
    },
    {
      id: 'event-details',
      name: 'Event Details',
      icon: MapPin,
      description: 'Ceremony and reception venue information',
      enabled: false,
      expanded: false,
      props: {
        showCeremony: true,
        showReception: true,
        showDressCode: true,
        ceremonyVenue: "",
        ceremonyAddress: "",
        ceremonyTime: "",
        receptionVenue: "",
        receptionAddress: "",
        receptionTime: "",
        dressCode: ""
      }
    },
    {
      id: 'gallery',
      name: 'Photo Gallery',
      icon: Camera,
      description: 'Display engagement photos and memories',
      enabled: false,
      expanded: false,
      props: {
        showEngagementPhotos: true,
        showVideoSupport: false,
        maxDisplayPhotos: 6,
        showViewAllButton: true,
        showDemoPhotos: true
      }
    },
    {
      id: 'rsvp',
      name: 'RSVP',
      icon: Users,
      description: 'Guest response and attendance tracking',
      enabled: false,
      expanded: false,
      props: {
        embedForm: true,
        showMealPreferences: false,
        showCustomQuestions: false
      }
    },
    {
      id: 'faq',
      name: 'FAQ',
      icon: HelpCircle,
      description: 'Frequently asked questions for guests',
      enabled: false,
      expanded: false,
      props: {
        questions: []
      }
    }
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleComponent = (id: string) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { 
              ...section, 
              enabled: !section.enabled, 
              expanded: !section.enabled ? true : section.expanded 
            }
          : section
      )
    )
  }

  const toggleExpanded = (id: string) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { ...section, expanded: !section.expanded }
          : section
      )
    )
  }

  const updateComponentProp = (sectionId: string, propName: string, value: any) => {
    setComponentSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, props: { ...section.props, [propName]: value } }
          : section
      )
    )
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare the data including enabled components
      const enabledComponents = componentSections
        .filter(section => section.enabled)
        .map(section => ({
          id: section.id,
          type: section.id,
          enabled: true,
          order: componentSections.findIndex(s => s.id === section.id),
          props: section.props
        }))

      const weddingData = {
        ...formData,
        components: enabledComponents
      }

      const response = await fetch('/api/weddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weddingData),
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

  const validateBasicInfo = (): boolean => {
    return !!(
      formData.partner1FirstName.trim() &&
      formData.partner1LastName.trim() &&
      formData.partner2FirstName.trim() &&
      formData.partner2LastName.trim() &&
      formData.weddingDate
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Header
        showBackButton
        backHref="/"
        title="Create Your Wedding"
        rightContent={<div className="text-right text-sm font-medium text-primary">One Page Setup</div>}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Wedding Information */}
          <Card className="p-8 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Wedding Information</h2>
              <p className="text-muted-foreground">Let's start with the basic details about your special day</p>
            </div>
            
            <div className="space-y-8">
              {/* Partner 1 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Partner 1
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
                      placeholder="e.g., Venegas"
                      className="border-border"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Partner 2 */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-secondary" />
                  Partner 2
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

              {/* Wedding Details */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Wedding Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Switch
                      id="hasExistingWedding"
                      checked={formData.hasExistingWedding}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasExistingWedding: checked }))}
                    />
                    <label htmlFor="hasExistingWedding" className="text-sm font-medium text-foreground">
                      I already have a wedding date planned
                    </label>
                  </div>
                  
                  {formData.hasExistingWedding && (
                    <div className="grid md:grid-cols-2 gap-4 ml-7">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Wedding Date</label>
                        <Input
                          name="weddingDate"
                          type="date"
                          value={formData.weddingDate}
                          onChange={handleInputChange}
                          className="border-border"
                          required={formData.hasExistingWedding}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Wedding Time (Optional)</label>
                        <Input
                          name="weddingTime"
                          type="time"
                          value={formData.weddingTime}
                          onChange={handleInputChange}
                          className="border-border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wedding Colors */}
              <div className="border-t border-border pt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Wedding Colors
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleColorChange}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
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
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border hover:border-secondary transition-colors"
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
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border hover:border-accent transition-colors"
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

          {/* Component Sections */}
          <Card className="p-8 border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Page Components</h2>
              <p className="text-muted-foreground">Choose which sections to include in your wedding website</p>
            </div>

            <div className="space-y-4">
              {componentSections.map((section, index) => {
                const IconComponent = section.icon
                return (
                  <div 
                    key={section.id} 
                    className="border border-border rounded-lg overflow-hidden transform transition-all duration-300 ease-in-out hover:shadow-md animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Component Header */}
                    <div className={`flex items-center justify-between p-4 transition-all duration-200 ease-in-out ${
                      section.expanded ? 'bg-muted/50' : 'bg-muted/30'
                    } ${section.enabled ? 'hover:bg-muted/40' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={section.enabled}
                            onCheckedChange={() => toggleComponent(section.id)}
                          />
                          <IconComponent className={`w-5 h-5 transition-colors duration-200 ${
                            section.enabled ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <div className={`transition-all duration-200 ${
                            section.enabled ? 'transform scale-105' : ''
                          }`}>
                            <h3 className="font-semibold text-foreground">{section.name}</h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      {section.enabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(section.id)}
                          className="ml-2 transition-transform duration-200 hover:bg-muted/50"
                        >
                          <ChevronRight 
                            className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                              section.expanded ? 'rotate-90' : 'rotate-0'
                            }`} 
                          />
                        </Button>
                      )}
                    </div>

                    {/* Component Configuration */}
                    {section.enabled && (
                      <div 
                        className={`overflow-hidden border-t border-border bg-background transition-all duration-300 ease-in-out ${
                          section.expanded 
                            ? 'max-h-[800px] opacity-100' 
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="p-6">
                        {section.id === 'hero' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Tagline</label>
                              <Input
                                value={section.props.tagline || ""}
                                onChange={(e) => updateComponentProp(section.id, 'tagline', e.target.value)}
                                placeholder="Join us as we tie the knot!"
                                className="border-border"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Hero Image URL (Optional)</label>
                              <Input
                                value={section.props.heroImageUrl || ""}
                                onChange={(e) => updateComponentProp(section.id, 'heroImageUrl', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="border-border"
                              />
                            </div>
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showCountdown}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showCountdown', checked)}
                                />
                                <span className="text-sm">Show Countdown</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showRSVPButton}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showRSVPButton', checked)}
                                />
                                <span className="text-sm">Show RSVP Button</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {section.id === 'our-story' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">How We Met</label>
                              <Textarea
                                value={section.props.howWeMetText || ""}
                                onChange={(e) => updateComponentProp(section.id, 'howWeMetText', e.target.value)}
                                placeholder="Tell your love story... How did you meet?"
                                className="border-border min-h-24 resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Proposal Story</label>
                              <Textarea
                                value={section.props.proposalText || ""}
                                onChange={(e) => updateComponentProp(section.id, 'proposalText', e.target.value)}
                                placeholder="Tell about the proposal... How did it happen?"
                                className="border-border min-h-24 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {section.id === 'countdown' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Countdown Message</label>
                              <Input
                                value={section.props.message || ""}
                                onChange={(e) => updateComponentProp(section.id, 'message', e.target.value)}
                                placeholder='Until we say "I do"'
                                className="border-border"
                              />
                            </div>
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showDays}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showDays', checked)}
                                />
                                <span className="text-sm">Show Days</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showHours}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showHours', checked)}
                                />
                                <span className="text-sm">Show Hours</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showMinutes}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showMinutes', checked)}
                                />
                                <span className="text-sm">Show Minutes</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showSeconds}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showSeconds', checked)}
                                />
                                <span className="text-sm">Show Seconds</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {section.id === 'event-details' && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Ceremony Venue</label>
                                <Input
                                  value={section.props.ceremonyVenue || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'ceremonyVenue', e.target.value)}
                                  placeholder="e.g., St. Mary's Church"
                                  className="border-border"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Ceremony Address</label>
                                <Input
                                  value={section.props.ceremonyAddress || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'ceremonyAddress', e.target.value)}
                                  placeholder="e.g., 123 Main St, City, State"
                                  className="border-border"
                                />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Reception Venue</label>
                                <Input
                                  value={section.props.receptionVenue || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'receptionVenue', e.target.value)}
                                  placeholder="e.g., The Grand Ballroom"
                                  className="border-border"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Reception Address</label>
                                <Input
                                  value={section.props.receptionAddress || ""}
                                  onChange={(e) => updateComponentProp(section.id, 'receptionAddress', e.target.value)}
                                  placeholder="e.g., 456 Event Ave, City, State"
                                  className="border-border"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Dress Code</label>
                              <Input
                                value={section.props.dressCode || ""}
                                onChange={(e) => updateComponentProp(section.id, 'dressCode', e.target.value)}
                                placeholder="e.g., Black tie optional"
                                className="border-border"
                              />
                            </div>
                          </div>
                        )}

                        {section.id === 'gallery' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Maximum Photos to Display</label>
                              <Input
                                type="number"
                                value={section.props.maxDisplayPhotos || 6}
                                onChange={(e) => updateComponentProp(section.id, 'maxDisplayPhotos', parseInt(e.target.value) || 6)}
                                min="1"
                                max="20"
                                className="border-border"
                              />
                            </div>
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showEngagementPhotos}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showEngagementPhotos', checked)}
                                />
                                <span className="text-sm">Show Engagement Photos</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showVideoSupport}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showVideoSupport', checked)}
                                />
                                <span className="text-sm">Show Video Support</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showViewAllButton}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showViewAllButton', checked)}
                                />
                                <span className="text-sm">Show View All Button</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {section.id === 'rsvp' && (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.embedForm}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'embedForm', checked)}
                                />
                                <span className="text-sm">Show Full Form (vs CTA Button)</span>
                              </label>
                              <label className="flex items-center gap-3">
                                <Switch
                                  checked={section.props.showMealPreferences}
                                  onCheckedChange={(checked) => updateComponentProp(section.id, 'showMealPreferences', checked)}
                                />
                                <span className="text-sm">Show Meal Preferences</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {section.id === 'faq' && (
                          <div className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                              <HelpCircle className="w-12 h-12 mx-auto mb-4" />
                              <p>FAQ questions will be configured after website creation.</p>
                              <p className="text-sm">You can add common questions like parking, dress code, accommodations, etc.</p>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Summary & Submit */}
          <Card className="p-6 border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Create Your Website?</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>✓ {formData.partner1FirstName && formData.partner2FirstName ? `${formData.partner1FirstName} & ${formData.partner2FirstName}` : 'Names needed'}</span>
                {formData.hasExistingWedding && formData.weddingDate && (
                  <span>✓ Wedding: {formData.weddingDate}</span>
                )}
                <span>✓ {componentSections.filter(s => s.enabled).length} components enabled</span>
              </div>
            </div>

            {submitError && (
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-destructive">
                  ❌ {submitError}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none"
              disabled={isSubmitting || !validateBasicInfo()}
            >
              {isSubmitting ? (
                <>
                  <Heart className="w-5 h-5 mr-2 animate-pulse" />
                  Creating Your Wedding Website...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Create Wedding Website
                </>
              )}
            </Button>
          </Card>
        </form>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { PageConfigProvider, usePageConfig } from "@/components/contexts/page-config-context"
import { EditingModeProvider, useEditingModeSafe } from "@/components/contexts/editing-mode-context"
import { I18nProvider } from "@/components/contexts/i18n-context"
import { CustomizeProvider, useCustomize } from "@/components/contexts/customize-context"
import { SiteConfigProvider } from "@/components/contexts/site-config-context"
import { VariantProvider } from "@/components/contexts/variant-context"
import { ViewportProvider } from "@/components/contexts/viewport-context"
import { EditingTopBar } from "@/components/ui/editing-top-bar"
import { SectionCustomizer } from "@/components/ui/section-customizer"
import { SectionControls } from "@/components/ui/section-controls"
import { AddSectionButton } from "@/components/ui/add-section-button"
import { SectionSelectorModal } from "@/components/ui/section-selector-modal"
import { WeddingNav } from "@/components/ui/wedding-nav"
import { Plus } from "lucide-react"
import { resolveComponents } from "@/lib/resolve-component"
import { getWeddingByNameIdClient } from "@/lib/wedding-data-client"
import { getDefaultPropsForSection } from "@/lib/section-defaults"
import { getWeddingPath } from "@/lib/wedding-url"
import type { Wedding } from "@/lib/wedding-data"
import type { InlineComponent } from "@/lib/resolve-component"
import {
  GuestPhotosSection,
  OurStorySection,
  EventDetailsSection,
  GallerySection,
  FAQSection,
  CountdownSection,
  DressCodeSection,
  HotelSuggestionsSection,
  NotesSection,
  SpecialGuestsSection,
  HeroSection,
} from "@/components/wedding-sections"
import { BannerSection } from "@/components/wedding-sections/banner-section"

interface SubPageClientProps {
  weddingNameId: string
  pageSlug: string
}

type CommonProps = {
  wedding?: Wedding
  weddingNameId: string
  theme: any
  alignment: { text: "center" }
}

const MULTI_INSTANCE_TYPES = ['banner']

// mergedProps = component.props merged with config.sectionConfigs[type] — both must be reflected in UI
function renderSection(
  component: InlineComponent,
  common: CommonProps,
  mergedProps: Record<string, any>
) {
  const baseType = component.type.replace(/-\d+$/, "")
  const props = { ...common, ...mergedProps }

  switch (baseType) {
    case "hero":
      if (!common.wedding) return null
      return (
        <HeroSection
          key={component.id}
          {...common}
          wedding={common.wedding}
          dateId={common.wedding.date_id}
          {...mergedProps}
        />
      )
    case "guest-photos":
      return (
        <GuestPhotosSection
          key={component.id}
          weddingNameId={common.weddingNameId}
          theme={common.theme}
          title={mergedProps?.title}
          subtitle={mergedProps?.subtitle}
          uploaderPlaceholder={mergedProps?.uploaderPlaceholder}
          variant={mergedProps?.variant}
          useColorBackground={mergedProps?.useColorBackground}
          backgroundColorChoice={mergedProps?.backgroundColorChoice}
          galleryLayout={mergedProps?.galleryLayout}
        />
      )
    case "gallery":
      return <GallerySection key={component.id} {...props} />
    case "faq":
      return <FAQSection key={component.id} {...props} />
    case "hotel-suggestions":
      return <HotelSuggestionsSection key={component.id} {...props} />
    case "event-details":
      if (!common.wedding) return null
      return <EventDetailsSection key={component.id} {...props} wedding={common.wedding} />
    case "countdown":
      return (
        <CountdownSection
          key={component.id}
          {...props}
          weddingDate={common.wedding?.wedding_date || ""}
        />
      )
    case "our-story":
      return <OurStorySection key={component.id} {...props} />
    case "dress-code":
      return <DressCodeSection key={component.id} {...props} />
    case "notes":
      return <NotesSection key={component.id} {...props} />
    case "special-guests":
      return <SpecialGuestsSection key={component.id} {...props} />
    case "banner":
      return (
        <BannerSection
          key={component.id}
          sectionId={component.id}
          theme={common.theme}
          {...mergedProps}
        />
      )
    default:
      return null
  }
}

function EmptySubPage({
  onAddSection,
  enabledComponents,
  hasWeddingDate,
}: {
  onAddSection: (sectionType: string) => void
  enabledComponents: string[]
  hasWeddingDate: boolean
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const editingCtx = useEditingModeSafe()
  const isEditing = editingCtx?.isEditingMode ?? false

  if (!isEditing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm font-serif" style={{ color: "rgba(66,12,20,0.3)" }}>
          Nothing here yet
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-sm font-serif" style={{ color: "rgba(66,12,20,0.4)" }}>
        No sections yet — add one to build this page
      </p>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all duration-200 hover:scale-105 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Section
      </button>
      <SectionSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectSection={onAddSection}
        position={0}
        enabledComponents={enabledComponents}
        hasWeddingDate={hasWeddingDate}
        isSubPageEditor
      />
    </div>
  )
}

// Inner content — runs inside all providers
function SubPageContent({ weddingNameId, pageSlug }: SubPageClientProps) {
  const { config, updatePages, isLoading } = usePageConfig()
  const customizeCtx = useCustomize()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [subPageLinks, setSubPageLinks] = useState<{ id: string; label: string; href: string; isActive: boolean }[]>([])
  const [curtainFalling, setCurtainFalling] = useState(false)
  const [curtainComplete, setCurtainComplete] = useState(false)
  const curtainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getWeddingByNameIdClient(weddingNameId).then(setWedding)
  }, [weddingNameId])

  useEffect(() => {
    setSubPageLinks(
      (config.pages ?? [])
        .filter((p) => p.enabled && p.showInNav)
        .map((p) => ({
          id: p.id,
          label: p.label,
          href: getWeddingPath(weddingNameId, p.path),
          isActive: p.path === pageSlug,
        }))
    )
  }, [config.pages, weddingNameId, pageSlug])

  // Trigger curtain fall once config finishes loading
  useEffect(() => {
    if (!isLoading && !curtainFalling) {
      setCurtainFalling(true)
      curtainTimerRef.current = setTimeout(() => setCurtainComplete(true), 850)
    }
    return () => { if (curtainTimerRef.current) clearTimeout(curtainTimerRef.current) }
  }, [isLoading])

  const curtainEl = !curtainComplete ? (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundColor: '#c9a961',
          transform: curtainFalling ? 'translateY(100%)' : 'translateY(0)',
          transition: curtainFalling ? 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <Image
          src="/images/logos/OMW Logo White.png"
          alt="OhMyWedding"
          width={120}
          height={120}
          className="w-32 h-auto"
          priority
          unoptimized
        />
      </div>
    </div>
  ) : null

  // While config is loading, render only the curtain (skip page derivation)
  if (isLoading) return <>{curtainEl}</>

  const subPage = config.pages?.find((p) => p.path === pageSlug && p.enabled)
  if (!subPage) {
    notFound()
    return null
  }

  const resolvedComponents = resolveComponents(subPage.components, config.sharedComponents)
  const activeComponents = resolvedComponents.filter((c) => c.enabled)

  const mainPageSections = resolveComponents(config.components, config.sharedComponents)
    .filter((c) => c.enabled)
    .map((c) => c.type)

  // sectionConfigs stores keys in camelCase (e.g. "guestPhotos"), not kebab-case
  const toConfigKey = (type: string) =>
    type.replace(/-\d+$/, '').replace(/-([a-z])/g, (_, l) => l.toUpperCase())

  // Merge component.props with sectionConfigs so customizer changes are reflected immediately
  const getMergedComponentProps = (component: InlineComponent): Record<string, any> => ({
    ...(component.props ?? {}),
    ...(config.sectionConfigs?.[toConfigKey(component.type)] ?? {}),
  })

  const theme = config.siteSettings?.theme

  const commonProps: CommonProps = {
    wedding: wedding ?? undefined,
    weddingNameId,
    theme: theme as any,
    alignment: { text: "center" },
  }

  // Mutate the specific sub-page's components array
  const updateSubPageComponents = (newComponents: InlineComponent[]) => {
    updatePages(
      (config.pages ?? []).map((p) =>
        p.path === pageSlug ? { ...p, components: newComponents } : p
      )
    )
  }

  const handleAddSection = (position: number, sectionType: string) => {
    const isMulti = MULTI_INSTANCE_TYPES.includes(sectionType)
    const existing = activeComponents.find((c) => c.type === sectionType)

    if (existing && !isMulti) return

    const componentId = `${sectionType}-${Date.now()}`
    const newComponent: InlineComponent = {
      id: componentId,
      type: sectionType,
      enabled: true,
      order: 0,
      props: getDefaultPropsForSection(sectionType),
    }

    const updated = [...activeComponents]
    updated.splice(position, 0, newComponent)
    updateSubPageComponents(updated.map((c, i) => ({ ...c, order: i })))
  }

  const handleDeleteSection = (componentId: string) => {
    updateSubPageComponents(activeComponents.filter((c) => c.id !== componentId))
  }

  const handleMoveSection = (componentId: string, direction: 'up' | 'down') => {
    const idx = activeComponents.findIndex((c) => c.id === componentId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === activeComponents.length - 1) return

    const updated = [...activeComponents]
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]]
    updateSubPageComponents(updated.map((c, i) => ({ ...c, order: i })))
  }

  const handleMoveTo = (componentId: string, targetIndex: number) => {
    const idx = activeComponents.findIndex((c) => c.id === componentId)
    if (idx === -1 || targetIndex < 0 || targetIndex >= activeComponents.length) return

    const updated = [...activeComponents]
    const [item] = updated.splice(idx, 1)
    updated.splice(targetIndex, 0, item)
    updateSubPageComponents(updated.map((c, i) => ({ ...c, order: i })))
  }

  const handleEditSection = (componentId: string, componentType: string) => {
    const component = activeComponents.find((c) => c.id === componentId)
    if (!component) return
    const mergedProps = {
      ...(component.props ?? {}),
      ...(config.sectionConfigs?.[toConfigKey(componentType)] ?? {}),
    }
    // Use componentType (not componentId) as sectionId so configs are stored under
    // the camelCase type key (e.g. "guestPhotos"), matching getMergedComponentProps.
    customizeCtx.openCustomizer(componentType, componentType, mergedProps)
  }

  const enabledTypes = activeComponents.map((c) => c.type)

  const sectionInfoList = activeComponents.map((c) => ({
    id: c.id,
    type: c.type,
    label: c.type.replace(/-/g, ' '),
  }))

  return (
    <>
      {curtainEl}

      <EditingTopBar weddingNameId={weddingNameId} />

      <WeddingNav
        person1Name={wedding?.partner1_first_name ?? ""}
        person2Name={wedding?.partner2_first_name ?? ""}
        accentColor={theme?.colors?.primary || "#DDA46F"}
        showNavLinks={config.siteSettings?.navigation?.showNavLinks !== false}
        enabledSections={mainPageSections}
        subPageLinks={subPageLinks}
        useColorBackground={config.siteSettings?.navigation?.useColorBackground || false}
        backgroundColorChoice={config.siteSettings?.navigation?.backgroundColorChoice || "none"}
        themeColors={theme?.colors}
        alwaysVisible
        mainPageHref={getWeddingPath(weddingNameId)}
      />

      <main className="pt-14 sm:pt-20">
        {activeComponents.length === 0
          ? <EmptySubPage
              onAddSection={(sectionType) => handleAddSection(0, sectionType)}
              enabledComponents={enabledTypes}
              hasWeddingDate={!!wedding?.wedding_date}
            />
          : <>
              <div className="relative group h-0">
                <AddSectionButton
                  position={0}
                  onAddSection={handleAddSection}
                  enabledComponents={enabledTypes}
                  hasWeddingDate={!!wedding?.wedding_date}
                  isSubPageEditor
                />
              </div>

              {activeComponents.map((component, index) => {
                const sectionEl = renderSection(component, commonProps, getMergedComponentProps(component))
                if (!sectionEl) return null

                return (
                  <div key={component.id} className="relative group" data-section-id={component.id}>
                    <SectionControls
                      componentId={component.id}
                      componentType={component.type}
                      canMoveUp={index > 0}
                      canMoveDown={index < activeComponents.length - 1}
                      allSections={sectionInfoList}
                      currentIndex={index}
                      onDelete={handleDeleteSection}
                      onMoveUp={() => handleMoveSection(component.id, 'up')}
                      onMoveDown={() => handleMoveSection(component.id, 'down')}
                      onMoveTo={handleMoveTo}
                      onEdit={handleEditSection}
                    />
                    {sectionEl}
                    <AddSectionButton
                      position={index + 1}
                      onAddSection={handleAddSection}
                      enabledComponents={enabledTypes}
                      hasWeddingDate={!!wedding?.wedding_date}
                      isSubPageEditor
                    />
                  </div>
                )
              })}
            </>
        }
      </main>

      <SectionCustomizer />
    </>
  )
}

// Reads page config to set up color-dependent providers
function SubPageWithSiteConfig({ weddingNameId, pageSlug }: SubPageClientProps) {
  const { config } = usePageConfig()
  const initialColors = {
    primary: config.siteSettings?.theme?.colors?.primary || "#d4a574",
    secondary: config.siteSettings?.theme?.colors?.secondary || "#9ba082",
    accent: config.siteSettings?.theme?.colors?.accent || "#e6b5a3",
  }

  return (
    <SiteConfigProvider initialColors={initialColors}>
      <CustomizeProvider weddingNameId={weddingNameId}>
        <SubPageContent weddingNameId={weddingNameId} pageSlug={pageSlug} />
      </CustomizeProvider>
    </SiteConfigProvider>
  )
}

// Outer shell — sets up all providers
export function SubPageClient({ weddingNameId, pageSlug }: SubPageClientProps) {
  return (
    <I18nProvider>
      <EditingModeProvider weddingNameId={weddingNameId}>
        <PageConfigProvider weddingNameId={weddingNameId}>
          <VariantProvider>
            <ViewportProvider>
              <SubPageWithSiteConfig weddingNameId={weddingNameId} pageSlug={pageSlug} />
            </ViewportProvider>
          </VariantProvider>
        </PageConfigProvider>
      </EditingModeProvider>
    </I18nProvider>
  )
}

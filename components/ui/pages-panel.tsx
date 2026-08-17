"use client"

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2, Link2, Copy, Navigation, Plus, ExternalLink, X, Check } from 'lucide-react'
import { usePageConfig } from '@/components/contexts/page-config-context'
import { isComponentRef } from '@/lib/resolve-component'
import { getWeddingPath } from '@/lib/wedding-url'
import type { SubPage, InlineComponent } from '@/lib/page-config'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function CreatePageForm({
  existingPaths,
  onClose,
  onCreate,
}: {
  existingPaths: string[]
  onClose: () => void
  onCreate: (page: SubPage) => void
}) {
  const [label, setLabel] = useState('')
  const [path, setPath] = useState('')
  const [pathEdited, setPathEdited] = useState(false)

  const handleLabelChange = (value: string) => {
    setLabel(value)
    if (!pathEdited) {
      setPath(slugify(value))
    }
  }

  const handlePathChange = (value: string) => {
    setPathEdited(true)
    setPath(slugify(value))
  }

  const isDuplicate = existingPaths.includes(path)
  const isValid = label.trim().length > 0 && path.length > 0 && !isDuplicate

  const handleSubmit = () => {
    if (!isValid) return
    const now = Date.now()
    onCreate({
      id: `page-${path}-${now}`,
      path,
      label: label.trim(),
      showInNav: false,
      enabled: true,
      components: [],
    })
  }

  return (
    <div className="border border-[#420c14]/15 rounded-lg bg-[#420c14]/3 p-3 space-y-3">
      <div className="space-y-2">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/50 mb-1 block">Page Name</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose() }}
            placeholder="e.g. Schedule, Travel Info"
            className="w-full text-sm px-2.5 py-1.5 border border-[#420c14]/15 rounded-md bg-white text-[#420c14] placeholder:text-[#420c14]/30 focus:outline-none focus:ring-1 focus:ring-[#420c14]/30"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-[#420c14]/50 mb-1 block">
            URL Path
            {isDuplicate && <span className="ml-1 text-red-500 normal-case tracking-normal">— already in use</span>}
          </label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#420c14]/30 flex-shrink-0">/{'​'}</span>
            <input
              value={path}
              onChange={(e) => handlePathChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose() }}
              placeholder="page-path"
              className={`flex-1 text-sm px-2.5 py-1.5 border rounded-md bg-white text-[#420c14] placeholder:text-[#420c14]/30 font-mono focus:outline-none focus:ring-1 ${
                isDuplicate
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-[#420c14]/15 focus:ring-[#420c14]/30'
              }`}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#420c14]/50 hover:text-[#420c14] rounded-md hover:bg-[#420c14]/5 transition-colors"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#420c14] text-[#f5f2eb] hover:bg-[#5a1a22]"
        >
          <Check className="w-3 h-3" />
          Create Page
        </button>
      </div>
    </div>
  )
}

function PageCard({
  page,
  sharedComponents,
  weddingNameId,
  onUpdate,
  onDelete,
  onUnlink,
}: {
  page: SubPage
  sharedComponents?: Record<string, any>
  weddingNameId?: string
  onUpdate: (patch: Partial<SubPage>) => void
  onDelete: () => void
  onUnlink: (refId: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pageHref, setPageHref] = useState(
    weddingNameId ? `/${weddingNameId}/${page.path}` : `/${page.path}`
  )
  useEffect(() => {
    if (weddingNameId) setPageHref(getWeddingPath(weddingNameId, page.path))
  }, [weddingNameId, page.path])

  const refs = page.components.filter(isComponentRef)
  const inline = page.components.filter((c): c is InlineComponent => !isComponentRef(c))

  return (
    <div className="border border-[#420c14]/10 rounded-lg overflow-hidden bg-white">
      {/* Page header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#420c14]/3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#420c14] truncate">{page.label}</span>
            <span className="text-[11px] bg-[#420c14]/8 text-[#420c14]/60 px-1.5 py-0.5 rounded font-mono">
              /{page.path}
            </span>
          </div>
          {inline.length === 0 && refs.length === 0 && (
            <p className="text-[10px] text-[#420c14]/35 mt-0.5">No sections yet — visit to add some</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Visit / Edit link */}
          {weddingNameId && (
            <a
              href={pageHref}
              target="_blank"
              rel="noopener noreferrer"
              title="Open page to add and edit sections"
              className="p-1.5 text-[#420c14]/35 hover:text-[#420c14] hover:bg-[#420c14]/8 rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Show in nav toggle */}
          <button
            onClick={() => onUpdate({ showInNav: !page.showInNav })}
            title={page.showInNav ? 'Showing in nav' : 'Hidden from nav'}
            className={`p-1.5 rounded transition-colors ${
              page.showInNav
                ? 'text-[#420c14] bg-[#420c14]/10 hover:bg-[#420c14]/15'
                : 'text-[#420c14]/30 hover:text-[#420c14] hover:bg-[#420c14]/8'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Enable/disable */}
          <button
            onClick={() => onUpdate({ enabled: !page.enabled })}
            title={page.enabled ? 'Page is visible to guests' : 'Page is hidden from guests'}
            className={`p-1.5 rounded transition-colors ${
              page.enabled
                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                : 'text-[#420c14]/30 hover:text-[#420c14] hover:bg-[#420c14]/8'
            }`}
          >
            {page.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(); setConfirmDelete(false) }}
                className="text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] font-medium text-[#420c14]/50 hover:text-[#420c14] px-2 py-1 rounded hover:bg-[#420c14]/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-[#420c14]/30 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sections list */}
      {(inline.length > 0 || refs.length > 0) && (
        <div className="px-3 py-2 space-y-1.5 border-t border-[#420c14]/6">
          {inline.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs text-[#420c14]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#420c14]/20 flex-shrink-0" />
              <span className="capitalize">{c.type.replace(/-/g, ' ')}</span>
            </div>
          ))}
          {refs.map((ref) => {
            if (!isComponentRef(ref)) return null
            const shared = sharedComponents?.[ref.$ref]
            return (
              <div key={ref.$ref} className="flex items-center gap-2 text-xs text-[#DDA46F]">
                <Link2 className="w-3 h-3 flex-shrink-0" />
                <span className="capitalize flex-1">{shared?.type?.replace(/-/g, ' ') ?? ref.$ref}</span>
                <button
                  onClick={() => onUnlink(ref.$ref)}
                  title="Convert to independent copy"
                  className="flex items-center gap-1 text-[10px] text-[#420c14]/40 hover:text-[#420c14] transition-colors"
                >
                  <Copy className="w-2.5 h-2.5" />
                  Unlink
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface PagesPanelProps {
  weddingNameId?: string
}

export function PagesPanel({ weddingNameId }: PagesPanelProps) {
  const { config, updatePages } = usePageConfig()
  const pages = config.pages ?? []
  const [showCreateForm, setShowCreateForm] = useState(false)

  const updatePage = (id: string, patch: Partial<SubPage>) => {
    updatePages(pages.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const deletePage = (id: string) => {
    updatePages(pages.filter((p) => p.id !== id))
  }

  const unlinkComponent = (pageId: string, refId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (!page) return
    const shared = config.sharedComponents?.[refId]
    if (!shared) return
    const newComponents = page.components.map((c) => {
      if (isComponentRef(c) && c.$ref === refId) {
        return { ...shared, id: `${shared.id}-copy-${Date.now()}` }
      }
      return c
    })
    updatePages(pages.map((p) => (p.id === pageId ? { ...p, components: newComponents } : p)))
  }

  const handleCreate = (page: SubPage) => {
    updatePages([...pages, page])
    setShowCreateForm(false)
  }

  const existingPaths = pages.map((p) => p.path)

  if (pages.length === 0 && !showCreateForm) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
        <div className="w-10 h-10 bg-[#420c14]/6 rounded-full flex items-center justify-center mb-3">
          <Navigation className="w-5 h-5 text-[#420c14]/30" />
        </div>
        <p className="text-sm font-serif text-[#420c14] mb-1">No additional pages yet</p>
        <p className="text-xs text-[#420c14]/40 leading-relaxed mb-4">
          Create pages like a schedule, travel info, or photo gallery. Then add any sections you want.
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#420c14] text-[#f5f2eb] hover:bg-[#5a1a22] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Page
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showCreateForm ? (
        <CreatePageForm
          existingPaths={existingPaths}
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreate}
        />
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#420c14]/50 hover:text-[#420c14] border border-dashed border-[#420c14]/20 hover:border-[#420c14]/40 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Page
        </button>
      )}

      {pages.map((page) => (
        <PageCard
          key={page.id}
          page={page}
          sharedComponents={config.sharedComponents}
          weddingNameId={weddingNameId}
          onUpdate={(patch) => updatePage(page.id, patch)}
          onDelete={() => deletePage(page.id)}
          onUnlink={(refId) => unlinkComponent(page.id, refId)}
        />
      ))}
    </div>
  )
}

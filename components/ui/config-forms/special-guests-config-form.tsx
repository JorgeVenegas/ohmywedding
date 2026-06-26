"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { BackgroundColorPicker, type BackgroundColorChoice } from './shared'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface GuestPerson {
  id: string
  name: string
  role?: string
}

interface PartyGroup {
  id: string
  title: string
  people: GuestPerson[]
  show: boolean
}

interface SpecialGuestsConfigFormProps {
  config: {
    sectionTitle?: string
    sectionSubtitle?: string
    introText?: string
    showTitle?: boolean
    showSubtitle?: boolean
    showIntroText?: boolean
    showParents?: boolean
    brideParentsTitle?: string
    brideParents?: GuestPerson[]
    showBrideParents?: boolean
    groomParentsTitle?: string
    groomParents?: GuestPerson[]
    showGroomParents?: boolean
    partyGroups?: PartyGroup[]
    useColorBackground?: boolean
    backgroundColorChoice?: BackgroundColorChoice
  }
  onChange: (key: string, value: unknown) => void
}

function newPerson(): GuestPerson {
  return { id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', role: '' }
}

function newGroup(): PartyGroup {
  return { id: `g-${Date.now()}`, title: '', people: [newPerson()], show: true }
}

function PeopleEditor({
  people,
  onChange,
  namePlaceholder = 'Full name',
}: {
  people: GuestPerson[]
  onChange: (people: GuestPerson[]) => void
  namePlaceholder?: string
}) {
  const update = (i: number, field: keyof GuestPerson, value: string) => {
    const next = [...people]
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }
  const remove = (i: number) => onChange(people.filter((_, idx) => idx !== i))
  const add = () => onChange([...people, newPerson()])

  return (
    <div className="space-y-2">
      {people.map((p, i) => (
        <div key={p.id} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              value={p.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              placeholder={namePlaceholder}
            />
            <Input
              value={p.role || ''}
              onChange={(e) => update(i, 'role', e.target.value)}
              placeholder="Role / title (optional)"
              className="text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 p-1.5 text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full mt-1">
        <Plus className="w-3.5 h-3.5 mr-1" /> Add person
      </Button>
    </div>
  )
}

export function SpecialGuestsConfigForm({ config, onChange }: SpecialGuestsConfigFormProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const showTitle      = config.showTitle      ?? true
  const showSubtitle   = config.showSubtitle   ?? true
  const showIntroText  = config.showIntroText  ?? true
  const showParents    = config.showParents    ?? true
  const showBrideParents = config.showBrideParents ?? true
  const showGroomParents = config.showGroomParents ?? true

  const brideParents = config.brideParents || []
  const groomParents = config.groomParents || []
  const partyGroups  = config.partyGroups  || []

  const addGroup = () => {
    const g = newGroup()
    onChange('partyGroups', [...partyGroups, g])
    setExpandedGroup(g.id)
  }

  const updateGroup = (id: string, field: keyof PartyGroup, value: unknown) => {
    onChange('partyGroups', partyGroups.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const removeGroup = (id: string) => {
    onChange('partyGroups', partyGroups.filter(g => g.id !== id))
    if (expandedGroup === id) setExpandedGroup(null)
  }

  const moveGroup = (i: number, dir: 'up' | 'down') => {
    const next = [...partyGroups]
    const swap = dir === 'up' ? i - 1 : i + 1
    ;[next[i], next[swap]] = [next[swap], next[i]]
    onChange('partyGroups', next)
  }

  return (
    <div className="space-y-6">

      {/* ── Section header ── */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Section Header</h4>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Subtitle</label>
            <Switch checked={showSubtitle} onCheckedChange={(v) => onChange('showSubtitle', v)} />
          </div>
          {showSubtitle && (
            <Input
              value={config.sectionSubtitle || ''}
              onChange={(e) => onChange('sectionSubtitle', e.target.value)}
              placeholder="e.g. The people we love"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Switch checked={showTitle} onCheckedChange={(v) => onChange('showTitle', v)} />
          </div>
          {showTitle && (
            <Input
              value={config.sectionTitle || ''}
              onChange={(e) => onChange('sectionTitle', e.target.value)}
              placeholder="e.g. Our Wedding Party"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Intro message</label>
            <Switch checked={showIntroText} onCheckedChange={(v) => onChange('showIntroText', v)} />
          </div>
          {showIntroText && (
            <Textarea
              value={config.introText || ''}
              onChange={(e) => onChange('introText', e.target.value)}
              placeholder="A few words about the people celebrating with you..."
              rows={3}
            />
          )}
        </div>
      </div>

      {/* ── Parents ── */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 text-sm">Parents</h4>
          <Switch checked={showParents} onCheckedChange={(v) => onChange('showParents', v)} />
        </div>

        {showParents && (
          <>
            {/* Bride's parents */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Bride&apos;s Parents</label>
                <Switch checked={showBrideParents} onCheckedChange={(v) => onChange('showBrideParents', v)} />
              </div>
              {showBrideParents && (
                <>
                  <Input
                    value={config.brideParentsTitle || ''}
                    onChange={(e) => onChange('brideParentsTitle', e.target.value)}
                    placeholder="e.g. Parents of the Bride"
                  />
                  <PeopleEditor
                    people={brideParents}
                    onChange={(p) => onChange('brideParents', p)}
                    namePlaceholder="Parent's name"
                  />
                </>
              )}
            </div>

            {/* Groom's parents */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Groom&apos;s Parents</label>
                <Switch checked={showGroomParents} onCheckedChange={(v) => onChange('showGroomParents', v)} />
              </div>
              {showGroomParents && (
                <>
                  <Input
                    value={config.groomParentsTitle || ''}
                    onChange={(e) => onChange('groomParentsTitle', e.target.value)}
                    placeholder="e.g. Parents of the Groom"
                  />
                  <PeopleEditor
                    people={groomParents}
                    onChange={(p) => onChange('groomParents', p)}
                    namePlaceholder="Parent's name"
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Party groups ── */}
      <div className="p-4 border border-gray-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 text-sm">Wedding Party</h4>
            <p className="text-xs text-gray-500 mt-0.5">Bridesmaids, groomsmen, flower girls…</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addGroup} className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add group
          </Button>
        </div>

        {partyGroups.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            No groups yet. Add bridesmaids, groomsmen, etc.
          </div>
        )}

        <div className="space-y-2">
          {partyGroups.map((group, i) => {
            const isExpanded = expandedGroup === group.id
            return (
              <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Group header row */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {group.title || <span className="text-gray-400 italic">Untitled group</span>}
                    </p>
                    <p className="text-xs text-gray-400">{group.people.length} {group.people.length === 1 ? 'person' : 'people'}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={group.show !== false}
                      onCheckedChange={(v) => updateGroup(group.id, 'show', v)}
                    />
                    <button
                      type="button"
                      onClick={() => moveGroup(i, 'up')}
                      disabled={i === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGroup(i, 'down')}
                      disabled={i === partyGroups.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="p-3 space-y-3 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Group title</label>
                      <Input
                        value={group.title}
                        onChange={(e) => updateGroup(group.id, 'title', e.target.value)}
                        placeholder="e.g. Bridesmaids"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Members</label>
                      <PeopleEditor
                        people={group.people}
                        onChange={(p) => updateGroup(group.id, 'people', p)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Background ── */}
      <BackgroundColorPicker
        useColorBackground={config.useColorBackground}
        backgroundColorChoice={config.backgroundColorChoice}
        onUseColorBackgroundChange={(v) => onChange('useColorBackground', v)}
        onBackgroundColorChoiceChange={(v) => onChange('backgroundColorChoice', v)}
      />
    </div>
  )
}

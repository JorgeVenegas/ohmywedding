"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { X, Plus, Check, Mail } from "lucide-react"
import { getWeddingUrl, type WeddingPlan } from "@/lib/wedding-url"

// Types
interface WeddingDetails {
  partner1_first_name?: string
  partner2_first_name?: string
  wedding_date?: string
  ceremony_venue_name?: string
  ceremony_venue_address?: string
  reception_venue_name?: string
  reception_venue_address?: string
}

interface PartnerNames {
  partner1: string
  partner2: string
}

interface InvitationTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  invitationTemplate: string
  onSave: (template: string) => Promise<void>
  weddingDetails: WeddingDetails | null
  partnerNames: PartnerNames
  weddingId: string
  weddingNameId?: string
  weddingPlan?: WeddingPlan
}

// Template examples
const TEMPLATE_EXAMPLES = [
  {
    id: 'formal',
    label: 'Formal Invitation',
    description: 'Classic wedding invitation template',
    template: "Dear {{groupname}},\n\nWe are delighted to invite you to celebrate our wedding on {{weddingdate}}!\n\nView your personalized invitation here: {{groupinvitationurl}}\n\nWith love,\n{{partner1}} & {{partner2}}"
  },
  {
    id: 'casual',
    label: 'Casual & Fun',
    description: 'Friendly and relaxed invitation',
    template: "Hey {{groupname}}! 👋\n\n{{partner1}} and {{partner2}} are getting married on {{weddingdate}}! 🎉\n\nCheck out your invite: {{groupinvitationurl}}\n\nCan't wait to celebrate with you!"
  },
  {
    id: 'detailed',
    label: 'Detailed Info',
    description: 'Includes venue details',
    template: "Hello {{guestname}},\n\nYou're invited to our wedding at {{ceremonyplace}} on {{weddingdate}}.\n\nCeremony: {{ceremonyplace}}\nReception: {{receptionplace}}\n\nRSVP here: {{groupinvitationurl}}"
  },
  {
    id: 'short',
    label: 'Short & Simple',
    description: 'Quick message with link',
    template: "Hi {{groupname}}! Your invitation is ready: {{groupinvitationurl}}"
  }
]

// Variable definitions
const GUEST_VARIABLES = [
  { var: '{{groupname}}', label: 'Group Name', desc: 'Name of the guest group' },
  { var: '{{guestname}}', label: 'Guest Name', desc: 'Individual guest name' },
  { var: '{{groupinvitationurl}}', label: 'Invitation URL', desc: 'Direct link to invitation' },
]

const WEDDING_VARIABLES = [
  { var: '{{partner1}}', label: 'Partner 1', descFn: (p: PartnerNames) => p.partner1 || 'First partner name' },
  { var: '{{partner2}}', label: 'Partner 2', descFn: (p: PartnerNames) => p.partner2 || 'Second partner name' },
  { var: '{{weddingdate}}', label: 'Wedding Date', descFn: (_p: PartnerNames, w: WeddingDetails | null) => w?.wedding_date ? new Date(w.wedding_date).toLocaleDateString() : 'Wedding date' },
]

const VENUE_VARIABLES = [
  { var: '{{ceremonyplace}}', label: 'Ceremony Venue', descFn: (w: WeddingDetails | null) => w?.ceremony_venue_name || 'Ceremony venue name' },
  { var: '{{ceremonyaddress}}', label: 'Ceremony Address', desc: 'Full ceremony address' },
  { var: '{{receptionplace}}', label: 'Reception Venue', descFn: (w: WeddingDetails | null) => w?.reception_venue_name || 'Reception venue name' },
  { var: '{{receptionaddress}}', label: 'Reception Address', desc: 'Full reception address' },
]

const ALL_VARIABLES = [
  { var: '{{groupname}}', label: 'Group Name' },
  { var: '{{guestname}}', label: 'Guest Name' },
  { var: '{{groupinvitationurl}}', label: 'Invitation URL' },
  { var: '{{partner1}}', label: 'Partner 1' },
  { var: '{{partner2}}', label: 'Partner 2' },
  { var: '{{weddingdate}}', label: 'Wedding Date' },
  { var: '{{ceremonyplace}}', label: 'Ceremony Venue' },
  { var: '{{ceremonyaddress}}', label: 'Ceremony Address' },
  { var: '{{receptionplace}}', label: 'Reception Venue' },
  { var: '{{receptionaddress}}', label: 'Reception Address' },
]

export function InvitationTemplateModal({
  isOpen,
  onClose,
  invitationTemplate: initialTemplate,
  onSave,
  weddingDetails,
  partnerNames,
  weddingId,
  weddingNameId,
  weddingPlan = 'free',
}: InvitationTemplateModalProps) {
  const [inviteTemplate, setInviteTemplate] = useState(initialTemplate)
  const [dynamicContentSearch, setDynamicContentSearch] = useState('')
  const [showReplaceMenu, setShowReplaceMenu] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const replaceMenuRef = useRef<HTMLDivElement>(null)

  // Reset template when modal opens
  useEffect(() => {
    if (isOpen) {
      setInviteTemplate(initialTemplate)
    }
  }, [isOpen, initialTemplate])

  // Get friendly display name for variables
  const getVariableDisplayName = useCallback((variable: string): string => {
    const variableMap: Record<string, string> = {
      '{{groupname}}': 'The Smith Family',
      '{{guestname}}': 'John Smith',
      '{{groupinvitationurl}}': 'https://yourwedding.com/invite/abc123',
      '{{partner1}}': weddingDetails?.partner1_first_name || 'Alex',
      '{{partner2}}': weddingDetails?.partner2_first_name || 'Jordan',
      '{{weddingdate}}': weddingDetails?.wedding_date 
        ? new Date(weddingDetails.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
        : 'June 15, 2026',
      '{{ceremonyplace}}': weddingDetails?.ceremony_venue_name || 'Grand Oak Chapel',
      '{{ceremonyaddress}}': weddingDetails?.ceremony_venue_address || '123 Main St, City',
      '{{receptionplace}}': weddingDetails?.reception_venue_name || 'Garden Pavilion',
      '{{receptionaddress}}': weddingDetails?.reception_venue_address || '456 Park Ave, City'
    }
    return variableMap[variable] || variable
  }, [weddingDetails])

  // Replace template variables with actual values for preview
  const replaceTemplateVariables = useCallback((
    template: string,
    data: { groupName?: string; guestName?: string; groupId?: string }
  ): string => {
    const nameId = weddingNameId || weddingId
    const baseUrl = getWeddingUrl(nameId, '', weddingPlan)
    const invitationUrl = data.groupId 
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}g=${data.groupId}`
      : baseUrl

    const partner1 = partnerNames.partner1 || 'Partner 1'
    const partner2 = partnerNames.partner2 || 'Partner 2'

    let formattedDate = 'TBD'
    if (weddingDetails?.wedding_date) {
      const date = new Date(weddingDetails.wedding_date)
      formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return template
      .replace(/\{\{groupname\}\}/gi, data.groupName || '')
      .replace(/\{\{groupinvitationurl\}\}/gi, invitationUrl)
      .replace(/\{\{guestname\}\}/gi, data.guestName || '')
      .replace(/\{\{partner1\}\}/gi, partner1)
      .replace(/\{\{partner2\}\}/gi, partner2)
      .replace(/\{\{weddingdate\}\}/gi, formattedDate)
      .replace(/\{\{ceremonyplace\}\}/gi, weddingDetails?.ceremony_venue_name || 'TBD')
      .replace(/\{\{receptionplace\}\}/gi, weddingDetails?.reception_venue_name || 'TBD')
      .replace(/\{\{ceremonyaddress\}\}/gi, weddingDetails?.ceremony_venue_address || 'TBD')
      .replace(/\{\{receptionaddress\}\}/gi, weddingDetails?.reception_venue_address || 'TBD')
  }, [weddingDetails, partnerNames, weddingId, weddingNameId, weddingPlan])

  // Insert variable at cursor position
  const insertVariableAtCursor = useCallback((variableValue: string) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    let cursorPos = inviteTemplate.length

    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0)

      let charCount = 0
      const walker = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0): boolean => {
        if (node === range.endContainer) {
          if (node.nodeType === Node.TEXT_NODE) {
            const textBeforeCursor = (node.textContent || '').substring(0, range.endOffset)
            charCount += textBeforeCursor.replace(/\u200B/g, '').length
          }
          return true
        }
        if (node.nodeType === Node.TEXT_NODE) {
          charCount += (node.textContent || '').replace(/\u200B/g, '').length
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          if (element.hasAttribute('data-variable')) {
            charCount += (element.getAttribute('data-variable') || '').length
            return false
          }
          if (element.tagName === 'BR') {
            charCount += 1
            return false
          }
          if (element.tagName === 'DIV' && parentIsEditor && indexInParent > 0) {
            const firstChild = element.firstChild
            const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE &&
              (firstChild as HTMLElement).tagName === 'BR'
            if (!startsWithBR) {
              charCount += 1
            }
          }
        }
        const isEditor = node === editor
        for (let i = 0; i < node.childNodes.length; i++) {
          if (walker(node.childNodes[i], isEditor, i)) return true
        }
        return false
      }
      walker(editor, true, 0)
      cursorPos = charCount
    }

    const newTemplate = inviteTemplate.slice(0, cursorPos) + variableValue + inviteTemplate.slice(cursorPos)
    setInviteTemplate(newTemplate)
    setTimeout(() => editor.focus(), 0)
  }, [inviteTemplate])

  // Sync template formatting whenever inviteTemplate changes
  useEffect(() => {
    if (!editorRef.current || !isOpen) return

    const editor = editorRef.current

    if (isUpdatingRef.current) {
      isUpdatingRef.current = false
      return
    }

    const selection = window.getSelection()
    let cursorOffset = 0
    const hadFocus = document.activeElement === editor

    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(editor)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      cursorOffset = preCaretRange.toString().length
    }

    const parts = inviteTemplate.split(/(\{\{[^}]+\}\})/g)
    const zwsp = '\u200B'
    editor.innerHTML = parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        const displayName = getVariableDisplayName(part)
        return `${zwsp}<span 
          contenteditable="false" 
          class="inline-flex items-center gap-1 px-2 py-1 mx-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors group cursor-pointer relative" 
          data-variable="${part}"
          data-index="${index}"
          style="user-select: none;"
        >
          <span class="pointer-events-none">${displayName}</span>
          <button 
            class="hidden group-hover:inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/30" 
            data-action="replace"
            data-variable="${part}"
            title="Replace"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button 
            class="hidden group-hover:inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/30" 
            data-action="delete"
            data-variable="${part}"
            title="Delete"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>${zwsp}`
      }
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    }).join('')

    // Add event listeners for badge actions
    editor.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const badgeSpan = (e.currentTarget as HTMLElement).closest('[data-index]') as HTMLElement
        if (badgeSpan) {
          const index = parseInt(badgeSpan.getAttribute('data-index') || '0')
          const parts = inviteTemplate.split(/(\{\{[^}]+\}\})/g)
          parts.splice(index, 1)
          const newTemplate = parts.join('')
          setInviteTemplate(newTemplate)
        }
      })
    })

    editor.querySelectorAll('[data-action="replace"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const badgeSpan = (e.currentTarget as HTMLElement).closest('[data-index]') as HTMLElement
        if (badgeSpan) {
          const variable = badgeSpan.getAttribute('data-variable')
          if (variable) {
            setShowReplaceMenu(variable)
          }
        }
      })
    })

    // Restore cursor position
    if (cursorOffset > 0 && hadFocus) {
      const textNodes: Text[] = []
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node as Text)
        } else {
          node.childNodes.forEach(walk)
        }
      }
      walk(editor)

      let charCount = 0
      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0
        if (charCount + nodeLength >= cursorOffset) {
          const offset = cursorOffset - charCount
          try {
            const range = document.createRange()
            range.setStart(node, Math.min(offset, nodeLength))
            range.collapse(true)
            selection?.removeAllRanges()
            selection?.addRange(range)
          } catch {
            // Ignore range errors
          }
          break
        }
        charCount += nodeLength
      }
    }

    if (hadFocus) {
      editor.focus()
    }
  }, [inviteTemplate, weddingDetails, isOpen, getVariableDisplayName])

  // Handle input in contentEditable
  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement

    const extractTemplate = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent || '').replace(/\u200B/g, '')
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement

        if (element.hasAttribute('data-variable')) {
          return element.getAttribute('data-variable') || ''
        }
        if (element.tagName === 'BR') {
          return '\n'
        }

        const isWrapperDiv = element.tagName === 'DIV' && parentIsEditor && indexInParent === 0 &&
          Array.from(node.childNodes).some(child =>
            child.nodeType === Node.ELEMENT_NODE &&
            (child as HTMLElement).tagName === 'DIV'
          )

        if (element.tagName === 'DIV' && (parentIsEditor || isWrapperDiv)) {
          const treatChildrenAsTopLevel = isWrapperDiv
          const content = Array.from(node.childNodes)
            .map((child, idx) => extractTemplate(child, treatChildrenAsTopLevel, idx))
            .join('')

          if (isWrapperDiv) {
            return content
          }

          const firstChild = node.firstChild
          const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE &&
            (firstChild as HTMLElement).tagName === 'BR'
          const shouldAddNewline = indexInParent > 0 && !startsWithBR
          return (shouldAddNewline ? '\n' : '') + content
        }

        const isEditor = element === target
        return Array.from(node.childNodes)
          .map((child, idx) => extractTemplate(child, isEditor, idx))
          .join('')
      }
      return ''
    }

    const newText = extractTemplate(target, true, 0)

    if (newText !== inviteTemplate) {
      isUpdatingRef.current = true
      setInviteTemplate(newText)
    }
  }, [inviteTemplate])

  // Handle paste - plain text only
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') || ''
    document.execCommand('insertText', false, text)
  }, [])

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(inviteTemplate)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Filter variables by search
  const filterVariables = <T extends { var: string; label: string; desc?: string }>(
    variables: T[]
  ): T[] => {
    if (!dynamicContentSearch) return variables
    const search = dynamicContentSearch.toLowerCase()
    return variables.filter(item =>
      item.label.toLowerCase().includes(search) ||
      (item.desc && item.desc.toLowerCase().includes(search)) ||
      item.var.toLowerCase().includes(search)
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Invitation Message Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the message template for sending invitations to guests
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Message Template and Preview - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Message Template */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Message Template
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Add Dynamic Content Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Dynamic Content
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-96 max-h-96 overflow-y-auto">
                        <div className="px-2 py-1.5 text-xs font-semibold">Dynamic Content</div>
                        <div className="px-2 pb-2">
                          <Input
                            value={dynamicContentSearch}
                            onChange={(e) => setDynamicContentSearch(e.target.value)}
                            placeholder="Search variables..."
                            className="h-8 text-xs"
                          />
                        </div>
                        <DropdownMenuSeparator />

                        {/* Guest Information */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Guest Information</div>
                        {filterVariables(GUEST_VARIABLES).map((item) => (
                          <DropdownMenuItem
                            key={item.var}
                            className="text-xs cursor-pointer flex-col items-start py-2"
                            onClick={() => insertVariableAtCursor(item.var)}
                          >
                            <div className="font-medium">{item.label}</div>
                            <div className="text-muted-foreground">{item.desc}</div>
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        {/* Wedding Details */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Wedding Details</div>
                        {WEDDING_VARIABLES.filter(item =>
                          !dynamicContentSearch ||
                          item.label.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                          item.descFn(partnerNames, weddingDetails).toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                          item.var.toLowerCase().includes(dynamicContentSearch.toLowerCase())
                        ).map((item) => (
                          <DropdownMenuItem
                            key={item.var}
                            className="text-xs cursor-pointer flex-col items-start py-2"
                            onClick={() => insertVariableAtCursor(item.var)}
                          >
                            <div className="font-medium">{item.label}</div>
                            <div className="text-muted-foreground">{item.descFn(partnerNames, weddingDetails)}</div>
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        {/* Venue Information */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Venue Information</div>
                        {VENUE_VARIABLES.filter(item =>
                          !dynamicContentSearch ||
                          item.label.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                          (item.descFn ? item.descFn(weddingDetails) : item.desc || '').toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                          item.var.toLowerCase().includes(dynamicContentSearch.toLowerCase())
                        ).map((item) => (
                          <DropdownMenuItem
                            key={item.var}
                            className="text-xs cursor-pointer flex-col items-start py-2"
                            onClick={() => insertVariableAtCursor(item.var)}
                          >
                            <div className="font-medium">{item.label}</div>
                            <div className="text-muted-foreground">
                              {item.descFn ? item.descFn(weddingDetails) : item.desc}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Examples Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          Examples
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <div className="px-2 py-1.5 text-xs font-semibold">Template Examples</div>
                        <DropdownMenuSeparator />
                        {TEMPLATE_EXAMPLES.map((example) => (
                          <DropdownMenuItem
                            key={example.id}
                            className="text-xs cursor-pointer"
                            onClick={() => setInviteTemplate(example.template)}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{example.label}</span>
                              <span className="text-muted-foreground">{example.description}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* ContentEditable Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  className="w-full min-h-[300px] max-h-[400px] px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm overflow-y-auto whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                  style={{ lineHeight: '1.5' }}
                  data-placeholder="Type your message here..."
                  suppressContentEditableWarning
                />
                <p className="text-xs text-muted-foreground">
                  Variables appear as badges with example values. Hover to edit or delete.
                </p>
              </div>

              {/* Right: Preview */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground block">
                  Preview
                </label>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900 min-h-[300px] max-h-[400px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Message Preview</span>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                    {replaceTemplateVariables(
                      inviteTemplate,
                      {
                        groupName: 'The Smith Family',
                        guestName: 'John Smith',
                        groupId: 'abc123'
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Replace Variable Dropdown */}
            {showReplaceMenu && (
              <div
                ref={replaceMenuRef}
                className="fixed bg-background border border-border rounded-lg shadow-lg p-2 z-[60] w-64"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="px-2 py-1.5 text-xs font-semibold border-b mb-2">
                  Replace with:
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {ALL_VARIABLES.filter(v => v.var !== showReplaceMenu).map((variable) => (
                    <button
                      key={variable.var}
                      onClick={() => {
                        const newTemplate = inviteTemplate.replace(showReplaceMenu!, variable.var)
                        setInviteTemplate(newTemplate)
                        setShowReplaceMenu(null)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                    >
                      <div className="font-medium">{variable.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{variable.var}</div>
                    </button>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => setShowReplaceMenu(null)}
                    className="w-full text-center px-3 py-1.5 rounded-md hover:bg-accent text-xs text-muted-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex gap-3 p-6 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            <Check className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

"use client"

import React, { useState, useEffect, use, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PremiumUpgradePrompt } from "@/components/ui/premium-gate"
import { useSubscriptionContext } from "@/components/contexts/subscription-context"
import { getCleanAdminUrl } from "@/lib/admin-url"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
} from "recharts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Header } from "@/components/header"
import {
  Users,
  Users2,
  Plus,
  Phone,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Tag,
  UserPlus,
  Filter,
  Search,
  LayoutList,
  LayoutGrid,
  Check,
  Columns,
  FolderPlus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Send,
  Mail,
  MailCheck,
  UserCheck,
  MoreVertical,
  Copy,
  Link,
  FileText,
  Plane,
  Ticket,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"

interface Guest {
  id: string
  guest_group_id: string | null
  name: string
  phone_number: string | null
  email: string | null
  tags: string[]
  confirmation_status: 'pending' | 'confirmed' | 'declined'
  dietary_restrictions: string | null
  notes: string | null
  invited_by: string[]
  invitation_sent: boolean
  invitation_sent_at: string | null
  created_at: string
  attending?: boolean | null
  is_traveling?: boolean
  traveling_from?: string | null
  travel_arrangement?: 'will_buy_ticket' | 'no_ticket_needed' | null
  ticket_attachment_url?: string | null
  no_ticket_reason?: string | null
  admin_set_travel?: boolean
}

interface GuestGroup {
  id: string
  name: string
  phone_number: string | null
  tags: string[]
  notes: string | null
  invited_by: string[]
  invitation_sent: boolean
  invitation_sent_at: string | null
  message: string | null
  rsvp_submitted_at: string | null
  created_at: string
  guests: Guest[]
  first_opened_at: string | null
  open_count: number
}

interface InvitationsPageProps {
  params: Promise<{ weddingId: string }>
}

const TAG_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-700 border-blue-200",
  friends: "bg-green-100 text-green-700 border-green-200",
  work: "bg-purple-100 text-purple-700 border-purple-200",
  neighbors: "bg-orange-100 text-orange-700 border-orange-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
}

const PREDEFINED_TAGS = ["family", "friends", "work", "neighbors"]

export default function InvitationsPage({ params }: InvitationsPageProps) {
  const { weddingId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Premium feature check
  const { canAccessFeature, loading: subscriptionLoading } = useSubscriptionContext()
  
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([])
  const [ungroupedGuests, setUngroupedGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showUngroupedExpanded, setShowUngroupedExpanded] = useState(true)
  
  // View mode: 'flat' or 'groups' - initialized from URL param
  const initialViewMode = searchParams.get('view') === 'flat' ? 'flat' : 'groups'
  const [viewMode, setViewModeState] = useState<'flat' | 'groups'>(initialViewMode)
  
  // Update URL when view mode changes
  const setViewMode = (mode: 'flat' | 'groups') => {
    setViewModeState(mode)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', mode)
    router.replace(`?${params.toString()}`, { scroll: false })
  }
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [invitedByFilter, setInvitedByFilter] = useState<string>('all')
  const [openedFilter, setOpenedFilter] = useState<'all' | 'opened' | 'not-opened'>('all')
  
  // Timeline chart state
  const [timelineRange, setTimelineRange] = useState<'all' | '90d' | '30d' | '14d' | '7d'>('30d')
  const [timelineData, setTimelineData] = useState<{
    chartData: Array<{
      date: string
      confirmed: number
      declined: number
      opens: number
      cumulativeConfirmed: number
      cumulativeDeclined: number
      cumulativeOpens: number
    }>
    confirmationEvents: Array<{
      id: string
      type: 'confirmed' | 'declined' | 'updated'
      timestamp: string
      groupId: string
      groupName: string
      guestId?: string
      guestName?: string
      description: string
    }>
    summary: {
      totalConfirmed: number
      totalDeclined: number
      totalOpens: number
    }
  } | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineGroupFilter, setTimelineGroupFilter] = useState<string>('all')
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'name' | 'group' | 'status' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Wedding/Partner info
  const [partnerNames, setPartnerNames] = useState<{ partner1: string; partner2: string }>({ partner1: '', partner2: '' })
  
  // Multi-select states
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set())
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false)
  const [showBulkInvitedByModal, setShowBulkInvitedByModal] = useState(false)
  const [bulkInvitedBy, setBulkInvitedBy] = useState<string[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [assignToGroupId, setAssignToGroupId] = useState<string | 'new'>('new')
  
  // Column visibility state - initialized from localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = {
      phone: true,
      group: true,
      tags: true,
      status: true,
      dietary: true,
      invitedBy: true,
      inviteSent: true,
      travelInfo: true,
    }
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`invitations-columns-${weddingId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Check if the saved config has the new structure (travelInfo instead of old travel columns)
          if (parsed.hasOwnProperty('travelInfo')) {
            return parsed
          }
          // Old structure detected, clear it and use defaults
          localStorage.removeItem(`invitations-columns-${weddingId}`)
        } catch {
          // Invalid data, clear it
          localStorage.removeItem(`invitations-columns-${weddingId}`)
        }
      }
    }
    return defaultColumns
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  
  // Send invites modal state
  const [showSendInvitesModal, setShowSendInvitesModal] = useState(false)
  const [sendInvitesConfig, setSendInvitesConfig] = useState({
    skipAlreadySent: true,
    onlyConfirmed: false,
    onlyPending: false,
  })
  
  // Invitation template settings
  const [showInviteTemplateModal, setShowInviteTemplateModal] = useState(false)
  const [inviteTemplate, setInviteTemplate] = useState(
    "Dear {{groupname}},\n\nWe are delighted to invite you to celebrate our wedding on {{weddingdate}}!\n\nView your personalized invitation here: {{groupinvitationurl}}\n\nWith love,\n{{partner1}} & {{partner2}}"
  )
  const [weddingNameId, setWeddingNameId] = useState<string>('')
  const [weddingDetails, setWeddingDetails] = useState<any>(null)
  const [dynamicContentSearch, setDynamicContentSearch] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const [showReplaceMenu, setShowReplaceMenu] = useState<string | null>(null)
  const replaceMenuRef = useRef<HTMLDivElement>(null)
  
  // Message viewing
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedGroupForMessage, setSelectedGroupForMessage] = useState<GuestGroup | null>(null)
  
  // Helper function to get friendly display name for variables
  const getVariableDisplayName = (variable: string): string => {
    const variableMap: Record<string, string> = {
      '{{groupname}}': 'The Smith Family',
      '{{guestname}}': 'John Smith',
      '{{groupinvitationurl}}': 'https://yourwedding.com/invite/abc123',
      '{{partner1}}': weddingDetails?.partner1_first_name || 'Alex',
      '{{partner2}}': weddingDetails?.partner2_first_name || 'Jordan',
      '{{weddingdate}}': weddingDetails?.wedding_date ? new Date(weddingDetails.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'June 15, 2026',
      '{{ceremonyplace}}': weddingDetails?.ceremony_venue_name || 'Grand Oak Chapel',
      '{{ceremonyaddress}}': '123 Main St, City',
      '{{receptionplace}}': weddingDetails?.reception_venue_name || 'Garden Pavilion',
      '{{receptionaddress}}': '456 Park Ave, City'
    }
    return variableMap[variable] || variable
  }
  
  // Sync template formatting whenever inviteTemplate changes
  useEffect(() => {
    if (!editorRef.current) return
    
    const editor = editorRef.current
    
    // Skip if we're in the middle of user input to prevent cursor jump
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false
      return
    }
    
    const selection = window.getSelection()
    let cursorOffset = 0
    let hadFocus = document.activeElement === editor
    
    // Save cursor position
    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(editor)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      cursorOffset = preCaretRange.toString().length
    }
    
    // Render formatted HTML with friendly names and action buttons
    const parts = inviteTemplate.split(/(\{\{[^}]+\}\})/g)
    const zwsp = '\u200B' // zero-width space for cursor positioning
    editor.innerHTML = parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        const displayName = getVariableDisplayName(part)
        // Add zero-width spaces before and after badge for easier cursor positioning
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
      // Escape HTML and convert newlines to BR tags for display
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    }).join('')
    
    // Add event listeners for badge actions
    editor.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const badgeSpan = (e.currentTarget as HTMLElement).closest('[data-index]') as HTMLElement
        if (badgeSpan) {
          const index = parseInt(badgeSpan.getAttribute('data-index') || '0')
          // Split template and remove the specific occurrence at this index
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
          const index = parseInt(badgeSpan.getAttribute('data-index') || '0')
          if (variable) {
            setShowReplaceMenu(variable)
            // Store the index for replacement
            ;(badgeSpan as any).__replaceIndex = index
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
          } catch (e) {
            // Ignore range errors
          }
          break
        }
        charCount += nodeLength
      }
    }
    
    // Restore focus if editor had it
    if (hadFocus) {
      editor.focus()
    }
  }, [inviteTemplate, weddingDetails])
  
  // Initial render - ensure template shows when modal opens
  useEffect(() => {
    if (showInviteTemplateModal && editorRef.current && !editorRef.current.textContent) {
      // Trigger a re-render to show initial content
      const editor = editorRef.current
      const parts = inviteTemplate.split(/(\{\{[^}]+\}\})/g)
      editor.innerHTML = parts.map((part) => {
        if (part.match(/^\{\{[^}]+\}\}$/)) {
          const displayName = getVariableDisplayName(part)
          return `<span 
            contenteditable="false" 
            class="inline-flex items-center gap-1 px-2 py-1 mx-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors group cursor-pointer relative" 
            data-variable="${part}"
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
          </span>`
        }
        return part.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }).join('')
      
      // Attach event listeners
      editor.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const variable = (e.currentTarget as HTMLElement).getAttribute('data-variable')
          if (variable) {
            setInviteTemplate(inviteTemplate.replace(variable, ''))
          }
        })
      })
      
      editor.querySelectorAll('[data-action="replace"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const variable = (e.currentTarget as HTMLElement).getAttribute('data-variable')
          if (variable) {
            setShowReplaceMenu(variable)
          }
        })
      })
    }
  }, [showInviteTemplateModal, inviteTemplate, weddingDetails])
  
  // Close replace menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (replaceMenuRef.current && !replaceMenuRef.current.contains(e.target as Node)) {
        setShowReplaceMenu(null)
      }
    }
    if (showReplaceMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReplaceMenu])
  
  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`invitations-columns-${weddingId}`, JSON.stringify(visibleColumns))
  }, [visibleColumns, weddingId])
  
  // Modal states
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showAddGuestModal, setShowAddGuestModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [addDropdownOpen, setAddDropdownOpen] = useState(false)
  
  // Confirmation/Notification dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    confirmVariant: 'default' | 'destructive' | 'success'
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', confirmVariant: 'default', onConfirm: () => {} })
  
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({ isOpen: false, type: 'success', title: '', message: '' })
  
  // CSV Import states
  const [showCsvImportModal, setShowCsvImportModal] = useState(false)
  const [csvImportMode, setCsvImportMode] = useState<'guests' | 'groups'>('guests')
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [csvImportError, setCsvImportError] = useState<string | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  
  // Database fields for CSV mapping - Guests mode
  const GUEST_DB_FIELDS = [
    { key: 'name', label: 'Guest Name', required: true },
    { key: 'groupName', label: 'Group Name', required: true },
    { key: 'phoneNumber', label: 'Phone Number', required: false },
    { key: 'tags', label: 'Tags (comma-separated)', required: false },
    { key: 'confirmationStatus', label: 'Status (pending/confirmed/declined)', required: false },
    { key: 'dietaryRestrictions', label: 'Dietary Restrictions', required: false },
    { key: 'invitedBy', label: 'Invited By (comma-separated)', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ]
  
  // Database fields for CSV mapping - Groups mode
  const GROUP_DB_FIELDS = [
    { key: 'groupName', label: 'Group Name', required: true },
    { key: 'guestCount', label: 'Number of Guests', required: true },
    { key: 'phoneNumber', label: 'Phone Number', required: false },
    { key: 'tags', label: 'Tags (comma-separated)', required: false },
    { key: 'invitedBy', label: 'Invited By (comma-separated)', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ]
  
  // Get current DB fields based on import mode
  const DB_FIELDS = csvImportMode === 'groups' ? GROUP_DB_FIELDS : GUEST_DB_FIELDS
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    phoneNumber: "",
    tags: [] as string[],
    notes: "",
    invitedBy: [] as string[],
  })
  
  // State for guests to add within the group modal
  const [guestsInGroupModal, setGuestsInGroupModal] = useState<Array<{
    id: string
    name: string
    phoneNumber: string
    tags: string[]
    confirmationStatus: 'pending' | 'confirmed' | 'declined'
    dietaryRestrictions: string
    notes: string
  }>>([])
  
  const [tempGuestForm, setTempGuestForm] = useState({
    name: "",
    phoneNumber: "",
    tags: [] as string[],
    confirmationStatus: "pending" as 'pending' | 'confirmed' | 'declined',
    dietaryRestrictions: "",
    notes: "",
  })
  
  const [isAddingGuestInModal, setIsAddingGuestInModal] = useState(false)
  
  const [guestForm, setGuestForm] = useState({
    name: "",
    phoneNumber: "",
    tags: [] as string[],
    confirmationStatus: "pending" as 'pending' | 'confirmed' | 'declined',
    dietaryRestrictions: "",
    notes: "",
    invitedBy: [] as string[],
    isTraveling: false,
    travelingFrom: "",
    travelArrangement: null as 'will_buy_ticket' | 'no_ticket_needed' | null,
    ticketAttachmentUrl: null as string | null,
    noTicketReason: "",
  })
  
  // State for creating a new group from guest form
  const [newGroupNameForGuest, setNewGroupNameForGuest] = useState("")
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false)
  
  // State for group travel dialog
  const [showGroupTravelDialog, setShowGroupTravelDialog] = useState(false)
  const [groupTravelForm, setGroupTravelForm] = useState({
    groupId: "",
    groupName: "",
    isTraveling: false,
    travelingFrom: "",
    travelArrangement: null as 'will_buy_ticket' | 'no_ticket_needed' | null,
    noTicketReason: "",
  })

  useEffect(() => {
    fetchGuestGroups()
    fetchUngroupedGuests()
    fetchWeddingData()
  }, [weddingId])

  // Fetch timeline data when range or group filter changes
  useEffect(() => {
    fetchTimelineData()
  }, [weddingId, timelineRange, timelineGroupFilter])

  const fetchTimelineData = async () => {
    setTimelineLoading(true)
    try {
      let url = `/api/invitation-tracking/timeline?weddingId=${encodeURIComponent(weddingId)}&range=${timelineRange}`
      if (timelineGroupFilter !== 'all') {
        url += `&groupId=${timelineGroupFilter}`
      }
      const response = await fetch(url)
      const result = await response.json()
      if (response.ok) {
        setTimelineData(result)
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setTimelineLoading(false)
    }
  }

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification.isOpen) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, isOpen: false }))
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification.isOpen])

  const fetchWeddingData = async () => {
    try {
      const response = await fetch(`/api/weddings/${encodeURIComponent(weddingId)}/details`)
      const result = await response.json()
      if (result.details) {
        setPartnerNames({
          partner1: result.details.partner1_first_name || '',
          partner2: result.details.partner2_first_name || '',
        })
        setWeddingNameId(result.details.wedding_name_id || '')
        setWeddingDetails(result.details)
        // Load invitation template if it exists in page_config
        if (result.details.page_config?.invitationTemplate) {
          setInviteTemplate(result.details.page_config.invitationTemplate)
        }
      }
    } catch (error) {
    }
  }
  
  // Get partner options for display - use fetched names or fallback to generic labels
  const partnerOptions = useMemo(() => {
    const options: string[] = []
    if (partnerNames.partner1) options.push(partnerNames.partner1)
    if (partnerNames.partner2) options.push(partnerNames.partner2)
    // If no partner names are set, provide fallback options
    if (options.length === 0) {
      options.push('Partner 1', 'Partner 2')
    }
    return options
  }, [partnerNames])

  const fetchGuestGroups = async () => {
    try {
      const response = await fetch(`/api/guest-groups?weddingId=${encodeURIComponent(weddingId)}`)
      const result = await response.json()
      if (result.data) {
        setGuestGroups(result.data)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const fetchUngroupedGuests = async () => {
    try {
      const response = await fetch(`/api/guests?weddingId=${encodeURIComponent(weddingId)}&ungrouped=true`)
      const result = await response.json()
      if (result.data) {
        setUngroupedGuests(result.data)
      }
    } catch (error) {
    }
  }

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleAddGroup = async () => {
    try {
      const response = await fetch("/api/guest-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId: weddingId,
          name: groupForm.name,
          phoneNumber: groupForm.phoneNumber || null,
          tags: groupForm.tags,
          notes: groupForm.notes || null,
          invitedBy: groupForm.invitedBy,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setNotification({ isOpen: true, type: 'error', title: 'Error', message: `Error adding group: ${result.error}` })
        return
      }
      
      // If there are guests to add, create them for this group
      if (guestsInGroupModal.length > 0 && result.data?.id) {
        const groupId = result.data.id
        
        for (const guest of guestsInGroupModal) {
          try {
            await fetch("/api/guests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                weddingId: weddingId,
                groupId: groupId,
                name: guest.name,
                phoneNumber: guest.phoneNumber || null,
                tags: guest.tags,
                confirmationStatus: guest.confirmationStatus,
                dietaryRestrictions: guest.dietaryRestrictions || null,
                notes: guest.notes || null,
              }),
            })
          } catch (error) {
          }
        }
      }
      
      await fetchGuestGroups()
      setShowAddGroupModal(false)
      resetGroupForm()
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'Success', 
        message: guestsInGroupModal.length > 0 
          ? `Group and ${guestsInGroupModal.length} guest${guestsInGroupModal.length > 1 ? 's' : ''} added successfully!` 
          : 'Group added successfully!' 
      })
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error adding group. Please try again.' })
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup) return
    
    try {
      const response = await fetch("/api/guest-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGroup.id,
          name: groupForm.name,
          phoneNumber: groupForm.phoneNumber || null,
          tags: groupForm.tags,
          notes: groupForm.notes || null,
          invitedBy: groupForm.invitedBy,
        }),
      })
      
      if (response.ok) {
        await fetchGuestGroups()
        setEditingGroup(null)
        resetGroupForm()
      }
    } catch (error) {
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group? All guests in this group will be unassigned.',
      confirmLabel: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          const response = await fetch(`/api/guest-groups?id=${groupId}`, {
            method: "DELETE",
          })
          
          if (response.ok) {
            await fetchGuestGroups()
            setNotification({ isOpen: true, type: 'success', title: 'Deleted', message: 'Group deleted successfully.' })
          }
        } catch (error) {
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting group. Please try again.' })
        }
      }
    })
  }

  const handleAddGuest = async () => {
    try {
      let groupIdToUse = selectedGroupId
      
      // If creating a new group, create it first
      if (isCreatingNewGroup && newGroupNameForGuest.trim()) {
        const groupResponse = await fetch("/api/guest-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingId,
            name: newGroupNameForGuest.trim(),
            tags: [],
            invitedBy: [],
          }),
        })
        
        if (groupResponse.ok) {
          const { data: newGroup } = await groupResponse.json()
          groupIdToUse = newGroup.id
        } else {
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to create group. Please try again.' })
          return
        }
      }
      
      // If no group selected and not creating new, create a group with the guest's name
      if (!groupIdToUse && !isCreatingNewGroup) {
        const groupResponse = await fetch("/api/guest-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingId,
            name: guestForm.name.trim() || "New Group",
            tags: [],
            invitedBy: guestForm.invitedBy,
          }),
        })
        
        if (groupResponse.ok) {
          const { data: newGroup } = await groupResponse.json()
          groupIdToUse = newGroup.id
        }
      }
      
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId: weddingId,
          guestGroupId: groupIdToUse,
          name: guestForm.name,
          phoneNumber: guestForm.phoneNumber || null,
          tags: guestForm.tags,
          confirmationStatus: guestForm.confirmationStatus,
          dietaryRestrictions: guestForm.dietaryRestrictions || null,
          notes: guestForm.notes || null,
          invitedBy: guestForm.invitedBy,
          isTraveling: guestForm.isTraveling,
          travelingFrom: guestForm.travelingFrom || null,
          travelArrangement: guestForm.travelArrangement || null,
        }),
      })
      
      if (response.ok) {
        await fetchGuestGroups()
        await fetchUngroupedGuests()
        setShowAddGuestModal(false)
        setSelectedGroupId(null)
        setIsCreatingNewGroup(false)
        setNewGroupNameForGuest("")
        resetGuestForm()
      }
    } catch (error) {
    }
  }

  const handleUpdateGuest = async () => {
    if (!editingGuest) return
    
    try {
      const response = await fetch("/api/guests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGuest.id,
          name: guestForm.name,
          phoneNumber: guestForm.phoneNumber || null,
          tags: guestForm.tags,
          guestGroupId: selectedGroupId,
          confirmationStatus: guestForm.confirmationStatus,
          dietaryRestrictions: guestForm.dietaryRestrictions || null,
          notes: guestForm.notes || null,
          invitedBy: guestForm.invitedBy,
          isTraveling: guestForm.isTraveling,
          travelingFrom: guestForm.travelingFrom || null,
          travelArrangement: guestForm.travelArrangement || null,
          ticketAttachmentUrl: guestForm.ticketAttachmentUrl || null,
          noTicketReason: guestForm.noTicketReason || null,
        }),
      })
      
      if (response.ok) {
        await fetchGuestGroups()
        await fetchUngroupedGuests()
        setEditingGuest(null)
        setSelectedGroupId(null)
        resetGuestForm()
      }
    } catch (error) {
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Guest',
      message: 'Are you sure you want to delete this guest?',
      confirmLabel: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          const response = await fetch(`/api/guests?id=${guestId}`, {
            method: "DELETE",
          })
          
          if (response.ok) {
            await fetchGuestGroups()
            await fetchUngroupedGuests()
            setNotification({ isOpen: true, type: 'success', title: 'Deleted', message: 'Guest deleted successfully.' })
          }
        } catch (error) {
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting guest. Please try again.' })
        }
      }
    })
  }

  const handleUpdateGuestStatus = async (guest: Guest, newStatus: 'pending' | 'confirmed' | 'declined') => {
    try {
      const response = await fetch("/api/guests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guest.id,
          name: guest.name,
          phoneNumber: guest.phone_number,
          tags: guest.tags || [],
          guestGroupId: guest.guest_group_id,
          confirmationStatus: newStatus,
          dietaryRestrictions: guest.dietary_restrictions,
          notes: guest.notes,
        }),
      })
      
      if (response.ok) {
        await fetchGuestGroups()
        await fetchUngroupedGuests()
      }
    } catch (error) {
    }
  }

  const resetGroupForm = () => {
    setGroupForm({ name: "", phoneNumber: "", tags: [], notes: "", invitedBy: [] })
    setGuestsInGroupModal([])
    setTempGuestForm({
      name: "",
      phoneNumber: "",
      tags: [],
      confirmationStatus: "pending",
      dietaryRestrictions: "",
      notes: "",
    })
    setIsAddingGuestInModal(false)
  }

  const resetGuestForm = () => {
    setGuestForm({
      name: "",
      phoneNumber: "",
      tags: [],
      confirmationStatus: "pending",
      dietaryRestrictions: "",
      notes: "",
      invitedBy: [],
      isTraveling: false,
      travelingFrom: "",
      travelArrangement: null,
      ticketAttachmentUrl: null,
      noTicketReason: "",
    })
    setIsCreatingNewGroup(false)
    setNewGroupNameForGuest("")
  }

  const openEditGroup = (group: GuestGroup) => {
    setGroupForm({
      name: group.name,
      phoneNumber: group.phone_number || "",
      tags: group.tags || [],
      notes: group.notes || "",
      invitedBy: group.invited_by || [],
    })
    setEditingGroup(group)
  }

  const openEditGuest = (guest: Guest) => {
    setGuestForm({
      name: guest.name,
      phoneNumber: guest.phone_number || "",
      tags: guest.tags || [],
      confirmationStatus: guest.confirmation_status,
      dietaryRestrictions: guest.dietary_restrictions || "",
      notes: guest.notes || "",
      invitedBy: guest.invited_by || [],
      isTraveling: guest.is_traveling || false,
      travelingFrom: guest.traveling_from || "",
      travelArrangement: guest.travel_arrangement || null,
      ticketAttachmentUrl: guest.ticket_attachment_url || null,
      noTicketReason: guest.no_ticket_reason || "",
    })
    setSelectedGroupId(guest.guest_group_id)
    setEditingGuest(guest)
  }

  const openAddGuestToGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setShowAddGuestModal(true)
  }

  const toggleTag = (tag: string) => {
    setGroupForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const toggleGuestTag = (tag: string) => {
    setGuestForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }
  
  // Helpers for managing guests in the group modal
  const toggleTempGuestTag = (tag: string) => {
    setTempGuestForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }
  
  const addGuestToGroupModal = () => {
    if (!tempGuestForm.name.trim()) return
    
    const newGuest = {
      id: Date.now().toString(),
      ...tempGuestForm,
    }
    
    setGuestsInGroupModal(prev => [...prev, newGuest])
    setTempGuestForm({
      name: "",
      phoneNumber: "",
      tags: [],
      confirmationStatus: "pending",
      dietaryRestrictions: "",
      notes: "",
    })
    setIsAddingGuestInModal(false)
  }
  
  const removeGuestFromGroupModal = (guestId: string) => {
    setGuestsInGroupModal(prev => prev.filter(g => g.id !== guestId))
  }

  // Multi-select handlers
  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(guestId)) {
        newSet.delete(guestId)
      } else {
        newSet.add(guestId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedGuestIds.size === filteredGuests.length) {
      setSelectedGuestIds(new Set())
    } else {
      setSelectedGuestIds(new Set(filteredGuests.map(g => g.id)))
    }
  }

  // Select all guests in a specific group
  const toggleSelectGroup = (groupGuests: Guest[]) => {
    const groupGuestIds = groupGuests.map(g => g.id)
    const allSelected = groupGuestIds.every(id => selectedGuestIds.has(id))
    
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev)
      if (allSelected) {
        // Deselect all guests in this group
        groupGuestIds.forEach(id => newSet.delete(id))
      } else {
        // Select all guests in this group
        groupGuestIds.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }

  // Check if all guests in a group are selected
  const isGroupFullySelected = (groupGuests: Guest[]) => {
    if (groupGuests.length === 0) return false
    return groupGuests.every(g => selectedGuestIds.has(g.id))
  }

  // Check if some guests in a group are selected
  const isGroupPartiallySelected = (groupGuests: Guest[]) => {
    if (groupGuests.length === 0) return false
    const selectedCount = groupGuests.filter(g => selectedGuestIds.has(g.id)).length
    return selectedCount > 0 && selectedCount < groupGuests.length
  }

  const clearSelection = () => {
    setSelectedGuestIds(new Set())
  }

  const handleAssignToGroup = async () => {
    if (selectedGuestIds.size === 0) return
    
    try {
      let targetGroupId = assignToGroupId
      
      // Create new group if needed
      if (assignToGroupId === 'new' && newGroupName.trim()) {
        const response = await fetch("/api/guest-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingId,
            name: newGroupName.trim(),
            tags: [],
            notes: null,
          }),
        })
        
        const result = await response.json()
        if (!response.ok) {
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: `Error creating group: ${result.error}` })
          return
        }
        targetGroupId = result.data.id
      }
      
      // Update all selected guests
      const updatePromises = Array.from(selectedGuestIds).map(async (guestId) => {
        const guest = allGuests.find(g => g.id === guestId)
        if (!guest) return
        
        return fetch("/api/guests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guestId,
            name: guest.name,
            phoneNumber: guest.phone_number,
            tags: guest.tags || [],
            guestGroupId: targetGroupId === 'new' ? null : targetGroupId,
            confirmationStatus: guest.confirmation_status,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
          }),
        })
      })
      
      await Promise.all(updatePromises)
      
      // Refresh data
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      
      // Reset state
      setSelectedGuestIds(new Set())
      setShowAssignGroupModal(false)
      setNewGroupName('')
      setAssignToGroupId('new')
      setNotification({ isOpen: true, type: 'success', title: 'Success', message: 'Guests assigned to group successfully!' })
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error assigning guests. Please try again.' })
    }
  }

  // Bulk status update handler
  const handleBulkStatusUpdate = async (newStatus: 'pending' | 'confirmed' | 'declined') => {
    if (selectedGuestIds.size === 0) return
    
    try {
      const updatePromises = Array.from(selectedGuestIds).map(async (guestId) => {
        const guest = allGuests.find(g => g.id === guestId)
        if (!guest) return
        
        return fetch("/api/guests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guestId,
            name: guest.name,
            phoneNumber: guest.phone_number,
            tags: guest.tags || [],
            guestGroupId: guest.guest_group_id,
            confirmationStatus: newStatus,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
          }),
        })
      })
      
      await Promise.all(updatePromises)
      
      // Refresh data
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      
      // Reset selection
      setSelectedGuestIds(new Set())
      setNotification({ isOpen: true, type: 'success', title: 'Updated', message: `${selectedGuestIds.size} guest(s) updated successfully!` })
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating guests. Please try again.' })
    }
  }

  // Bulk delete handler
  const handleBulkDelete = () => {
    if (selectedGuestIds.size === 0) return
    
    const count = selectedGuestIds.size
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Guests',
      message: `Are you sure you want to delete ${count} guest(s)? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          const deletePromises = Array.from(selectedGuestIds).map(async (guestId) => {
            return fetch(`/api/guests?id=${guestId}`, {
              method: "DELETE",
            })
          })
          
          await Promise.all(deletePromises)
          
          // Refresh data
          await fetchGuestGroups()
          await fetchUngroupedGuests()
          
          // Reset selection
          setSelectedGuestIds(new Set())
          setNotification({ isOpen: true, type: 'success', title: 'Deleted', message: `${count} guest(s) deleted successfully.` })
        } catch (error) {
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting guests. Please try again.' })
        }
      }
    })
  }

  // Bulk invited by update handler
  const handleBulkInvitedByUpdate = async () => {
    if (selectedGuestIds.size === 0) return
    
    try {
      const updatePromises = Array.from(selectedGuestIds).map(async (guestId) => {
        const guest = allGuests.find(g => g.id === guestId)
        if (!guest) return
        
        return fetch("/api/guests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guestId,
            name: guest.name,
            phoneNumber: guest.phone_number,
            tags: guest.tags || [],
            guestGroupId: guest.guest_group_id,
            confirmationStatus: guest.confirmation_status,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
            invitedBy: bulkInvitedBy,
          }),
        })
      })
      
      await Promise.all(updatePromises)
      
      // Refresh data
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      
      // Reset state
      const count = selectedGuestIds.size
      setSelectedGuestIds(new Set())
      setShowBulkInvitedByModal(false)
      setBulkInvitedBy([])
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'Updated', 
        message: `Updated "Invited By" for ${count} guest(s)!` 
      })
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating guests. Please try again.' })
    }
  }

  // Update all guests in a group to a specific status
  const handleGroupStatusUpdate = async (group: GuestGroup, newStatus: 'pending' | 'confirmed' | 'declined') => {
    if (group.guests.length === 0) return
    
    try {
      const updatePromises = group.guests.map(async (guest) => {
        return fetch("/api/guests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guest.id,
            name: guest.name,
            phoneNumber: guest.phone_number,
            tags: guest.tags || [],
            guestGroupId: guest.guest_group_id,
            confirmationStatus: newStatus,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
          }),
        })
      })
      
      await Promise.all(updatePromises)
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'Updated', 
        message: `All guests in "${group.name}" marked as ${newStatus}.` 
      })
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating group. Please try again.' })
    }
  }

  const openGroupTravelDialog = (group: GuestGroup) => {
    setGroupTravelForm({
      groupId: group.id,
      groupName: group.name,
      isTraveling: false,
      travelingFrom: "",
      travelArrangement: null,
      noTicketReason: "",
    })
    setShowGroupTravelDialog(true)
  }

  const handleSetGroupTravel = async () => {
    try {
      // Check if it's a bulk action on selected guests or a group action
      const isSelectedGuestsBulkAction = groupTravelForm.groupId === ''
      
      let guestsToUpdate: Guest[] = []
      let count = 0
      
      if (isSelectedGuestsBulkAction) {
        // Bulk action: Update all selected guests
        guestsToUpdate = allGuests.filter(g => selectedGuestIds.has(g.id))
        count = guestsToUpdate.length
      } else {
        // Group action: Update all guests in the group
        const group = guestGroups.find(g => g.id === groupTravelForm.groupId)
        if (!group || group.guests.length === 0) return
        guestsToUpdate = group.guests
        count = group.guests.length
      }
      
      if (guestsToUpdate.length === 0) return
      
      // Build updates object - use camelCase for API
      const updates: any = {
        isTraveling: groupTravelForm.isTraveling,
        adminSetTravel: true,
      }
      
      if (groupTravelForm.isTraveling) {
        updates.travelingFrom = groupTravelForm.travelingFrom || null
        updates.travelArrangement = groupTravelForm.travelArrangement || null
        updates.noTicketReason = groupTravelForm.travelArrangement === 'no_ticket_needed' 
          ? groupTravelForm.noTicketReason 
          : null
      } else {
        updates.travelingFrom = null
        updates.travelArrangement = null
        updates.noTicketReason = null
        updates.ticketAttachmentUrl = null
      }
      
      // Update all guests
      const updatePromises = guestsToUpdate.map(async (guest) => {
        return fetch("/api/guests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guest.id,
            name: guest.name,
            phoneNumber: guest.phone_number,
            email: guest.email,
            tags: guest.tags || [],
            guestGroupId: guest.guest_group_id,
            confirmationStatus: guest.confirmation_status,
            dietaryRestrictions: guest.dietary_restrictions,
            notes: guest.notes,
            invitedBy: guest.invited_by || [],
            ...updates,
          }),
        })
      })
      
      await Promise.all(updatePromises)
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      setShowGroupTravelDialog(false)
      
      // Clear selection if it was a bulk action
      if (isSelectedGuestsBulkAction) {
        setSelectedGuestIds(new Set())
      }
      
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'Success', 
        message: `Travel info set for ${count} guest(s)` 
      })
    } catch (error) {
      setNotification({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to set travel info' 
      })
    }
  }

  // Helper to get invitation URL - strips weddingNameId if on subdomain
  const getInvitationUrl = (groupId?: string): string => {
    if (typeof window === 'undefined') {
      return groupId 
        ? `/${weddingNameId || weddingId}?groupId=${groupId}`
        : `/${weddingNameId || weddingId}`
    }
    
    const baseUrl = window.location.origin
    const hostname = window.location.hostname
    
    // Check if we're on a subdomain (e.g., jorgeandyuli.ohmy.local or jorgeandyuli.ohmy.wedding)
    const isSubdomain = hostname.includes('ohmy.local') || hostname.includes('ohmy.wedding')
    
    if (isSubdomain) {
      // On a subdomain, just use root path
      return groupId ? `${baseUrl}/?groupId=${groupId}` : baseUrl
    }
    
    // On main domain, include the weddingNameId in the path
    return groupId 
      ? `${baseUrl}/${weddingNameId || weddingId}?groupId=${groupId}`
      : `${baseUrl}/${weddingNameId || weddingId}`
  }

  // Utility function to replace template variables with actual values
  const replaceTemplateVariables = (
    template: string, 
    data: { 
      groupName?: string
      guestName?: string
      groupId?: string
    },
    weddingData?: any
  ): string => {
    const invitationUrl = getInvitationUrl(data.groupId)
    
    // Fetch wedding data from fetchWeddingData if available
    const partner1 = partnerNames.partner1 || 'Partner 1'
    const partner2 = partnerNames.partner2 || 'Partner 2'
    
    // Format wedding date if available
    let formattedDate = 'TBD'
    if (weddingData?.wedding_date) {
      const date = new Date(weddingData.wedding_date)
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
      .replace(/\{\{ceremonyplace\}\}/gi, weddingData?.ceremony_venue_name || 'TBD')
      .replace(/\{\{receptionplace\}\}/gi, weddingData?.reception_venue_name || 'TBD')
      .replace(/\{\{ceremonyaddress\}\}/gi, weddingData?.ceremony_venue_address || 'TBD')
      .replace(/\{\{receptionaddress\}\}/gi, weddingData?.reception_venue_address || 'TBD')
  }

  // Update guest invitation status
  const updateGuestInvitationStatus = async (guestId: string, sent: boolean) => {
    try {
      const response = await fetch("/api/guests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guestId,
          invitationSent: sent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invitation status")
      }

      await fetchGuestGroups()
      await fetchUngroupedGuests()
    } catch (error) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to update invitation status"
      })
    }
  }

  // Update group invitation status
  const updateGroupInvitationStatus = async (groupId: string, sent: boolean) => {
    try {
      const response = await fetch("/api/guest-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: groupId,
          invitationSent: sent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update group invitation status")
      }

      await fetchGuestGroups()
    } catch (error) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to update group invitation status"
      })
    }
  }

  // Check if all guests in a group are sent and update group status
  const checkAndUpdateGroupStatus = async (groupId: string) => {
    const group = guestGroups.find(g => g.id === groupId)
    if (!group) return

    const allGuestsSent = group.guests.length > 0 && group.guests.every(g => g.invitation_sent)
    if (allGuestsSent && !group.invitation_sent) {
      await updateGroupInvitationStatus(groupId, true)
    }
  }

  // Send invite placeholder functions (functionality to be added later)
  const handleSendGroupInvite = async (group: GuestGroup) => {
    // Generate personalized message using template
    const personalizedMessage = replaceTemplateVariables(
      inviteTemplate,
      {
        groupName: group.name,
        groupId: group.id
      },
      weddingDetails
    )
    
    // Open WhatsApp with personalized message
    if (group.phone_number) {
      let phoneNumber = group.phone_number.replace(/[^0-9]/g, '')
      // Add +52 country code if not present
      if (!phoneNumber.startsWith('52')) {
        phoneNumber = '52' + phoneNumber
      }
      const encodedMessage = encodeURIComponent(personalizedMessage)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
      
      // Mark group as sent
      await updateGroupInvitationStatus(group.id, true)
      
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'WhatsApp Opened', 
        message: `Opening WhatsApp to send invitation to ${group.name}` 
      })
    } else {
      setNotification({ 
        isOpen: true, 
        type: 'error', 
        title: 'No Phone Number', 
        message: `${group.name} does not have a phone number set` 
      })
    }
  }

  const handleCopyRSVPLink = (group: GuestGroup) => {
    const rsvpUrl = getInvitationUrl(group.id)
    
    navigator.clipboard.writeText(rsvpUrl).then(() => {
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Link Copied!',
        message: `RSVP link for "${group.name}" copied to clipboard`
      })
    }).catch(() => {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to copy link to clipboard'
      })
    })
  }

  const handleSendGuestInvite = async (guest: Guest) => {
    // Find the group for this guest to generate proper invitation URL
    const guestGroup = guestGroups.find(g => g.id === guest.guest_group_id)
    
    // Generate personalized message using template
    const personalizedMessage = replaceTemplateVariables(
      inviteTemplate,
      {
        guestName: guest.name,
        groupName: guestGroup?.name,
        groupId: guestGroup?.id
      },
      weddingDetails
    )
    
    // Open WhatsApp with personalized message
    // Try guest phone first, then group phone
    const phoneNumber = guest.phone_number || guestGroup?.phone_number
    
    if (phoneNumber) {
      let cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
      // Add +52 country code if not present
      if (!cleanPhone.startsWith('52')) {
        cleanPhone = '52' + cleanPhone
      }
      const encodedMessage = encodeURIComponent(personalizedMessage)
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
      
      // Mark guest as sent
      await updateGuestInvitationStatus(guest.id, true)
      
      // Check if all guests in group are now sent
      if (guestGroup) {
        await checkAndUpdateGroupStatus(guestGroup.id)
      }
      
      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'WhatsApp Opened', 
        message: `Opening WhatsApp to send invitation to ${guest.name}` 
      })
    } else {
      setNotification({ 
        isOpen: true, 
        type: 'error', 
        title: 'No Phone Number', 
        message: `${guest.name} does not have a phone number set` 
      })
    }
  }

  const handleSendAllInvites = () => {
    // TODO: Implement actual sending logic
    const notSentCount = allGuests.filter(g => !g.invitation_sent).length
    setShowSendInvitesModal(false)
    setNotification({ 
      isOpen: true, 
      type: 'success', 
      title: 'Coming Soon', 
      message: `Sending invites to ${sendInvitesConfig.skipAlreadySent ? notSentCount : totalGuests} guests will be available soon.` 
    })
  }

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  // CSV Import handlers
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvImportError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const rows = parseCSV(text)
        
        if (rows.length < 2) {
          setCsvImportError("CSV file must have at least a header row and one data row")
          return
        }
        
        const headers = rows[0]
        const data = rows.slice(1).filter(row => row.some(cell => cell.trim()))
        
        setCsvHeaders(headers)
        setCsvData(data)
        
        // Detect import mode based on headers
        const headersLower = headers.map(h => h.toLowerCase().trim())
        const hasGuestCount = headersLower.some(h => h.includes('count') || h.includes('guests') || h.includes('number'))
        const hasGuestName = headersLower.some(h => (h.includes('name') && (h.includes('guest') || h.includes('person'))) || h === 'name')
        
        // If we have guest count but no individual guest names, assume groups mode
        if (hasGuestCount && !hasGuestName) {
          setCsvImportMode('groups')
        } else {
          setCsvImportMode('guests')
        }
        
        // Auto-map columns based on header names
        const autoMapping: Record<string, string> = {}
        headers.forEach((header, index) => {
          const headerLower = header.toLowerCase().trim()
          // Group name detection
          if ((headerLower.includes('group') && headerLower.includes('name')) || headerLower === 'group' || headerLower === 'family' || headerLower === 'household') {
            autoMapping[index.toString()] = 'groupName'
          } else if (headerLower.includes('count') || headerLower.includes('guests') || (headerLower.includes('number') && !headerLower.includes('phone'))) {
            autoMapping[index.toString()] = 'guestCount'
          } else if ((headerLower.includes('name') && !headerLower.includes('phone') && !headerLower.includes('group')) || headerLower === 'name') {
            autoMapping[index.toString()] = 'name'
          } else if (headerLower.includes('phone') || headerLower.includes('tel') || headerLower.includes('mobile')) {
            autoMapping[index.toString()] = 'phoneNumber'
          } else if (headerLower.includes('tag')) {
            autoMapping[index.toString()] = 'tags'
          } else if (headerLower.includes('status') || headerLower.includes('confirm')) {
            autoMapping[index.toString()] = 'confirmationStatus'
          } else if (headerLower.includes('diet') || headerLower.includes('allerg') || headerLower.includes('restriction')) {
            autoMapping[index.toString()] = 'dietaryRestrictions'
          } else if (headerLower.includes('invited')) {
            autoMapping[index.toString()] = 'invitedBy'
          } else if (headerLower.includes('note') || headerLower.includes('comment')) {
            autoMapping[index.toString()] = 'notes'
          }
        })
        setColumnMapping(autoMapping)
        setShowCsvImportModal(true)
      } catch {
        setCsvImportError("Failed to parse CSV file")
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]
      
      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          currentCell += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',') {
          currentRow.push(currentCell.trim())
          currentCell = ''
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell.trim())
          rows.push(currentRow)
          currentRow = []
          currentCell = ''
          if (char === '\r') i++
        } else if (char !== '\r') {
          currentCell += char
        }
      }
    }
    
    // Push last cell and row
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim())
      rows.push(currentRow)
    }
    
    return rows
  }

  const updateColumnMapping = (csvIndex: string, dbField: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev }
      
      // Remove any existing mapping to this dbField
      if (dbField !== '') {
        Object.keys(newMapping).forEach(key => {
          if (newMapping[key] === dbField) {
            delete newMapping[key]
          }
        })
      }
      
      if (dbField === '') {
        delete newMapping[csvIndex]
      } else {
        newMapping[csvIndex] = dbField
      }
      
      return newMapping
    })
  }

  const validateCsvMapping = (): boolean => {
    if (csvImportMode === 'groups') {
      // Check if group name and guest count are mapped
      const hasGroupNameMapping = Object.values(columnMapping).includes('groupName')
      const hasGuestCountMapping = Object.values(columnMapping).includes('guestCount')
      if (!hasGroupNameMapping) {
        setCsvImportError("Group Name field is required. Please map a column to 'Group Name'.")
        return false
      }
      if (!hasGuestCountMapping) {
        setCsvImportError("Number of Guests field is required. Please map a column to 'Number of Guests'.")
        return false
      }
    } else {
      // Guests mode - check if name and group name are mapped
      const hasNameMapping = Object.values(columnMapping).includes('name')
      const hasGroupNameMapping = Object.values(columnMapping).includes('groupName')
      if (!hasNameMapping) {
        setCsvImportError("Guest Name field is required. Please map a column to 'Guest Name'.")
        return false
      }
      if (!hasGroupNameMapping) {
        setCsvImportError("Group Name field is required. All guests must be assigned to a group.")
        return false
      }
    }
    setCsvImportError(null)
    return true
  }

  const handleCsvImport = async () => {
    if (!validateCsvMapping()) return
    
    setCsvImporting(true)
    setCsvImportError(null)
    
    try {
      if (csvImportMode === 'groups') {
        // Groups mode: Create groups with auto-generated guests
        const groupsData = csvData.map(row => {
          const group: Record<string, string | string[] | number> = {}
          
          Object.entries(columnMapping).forEach(([csvIndex, dbField]) => {
            const value = row[parseInt(csvIndex)] || ''
            
            if (dbField === 'guestCount') {
              group[dbField] = parseInt(value) || 1
            } else if (dbField === 'tags' || dbField === 'invitedBy') {
              group[dbField] = value.split(',').map(t => t.trim()).filter(t => t)
            } else {
              group[dbField] = value
            }
          })
          
          return group
        }).filter(group => group.groupName && (group.groupName as string).trim())
        
        if (groupsData.length === 0) {
          setCsvImportError("No valid groups found in CSV. Make sure the Group Name column has values.")
          setCsvImporting(false)
          return
        }
        
        // Create groups with guests via API
        const response = await fetch("/api/guest-groups/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingId,
            groups: groupsData,
          }),
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          setCsvImportError(result.error || "Failed to import groups")
          setCsvImporting(false)
          return
        }
        
        // Success
        await fetchGuestGroups()
        await fetchUngroupedGuests()
        
        setShowCsvImportModal(false)
        setCsvData([])
        setCsvHeaders([])
        setColumnMapping({})
        setNotification({ isOpen: true, type: 'success', title: 'Import Complete', message: `Successfully imported ${result.groupCount} groups with ${result.guestCount} guests!` })
      } else {
        // Guests mode: Create guests and auto-create groups as needed
        const guestsData = csvData.map(row => {
          const guest: Record<string, string | string[]> = {}
          
          Object.entries(columnMapping).forEach(([csvIndex, dbField]) => {
            const value = row[parseInt(csvIndex)] || ''
            
            if (dbField === 'tags' || dbField === 'invitedBy') {
              guest[dbField] = value.split(',').map(t => t.trim()).filter(t => t)
            } else if (dbField === 'confirmationStatus') {
              const statusLower = value.toLowerCase().trim()
              if (statusLower === 'confirmed' || statusLower === 'yes' || statusLower === 'attending') {
                guest[dbField] = 'confirmed'
              } else if (statusLower === 'declined' || statusLower === 'no' || statusLower === 'not attending') {
                guest[dbField] = 'declined'
              } else {
                guest[dbField] = 'pending'
              }
            } else {
              guest[dbField] = value
            }
          })
          
          return guest
        }).filter(guest => guest.name && (guest.name as string).trim() && guest.groupName && (guest.groupName as string).trim())
        
        if (guestsData.length === 0) {
          setCsvImportError("No valid guests found in CSV. Make sure both Name and Group Name columns have values.")
          setCsvImporting(false)
          return
        }
        
        // Create guests with auto-group creation via API
        const response = await fetch("/api/guests/bulk-with-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingId,
            guests: guestsData,
          }),
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          setCsvImportError(result.error || "Failed to import guests")
          setCsvImporting(false)
          return
        }
        
        // Success
        await fetchGuestGroups()
        await fetchUngroupedGuests()
        
        setShowCsvImportModal(false)
        setCsvData([])
        setCsvHeaders([])
        setColumnMapping({})
        setNotification({ isOpen: true, type: 'success', title: 'Import Complete', message: `Successfully imported ${result.guestCount} guests into ${result.groupCount} groups!` })
      }
    } catch {
      setCsvImportError("Failed to import. Please try again.")
    } finally {
      setCsvImporting(false)
    }
  }

  const resetCsvImport = () => {
    setShowCsvImportModal(false)
    setCsvImportMode('guests')
    setCsvData([])
    setCsvHeaders([])
    setColumnMapping({})
    setCsvImportError(null)
  }

  const handleExportCsv = () => {
    // Gather all guests from groups and ungrouped
    const allGuestsForExport: Array<{
      groupName: string
      name: string
      phone: string
      status: string
      tags: string
      invitedBy: string
      dietaryRestrictions: string
      notes: string
    }> = []

    // Add guests from groups
    guestGroups.forEach(group => {
      group.guests.forEach(guest => {
        allGuestsForExport.push({
          groupName: group.name,
          name: guest.name,
          phone: guest.phone_number || '',
          status: guest.confirmation_status,
          tags: (guest.tags || []).join(', '),
          invitedBy: (guest.invited_by || []).join(', '),
          dietaryRestrictions: guest.dietary_restrictions || '',
          notes: guest.notes || '',
        })
      })
    })

    // Add ungrouped guests (legacy)
    ungroupedGuests.forEach(guest => {
      allGuestsForExport.push({
        groupName: '(No Group)',
        name: guest.name,
        phone: guest.phone_number || '',
        status: guest.confirmation_status,
        tags: (guest.tags || []).join(', '),
        invitedBy: (guest.invited_by || []).join(', '),
        dietaryRestrictions: guest.dietary_restrictions || '',
        notes: guest.notes || '',
      })
    })

    // Create CSV content
    const headers = ['Group Name', 'Guest Name', 'Phone', 'Status', 'Tags', 'Invited By', 'Dietary Restrictions', 'Notes']
    const escapeForCsv = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.join(','),
      ...allGuestsForExport.map(guest => [
        escapeForCsv(guest.groupName),
        escapeForCsv(guest.name),
        escapeForCsv(guest.phone),
        escapeForCsv(guest.status),
        escapeForCsv(guest.tags),
        escapeForCsv(guest.invitedBy),
        escapeForCsv(guest.dietaryRestrictions),
        escapeForCsv(guest.notes),
      ].join(','))
    ].join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `guests-${weddingId}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setAddDropdownOpen(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "declined":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-amber-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border border-green-200"
      case "declined":
        return "bg-red-100 text-red-700 border border-red-200"
      case "pending":
      default:
        return "bg-amber-100 text-amber-700 border border-amber-200"
    }
  }

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default
  }

  // Calculate stats (including ungrouped guests) - TOTAL counts (unfiltered)
  const groupedGuestsCount = guestGroups.reduce((acc, group) => acc + group.guests.length, 0)
  const totalGuests = groupedGuestsCount + ungroupedGuests.length
  const totalConfirmedGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "confirmed").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "confirmed").length
  const totalDeclinedGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "declined").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "declined").length
  const totalPendingGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "pending").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "pending").length

  // Get all unique tags from groups AND individual guests
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    guestGroups.forEach(group => {
      group.tags?.forEach(tag => tags.add(tag))
      // Also include tags from individual guests within groups
      group.guests?.forEach(guest => {
        guest.tags?.forEach(tag => tags.add(tag))
      })
    })
    // Include tags from ungrouped guests
    ungroupedGuests.forEach(guest => {
      guest.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [guestGroups, ungroupedGuests])

  // Chart data: Status by Invited By
  const statusByInvitedByData = useMemo(() => {
    const dataMap: Record<string, { name: string; confirmed: number; pending: number; declined: number }> = {}
    
    // Process all guests from groups
    guestGroups.forEach(group => {
      group.guests.forEach(guest => {
        // Use guest's invited_by, or group's invited_by if guest doesn't have one
        const invitedByList = (guest.invited_by?.length > 0 ? guest.invited_by : group.invited_by) || []
        
        if (invitedByList.length === 0) {
          // Track as "Not specified"
          if (!dataMap['Not specified']) {
            dataMap['Not specified'] = { name: 'Not specified', confirmed: 0, pending: 0, declined: 0 }
          }
          if (guest.confirmation_status === 'confirmed') dataMap['Not specified'].confirmed++
          else if (guest.confirmation_status === 'declined') dataMap['Not specified'].declined++
          else dataMap['Not specified'].pending++
        } else {
          invitedByList.forEach(inviter => {
            if (!dataMap[inviter]) {
              dataMap[inviter] = { name: inviter, confirmed: 0, pending: 0, declined: 0 }
            }
            if (guest.confirmation_status === 'confirmed') dataMap[inviter].confirmed++
            else if (guest.confirmation_status === 'declined') dataMap[inviter].declined++
            else dataMap[inviter].pending++
          })
        }
      })
    })
    
    // Process ungrouped guests
    ungroupedGuests.forEach(guest => {
      const invitedByList = guest.invited_by || []
      
      if (invitedByList.length === 0) {
        if (!dataMap['Not specified']) {
          dataMap['Not specified'] = { name: 'Not specified', confirmed: 0, pending: 0, declined: 0 }
        }
        if (guest.confirmation_status === 'confirmed') dataMap['Not specified'].confirmed++
        else if (guest.confirmation_status === 'declined') dataMap['Not specified'].declined++
        else dataMap['Not specified'].pending++
      } else {
        invitedByList.forEach(inviter => {
          if (!dataMap[inviter]) {
            dataMap[inviter] = { name: inviter, confirmed: 0, pending: 0, declined: 0 }
          }
          if (guest.confirmation_status === 'confirmed') dataMap[inviter].confirmed++
          else if (guest.confirmation_status === 'declined') dataMap[inviter].declined++
          else dataMap[inviter].pending++
        })
      }
    })
    
    return Object.values(dataMap)
  }, [guestGroups, ungroupedGuests])

  // Chart data: Tags by Invited By (for pie chart)
  const tagsByInvitedByData = useMemo(() => {
    const dataMap: Record<string, number> = {}
    
    // Process all guests from groups
    guestGroups.forEach(group => {
      group.guests.forEach(guest => {
        // Merge group tags with guest tags
        const allGuestTags = [...new Set([...(group.tags || []), ...(guest.tags || [])])]
        
        allGuestTags.forEach(tag => {
          if (!dataMap[tag]) {
            dataMap[tag] = 0
          }
          dataMap[tag]++
        })
      })
    })
    
    // Process ungrouped guests
    ungroupedGuests.forEach(guest => {
      const guestTags = guest.tags || []
      guestTags.forEach(tag => {
        if (!dataMap[tag]) {
          dataMap[tag] = 0
        }
        dataMap[tag]++
      })
    })
    
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }))
  }, [guestGroups, ungroupedGuests])

  // Pie chart colors
  const PIE_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#6366f1']

  // Create a flat list of all guests with their group info and merged tags
  const allGuests = useMemo(() => {
    const guests: (Guest & { groupName?: string; groupTags?: string[]; allTags: string[] })[] = []
    
    // Add guests from groups
    guestGroups.forEach(group => {
      group.guests.forEach(guest => {
        // Merge group tags with guest's own tags (unique)
        const mergedTags = [...new Set([...(group.tags || []), ...(guest.tags || [])])]
        guests.push({
          ...guest,
          groupName: group.name,
          groupTags: group.tags || [],
          allTags: mergedTags
        })
      })
    })
    
    // Add ungrouped guests
    ungroupedGuests.forEach(guest => {
      guests.push({
        ...guest,
        groupName: undefined,
        groupTags: [],
        allTags: guest.tags || []
      })
    })
    
    return guests
  }, [guestGroups, ungroupedGuests])

  // Filter and sort guests based on current filters
  const filteredGuests = useMemo(() => {
    let filtered = allGuests.filter(guest => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = guest.name.toLowerCase().includes(query)
        const matchesPhone = guest.phone_number?.toLowerCase().includes(query)
        const matchesGroup = guest.groupName?.toLowerCase().includes(query)
        if (!matchesName && !matchesPhone && !matchesGroup) return false
      }
      
      // Status filter
      if (statusFilter !== 'all' && guest.confirmation_status !== statusFilter) {
        return false
      }
      
      // Tag filter - check merged tags (group + guest tags)
      if (tagFilter !== 'all') {
        if (!guest.allTags?.includes(tagFilter)) return false
      }
      
      // Group filter
      if (groupFilter !== 'all') {
        if (groupFilter === 'ungrouped') {
          if (guest.guest_group_id) return false
        } else {
          if (guest.guest_group_id !== groupFilter) return false
        }
      }
      
      // Invited by filter
      if (invitedByFilter !== 'all') {
        if (!guest.invited_by?.includes(invitedByFilter)) return false
      }
      
      return true
    })
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string
        let bValue: string
        
        if (sortColumn === 'name') {
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
        } else if (sortColumn === 'group') {
          aValue = (a.groupName || '').toLowerCase()
          bValue = (b.groupName || '').toLowerCase()
        } else if (sortColumn === 'status') {
          aValue = a.confirmation_status
          bValue = b.confirmation_status
        } else {
          return 0
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    
    return filtered
  }, [allGuests, searchQuery, statusFilter, tagFilter, groupFilter, invitedByFilter, sortColumn, sortDirection])

  // Filter and sort groups based on current filters (for groups view)
  const filteredGroups = useMemo(() => {
    let filtered = guestGroups.filter(group => {
      // Search filter - search in group name and guest names
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesGroupName = group.name.toLowerCase().includes(query)
        const matchesGuestName = group.guests.some(g => g.name.toLowerCase().includes(query))
        if (!matchesGroupName && !matchesGuestName) return false
      }
      
      // Status filter - check if any guest in group matches status
      if (statusFilter !== 'all') {
        const hasMatchingStatus = group.guests.some(g => g.confirmation_status === statusFilter)
        if (!hasMatchingStatus) return false
      }
      
      // Tag filter - check group tags or any guest tags
      if (tagFilter !== 'all') {
        const groupHasTag = group.tags?.includes(tagFilter)
        const guestsHaveTag = group.guests.some(g => g.tags?.includes(tagFilter))
        if (!groupHasTag && !guestsHaveTag) return false
      }
      
      // Invited by filter - check group invited_by or any guest invited_by
      if (invitedByFilter !== 'all') {
        const groupHasInvitedBy = group.invited_by?.includes(invitedByFilter)
        const guestsHaveInvitedBy = group.guests.some(g => g.invited_by?.includes(invitedByFilter))
        if (!groupHasInvitedBy && !guestsHaveInvitedBy) return false
      }
      
      // Opened filter - check if group has been opened
      if (openedFilter !== 'all') {
        const isOpened = group.open_count > 0
        if (openedFilter === 'opened' && !isOpened) return false
        if (openedFilter === 'not-opened' && isOpened) return false
      }
      
      return true
    })
    
    // Apply sorting
    if (sortColumn === 'name') {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a.name.toLowerCase()
        const bValue = b.name.toLowerCase()
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    
    return filtered
  }, [guestGroups, searchQuery, statusFilter, tagFilter, invitedByFilter, openedFilter, sortColumn, sortDirection])
  
  // Calculate filtered statistics based on filtered guests
  const filteredGuestCount = filteredGuests.length
  const filteredConfirmedGuests = filteredGuests.filter(g => g.confirmation_status === 'confirmed').length
  const filteredDeclinedGuests = filteredGuests.filter(g => g.confirmation_status === 'declined').length
  const filteredPendingGuests = filteredGuests.filter(g => g.confirmation_status === 'pending').length
  
  // Use filtered stats if any filters are active
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || groupFilter !== 'all' || invitedByFilter !== 'all' || openedFilter !== 'all'
  const displayedGuestCount = hasActiveFilters ? filteredGuestCount : totalGuests
  const confirmedGuests = hasActiveFilters ? filteredConfirmedGuests : totalConfirmedGuests
  const declinedGuests = hasActiveFilters ? filteredDeclinedGuests : totalDeclinedGuests
  const pendingGuests = hasActiveFilters ? filteredPendingGuests : totalPendingGuests

  // Sort handler
  const handleSort = (column: 'name' | 'group' | 'status') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, start with ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  if (loading || subscriptionLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={getCleanAdminUrl(weddingId, 'dashboard')}
          title="Invitations"
        />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    )
  }

  // Check if user has access to invitations feature
  if (!canAccessFeature('invitations_panel_enabled')) {
    return (
      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={getCleanAdminUrl(weddingId, 'dashboard')}
          title="Invitations"
        />
        <div className="max-w-2xl mx-auto px-4 py-20">
          <PremiumUpgradePrompt 
            feature="invitations_panel_enabled"
            title="Upgrade to Manage Guests & Invitations"
            description="Guest management, invitations, and RSVP tracking are premium features. Upgrade to Premium to manage your guest list, send invitations, and track RSVPs."
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={getCleanAdminUrl(weddingId, 'dashboard')}
        title="Invitations"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Header with Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invitations & Guests</h1>
            <p className="text-sm text-muted-foreground">Manage your guest groups and track confirmations</p>
          </div>
          {/* Stats and Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Stats Pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {hasActiveFilters ? `${filteredGroups.length}/` : ''}{guestGroups.length} groups
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                <span className="text-foreground font-semibold">{displayedGuestCount}</span>
                <span className="text-muted-foreground">guests{hasActiveFilters && totalGuests !== displayedGuestCount ? ` of ${totalGuests}` : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-green-600">{confirmedGuests}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-600">{pendingGuests}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-600">{declinedGuests}</span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Add Actions Dropdown */}
              <DropdownMenu open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedGroupId(null)
                    setShowAddGuestModal(true)
                    setAddDropdownOpen(false)
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Guest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setShowAddGroupModal(true)
                    setAddDropdownOpen(false)
                  }}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add Group
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault()
                      setAddDropdownOpen(false)
                      // Small delay to ensure dropdown closes before file picker opens
                      setTimeout(() => {
                        document.getElementById('csv-import-input')?.click()
                      }, 100)
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCsv}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Hidden file input for CSV import */}
              <input
                id="csv-import-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFileSelect}
              />
              <Button 
                variant="outline"
                size="sm" 
                className="h-8" 
                onClick={() => setShowInviteTemplateModal(true)}
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Invite Settings
              </Button>
              <Button 
                size="sm" 
                className="h-8 bg-blue-600 hover:bg-blue-700" 
                onClick={() => setShowSendInvitesModal(true)}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Invites
              </Button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {(statusByInvitedByData.length > 0 || tagsByInvitedByData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Status by Invited By - Stacked Bar Chart */}
            {statusByInvitedByData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Guest Status by Invited By</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusByInvitedByData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80} 
                        tick={{ fontSize: 11 }} 
                        tickLine={false}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px' }}
                        iconSize={10}
                      />
                      <Bar dataKey="confirmed" stackId="a" fill="#22c55e" name="Confirmed" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="declined" stackId="a" fill="#ef4444" name="Declined" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Tags Distribution - Pie Chart */}
            {tagsByInvitedByData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Guest Distribution by Tag</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagsByInvitedByData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {tagsByInvitedByData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value} guests`, 'Count']}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px' }}
                        iconSize={10}
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Confirmation Timeline Chart */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-medium text-foreground">Confirmation Timeline</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Range Filter */}
              <div className="flex items-center border rounded-lg bg-muted/30 p-0.5">
                {(['7d', '14d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimelineRange(range)}
                    className={`px-2 py-1 rounded-md text-xs transition-colors ${
                      timelineRange === range
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {range === 'all' ? 'All' : range === '7d' ? '7 Days' : range === '14d' ? '2 Weeks' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
              {/* Group Filter */}
              <select
                value={timelineGroupFilter}
                onChange={(e) => setTimelineGroupFilter(e.target.value)}
                className="h-7 px-2 text-xs border rounded-md bg-background"
              >
                <option value="all">All Groups</option>
                {guestGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>

          {timelineLoading ? (
            <div className="h-[250px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading timeline...</div>
            </div>
          ) : timelineData && timelineData.chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Timeline Chart */}
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData.chartData} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={10} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeConfirmed"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.2}
                      name="Total Confirmed"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeDeclined"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      name="Total Declined"
                    />
                    <Scatter
                      dataKey="confirmed"
                      fill="#22c55e"
                      name="Confirmations"
                    />
                    <Scatter
                      dataKey="declined"
                      fill="#ef4444"
                      name="Declines"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="flex items-center gap-4 text-xs border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Confirmed:</span>
                  <span className="font-medium text-green-600">{timelineData.summary.totalConfirmed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Declined:</span>
                  <span className="font-medium text-red-600">{timelineData.summary.totalDeclined}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Opens:</span>
                  <span className="font-medium text-blue-600">{timelineData.summary.totalOpens}</span>
                </div>
              </div>

              {/* Recent Events */}
              {timelineData.confirmationEvents.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Confirmations</h4>
                  <div className="flex flex-wrap gap-2">
                    {timelineData.confirmationEvents.slice(0, 8).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => router.push(getCleanAdminUrl(weddingId, `groups/${event.groupId}`))}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors hover:bg-muted/50 ${
                          event.type === 'confirmed'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : event.type === 'declined'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}
                      >
                        {event.type === 'confirmed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : event.type === 'declined' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="font-medium">{event.groupName}</span>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                    {timelineData.confirmationEvents.length > 8 && (
                      <span className="text-xs text-muted-foreground py-1">
                        +{timelineData.confirmationEvents.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
              No confirmation activity yet in this time range
            </div>
          )}
        </Card>

        {/* Toolbar: View Toggle, Filters, and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          {/* Left: View Toggle and Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle - 2 options */}
            <div className="flex items-center border rounded-lg bg-muted/30 p-0.5">
              <button
                onClick={() => setViewMode('groups')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                  viewMode === 'groups' 
                    ? 'bg-background text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Groups table"
              >
                <Users2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Groups</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                  viewMode === 'flat' 
                    ? 'bg-background text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Flat guest list"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guests</span>
              </button>
            </div>

            {/* Inline Filters */}
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 w-36 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="all">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {viewMode === 'flat' && (
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="all">All Groups</option>
                    <option value="ungrouped">Ungrouped</option>
                    {guestGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                )}
                <select
                  value={invitedByFilter}
                  onChange={(e) => setInvitedByFilter(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="all">All Invited By</option>
                  {partnerOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <select
                  value={openedFilter}
                  onChange={(e) => setOpenedFilter(e.target.value as typeof openedFilter)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="all">All Opens</option>
                  <option value="opened">Opened</option>
                  <option value="not-opened">Not Opened</option>
                </select>
                {(searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || groupFilter !== 'all' || invitedByFilter !== 'all' || openedFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-2"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setTagFilter('all')
                      setGroupFilter('all')
                      setInvitedByFilter('all')
                      setOpenedFilter('all')
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {viewMode === 'groups' 
                    ? `${filteredGroups.length}/${guestGroups.length} groups`
                    : `${filteredGuests.length}/${totalGuests} guests`
                  }
                </span>
              </>

            {/* Column Visibility Menu - Available in both views */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
              >
                <Columns className="w-3.5 h-3.5 mr-1" />
                Columns
              </Button>
              {showColumnMenu && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 min-w-[140px]">
                  {(['phone', 'group', 'tags', 'status', 'invitedBy', 'inviteSent', 'travelInfo'] as const).map((key) => (
                    <button
                      key={key}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"
                      onClick={() => toggleColumn(key)}
                    >
                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${visibleColumns[key] ? 'bg-primary border-primary' : 'border-border'}`}>
                        {visibleColumns[key] && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="capitalize">
                        {key === 'inviteSent' ? 'Invite Sent' : 
                         key === 'invitedBy' ? 'Invited By' : 
                         key === 'travelInfo' ? 'Travel Info' :
                         key}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Actions - Show when guests are selected in either view */}
            {selectedGuestIds.size > 0 && (
              <>
                <div className="h-5 w-px bg-border mx-1" />
                <span className="text-xs font-medium text-foreground">
                  {selectedGuestIds.size} selected
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleBulkStatusUpdate('confirmed')}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => handleBulkStatusUpdate('pending')}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleBulkStatusUpdate('declined')}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Decline
                  </Button>
                </div>
                <div className="h-5 w-px bg-border mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAssignGroupModal(true)}
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  Assign Group
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    // Get first selected guest to pre-populate travel info if single selection
                    const selectedGuests = allGuests.filter(g => selectedGuestIds.has(g.id))
                    const firstGuest = selectedGuests[0]
                    setGroupTravelForm({
                      groupId: '', // Bulk action, not specific to a group
                      groupName: `${selectedGuests.length} Selected Guest${selectedGuests.length !== 1 ? 's' : ''}`,
                      isTraveling: firstGuest?.is_traveling || false,
                      travelingFrom: firstGuest?.traveling_from || "",
                      travelArrangement: firstGuest?.travel_arrangement || null,
                      noTicketReason: firstGuest?.no_ticket_reason || "",
                    })
                    setShowGroupTravelDialog(true)
                  }}
                >
                  <Plane className="w-3 h-3 mr-1" />
                  Travel Info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => {
                    // Get the common invited_by values from all selected guests
                    const selectedGuests = allGuests.filter(g => selectedGuestIds.has(g.id))
                    if (selectedGuests.length === 1) {
                      // Single guest: pre-populate with their current invited_by
                      setBulkInvitedBy(selectedGuests[0].invited_by || [])
                    } else if (selectedGuests.length > 1) {
                      // Multiple guests: find common invited_by values
                      const firstInvitedBy = new Set(selectedGuests[0].invited_by || [])
                      const commonInvitedBy = [...firstInvitedBy].filter(name =>
                        selectedGuests.every(g => (g.invited_by || []).includes(name))
                      )
                      setBulkInvitedBy(commonInvitedBy)
                    } else {
                      setBulkInvitedBy([])
                    }
                    setShowBulkInvitedByModal(true)
                  }}
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Invited By
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={clearSelection}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Flat View - All Guests Table */}
        {viewMode === 'flat' && (
          <Card className="border border-border overflow-hidden shadow-sm">
            {filteredGuests.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No guests found</h3>
                <p className="text-muted-foreground">
                  {totalGuests === 0 ? "Add your first guest to get started" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-2 py-2 text-left w-8">
                        <button
                          onClick={toggleSelectAll}
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0
                              ? 'bg-primary border-primary' 
                              : selectedGuestIds.size > 0
                              ? 'bg-primary/50 border-primary'
                              : 'border-border'
                          }`}
                        >
                          {selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0 && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                          {selectedGuestIds.size > 0 && selectedGuestIds.size < filteredGuests.length && (
                            <div className="w-2 h-0.5 bg-primary-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                        >
                          Name
                          {sortColumn === 'name' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </button>
                      </th>
                      {visibleColumns.phone && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Phone
                        </th>
                      )}
                      {visibleColumns.group && (
                        <th className="px-3 py-2 text-left">
                          <button
                            onClick={() => handleSort('group')}
                            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                          >
                            Group
                            {sortColumn === 'group' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </button>
                        </th>
                      )}
                      {visibleColumns.tags && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Tags
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th className="px-3 py-2 text-left">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                          >
                            Status
                            {sortColumn === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </button>
                        </th>
                      )}
                      {visibleColumns.dietary && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Dietary
                        </th>
                      )}
                      {visibleColumns.invitedBy && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Invited By
                        </th>
                      )}
                      {visibleColumns.inviteSent && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Invite
                        </th>
                      )}
                      {visibleColumns.travelInfo && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Travel Info
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest, index) => (
                      <tr
                        key={guest.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        } ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleGuestSelection(guest.id)}
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                            }`}
                          >
                            {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">{guest.name}</td>
                        {visibleColumns.phone && (
                          <td className="px-3 py-2 text-muted-foreground">{guest.phone_number || "-"}</td>
                        )}
                        {visibleColumns.group && (
                          <td className="px-3 py-2 text-muted-foreground">
                            {guest.groupName || <span className="italic text-muted-foreground/50">Ungrouped</span>}
                          </td>
                        )}
                        {visibleColumns.tags && (
                          <td className="px-3 py-2">
                            <div className="flex gap-1 flex-wrap">
                              {guest.allTags?.map(tag => (
                                <span
                                  key={tag}
                                  className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {(!guest.allTags || guest.allTags.length === 0) && "-"}
                            </div>
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-3 py-2">
                            <select
                              value={guest.confirmation_status}
                              onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="declined">Declined</option>
                            </select>
                          </td>
                        )}
                        {visibleColumns.dietary && (
                          <td className="px-3 py-2 text-muted-foreground">
                            {guest.dietary_restrictions || "-"}
                          </td>
                        )}
                        {visibleColumns.invitedBy && (
                          <td className="px-3 py-2">
                            {guest.invited_by && guest.invited_by.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {guest.invited_by.map(name => (
                                  <span
                                    key={name}
                                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.inviteSent && (
                          <td className="px-3 py-2 text-center">
                            {guest.invitation_sent ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateGuestInvitationStatus(guest.id, false)
                                }}
                                className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 cursor-pointer transition-colors"
                                title="Click to mark as not sent"
                              >
                                <MailCheck className="w-3.5 h-3.5" />
                                Sent
                              </button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => handleSendGuestInvite(guest)}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send
                              </Button>
                            )}
                          </td>
                        )}
                        {visibleColumns.travelInfo && (
                          <td className="px-3 py-2">
                            {guest.confirmation_status === 'confirmed' && guest.is_traveling ? (
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                        <Plane className="w-3 h-3 text-blue-700" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Guest is traveling{guest.traveling_from ? ` from ${guest.traveling_from}` : ''}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {guest.travel_arrangement === 'will_buy_ticket' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                          <Ticket className="w-3 h-3 text-blue-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Travel arrangement: Will purchase ticket</p>
                                        <p className="text-xs opacity-80">(verification required)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {guest.travel_arrangement === 'no_ticket_needed' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                          <X className="w-3 h-3 text-purple-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Travel arrangement: No ticket needed</p>
                                        {guest.no_ticket_reason && <p className="text-xs opacity-80 mt-1">{guest.no_ticket_reason}</p>}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {guest.ticket_attachment_url && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                          <Check className="w-3 h-3 text-green-700" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Travel ticket uploaded and verified</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditGuest(guest)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteGuest(guest.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Groups Table View with Expandable Rows */}
        {viewMode === 'groups' && (
          <Card className="border border-border overflow-hidden shadow-sm">
            {filteredGroups.length === 0 && ungroupedGuests.length === 0 ? (
              <div className="p-12 text-center">
                <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No groups found</h3>
                <p className="text-muted-foreground">
                  {guestGroups.length === 0 ? "Create your first group to get started" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-2 py-2 w-8"></th>
                      <th className="px-2 py-2 w-8"></th>
                      <th className="px-3 py-2 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                        >
                          Group Name
                          {sortColumn === 'name' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Guests
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Confirmed
                        </span>
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Declined
                        </span>
                      </th>
                      {visibleColumns.tags && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Tags
                        </th>
                      )}
                      {visibleColumns.invitedBy && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Invited By
                        </th>
                      )}
                      {visibleColumns.inviteSent && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Invite
                        </th>
                      )}
                      {visibleColumns.travelInfo && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Travel Info
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group, index) => {
                      const confirmedCount = group.guests.filter(g => g.confirmation_status === 'confirmed').length
                      const pendingCount = group.guests.filter(g => g.confirmation_status === 'pending').length
                      const declinedCount = group.guests.filter(g => g.confirmation_status === 'declined').length
                      const allGroupTags = [...new Set([
                        ...(group.tags || []),
                        ...group.guests.flatMap(g => g.tags || [])
                      ])]
                      const allGroupInvitedBy = [...new Set([
                        ...(group.invited_by || []),
                        ...group.guests.flatMap(g => g.invited_by || [])
                      ])]
                      const allGuestsInvited = group.guests.length > 0 && group.guests.every(g => g.invitation_sent)
                      const someGuestsInvited = group.guests.some(g => g.invitation_sent)
                      const isExpanded = expandedGroups.has(group.id)

                      return (
                        <React.Fragment key={group.id}>
                          {/* Group Row */}
                          <tr
                            className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                              index % 2 === 0 ? "bg-background" : "bg-muted/10"
                            } ${isExpanded ? "bg-muted/40" : ""} ${isGroupFullySelected(group.guests) ? "bg-primary/5" : ""}`}
                            onClick={() => toggleGroupExpansion(group.id)}
                          >
                            <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleSelectGroup(group.guests)}
                                className={`w-4 h-4 border rounded flex items-center justify-center ${
                                  isGroupFullySelected(group.guests)
                                    ? 'bg-primary border-primary'
                                    : isGroupPartiallySelected(group.guests)
                                      ? 'bg-primary/50 border-primary'
                                      : 'border-border'
                                }`}
                              >
                                {isGroupFullySelected(group.guests) && <Check className="w-3 h-3 text-primary-foreground" />}
                                {isGroupPartiallySelected(group.guests) && <div className="w-2 h-0.5 bg-primary-foreground" />}
                              </button>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{group.name}</span>
                                  {/* Opened indicator */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                          group.open_count > 0 
                                            ? 'bg-blue-100 border border-blue-200' 
                                            : 'bg-gray-100 border border-gray-200'
                                        }`}>
                                          {group.open_count > 0 ? (
                                            <Eye className="w-3 h-3 text-blue-600" />
                                          ) : (
                                            <EyeOff className="w-3 h-3 text-gray-400" />
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {group.open_count > 0 ? (
                                          <>
                                            <p>Opened {group.open_count} time{group.open_count > 1 ? 's' : ''}</p>
                                            {group.first_opened_at && (
                                              <p className="text-xs opacity-80">
                                                First opened: {new Date(group.first_opened_at).toLocaleDateString()}
                                              </p>
                                            )}
                                          </>
                                        ) : (
                                          <p>Not opened yet</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {group.message && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setSelectedGroupForMessage(group)
                                              setShowMessageModal(true)
                                            }}
                                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-200 cursor-pointer transition-colors"
                                          >
                                            <Mail className="w-3 h-3 text-blue-700" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Has message - click to view</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                {group.phone_number && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    {group.phone_number}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                                {group.guests.length}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {confirmedCount > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                  {confirmedCount}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {pendingCount > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                  {pendingCount}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {declinedCount > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                  {declinedCount}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            {visibleColumns.tags && (
                              <td className="px-3 py-2">
                                <div className="flex gap-1 flex-wrap">
                                  {allGroupTags.slice(0, 3).map(tag => (
                                    <span
                                      key={tag}
                                      className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {allGroupTags.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                                      +{allGroupTags.length - 3}
                                    </span>
                                  )}
                                  {allGroupTags.length === 0 && "-"}
                                </div>
                              </td>
                            )}
                            {visibleColumns.invitedBy && (
                              <td className="px-3 py-2">
                                {allGroupInvitedBy.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {allGroupInvitedBy.map(name => (
                                      <span
                                        key={name}
                                        className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            )}
                            {visibleColumns.inviteSent && (
                              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  {/* Status Indicator - Clickable to toggle */}
                                  {allGuestsInvited ? (
                                    <button
                                      onClick={() => updateGroupInvitationStatus(group.id, false)}
                                      className="hover:opacity-70 transition-opacity"
                                      title="Click to mark as not sent"
                                    >
                                      <MailCheck className="w-3.5 h-3.5 text-green-600" />
                                    </button>
                                  ) : someGuestsInvited ? (
                                    <button
                                      onClick={() => updateGroupInvitationStatus(group.id, true)}
                                      className="hover:opacity-70 transition-opacity"
                                      title="Click to mark as sent"
                                    >
                                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                                    </button>
                                  ) : (
                                    <span title="No invites sent">
                                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    </span>
                                  )}
                                  
                                  <div className="w-px h-4 bg-border" />
                                  
                                  {/* Action Buttons */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const rsvpUrl = getInvitationUrl(group.id)
                                      window.open(rsvpUrl, '_blank')
                                    }}
                                    title="Open RSVP page"
                                  >
                                    <Link className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyRSVPLink(group)
                                    }}
                                    title="Copy RSVP link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                  {!allGuestsInvited && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSendGroupInvite(group)
                                      }}
                                      title="Send invite"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                            {visibleColumns.travelInfo && (
                              <td className="px-3 py-2">
                                {(() => {
                                  const travelingGuests = group.guests.filter(g => g.is_traveling)
                                  if (travelingGuests.length === 0) {
                                    return <span className="text-muted-foreground text-[10px]">-</span>
                                  }
                                  
                                  const willBuyTicket = travelingGuests.some(g => g.travel_arrangement === 'will_buy_ticket')
                                  const noTicketNeeded = travelingGuests.some(g => g.travel_arrangement === 'no_ticket_needed')
                                  const hasTicketUploaded = travelingGuests.some(g => g.ticket_attachment_url)
                                  
                                  return (
                                    <TooltipProvider>
                                      <div className="flex items-center gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                              <Plane className="w-3 h-3 text-blue-700" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{travelingGuests.length} guest{travelingGuests.length > 1 ? 's' : ''} traveling</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        {willBuyTicket && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                                <Ticket className="w-3 h-3 text-blue-700" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Some guests will purchase tickets</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {noTicketNeeded && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                                <X className="w-3 h-3 text-purple-700" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Some guests don't need tickets</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {hasTicketUploaded && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                                <Check className="w-3 h-3 text-green-700" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Some guests have uploaded tickets</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </TooltipProvider>
                                  )
                                })()}
                              </td>
                            )}
                            <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(getCleanAdminUrl(weddingId, `groups/${group.id}`))}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyRSVPLink(group)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy RSVP Link
                                  </DropdownMenuItem>
                                  {group.message && (
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedGroupForMessage(group)
                                      setShowMessageModal(true)
                                    }}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      View Message
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openAddGuestToGroup(group.id)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Guest
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditGroup(group)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Group
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleGroupStatusUpdate(group, 'confirmed')}
                                    className="text-green-600"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Confirm All
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleGroupStatusUpdate(group, 'pending')}
                                    className="text-amber-600"
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Set All Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleGroupStatusUpdate(group, 'declined')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Decline All
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openGroupTravelDialog(group)}>
                                    <Plane className="w-4 h-4 mr-2" />
                                    Set Travel Info
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!allGuestsInvited && (
                                    <DropdownMenuItem onClick={() => handleSendGroupInvite(group)}>
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Invites
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Group
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>

                          {/* Expanded Guest Rows */}
                          {isExpanded && (
                            <>
                              {group.guests.length === 0 ? (
                                <tr className="bg-muted/20">
                                  <td colSpan={11} className="px-8 py-4 text-center text-muted-foreground">
                                    <p className="mb-2">No guests in this group</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openAddGuestToGroup(group.id)
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Guest
                                    </Button>
                                  </td>
                                </tr>
                              ) : (
                                group.guests.map((guest) => (
                                  <tr
                                    key={guest.id}
                                    className={`border-b border-border bg-muted/20 hover:bg-muted/40 transition-colors ${
                                      selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""
                                    }`}
                                  >
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        onClick={() => toggleGuestSelection(guest.id)}
                                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                                          selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                                        }`}
                                      >
                                        {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                                      </button>
                                    </td>
                                    <td className="px-2 py-2"></td>
                                    <td className="px-3 py-2 pl-4">
                                      <span className="text-foreground">{guest.name}</span>
                                    </td>
                                    <td className="px-3 py-2 text-center text-muted-foreground text-xs">
                                      {guest.phone_number || "-"}
                                    </td>
                                    <td colSpan={3} className="px-3 py-2 text-center">
                                      <select
                                        value={guest.confirmation_status}
                                        onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="declined">Declined</option>
                                      </select>
                                    </td>
                                    {visibleColumns.tags && (
                                      <td className="px-3 py-2">
                                        <div className="flex gap-1 flex-wrap">
                                          {guest.tags?.map(tag => (
                                            <span
                                              key={tag}
                                              className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                          {(!guest.tags || guest.tags.length === 0) && "-"}
                                        </div>
                                      </td>
                                    )}
                                    {visibleColumns.invitedBy && (
                                      <td className="px-3 py-2">
                                        {guest.invited_by && guest.invited_by.length > 0 ? (
                                          <div className="flex gap-1 flex-wrap">
                                            {guest.invited_by.map(name => (
                                              <span
                                                key={name}
                                                className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                              >
                                                {name}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </td>
                                    )}
                                    {visibleColumns.inviteSent && (
                                      <td className="px-3 py-2 text-center">
                                        {guest.invitation_sent ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              updateGuestInvitationStatus(guest.id, false)
                                            }}
                                            className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 cursor-pointer transition-colors"
                                            title="Click to mark as not sent"
                                          >
                                            <MailCheck className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px]"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleSendGuestInvite(guest)
                                            }}
                                          >
                                            <Send className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </td>
                                    )}
                                    {visibleColumns.travelInfo && (
                                      <td className="px-3 py-2">
                                        {guest.is_traveling ? (
                                          <TooltipProvider>
                                            <div className="flex items-center gap-1">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                                    <Plane className="w-3 h-3 text-blue-700" />
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Guest is traveling{guest.traveling_from ? ` from ${guest.traveling_from}` : ''}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              {guest.travel_arrangement === 'will_buy_ticket' && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                                      <Ticket className="w-3 h-3 text-blue-700" />
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Travel arrangement: Will purchase ticket</p>
                                                    <p className="text-xs opacity-80">(verification required)</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                              {guest.travel_arrangement === 'no_ticket_needed' && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                                      <X className="w-3 h-3 text-purple-700" />
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Travel arrangement: No ticket needed</p>
                                                    {guest.no_ticket_reason && <p className="text-xs opacity-80 mt-1">{guest.no_ticket_reason}</p>}
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                              {guest.ticket_attachment_url && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                                      <Check className="w-3 h-3 text-green-700" />
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Travel ticket uploaded and verified</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                            </div>
                                          </TooltipProvider>
                                        ) : (
                                          <span className="text-muted-foreground text-[10px]">-</span>
                                        )}
                                      </td>
                                    )}
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex justify-end gap-0.5">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openEditGuest(guest)
                                          }}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteGuest(guest.id)
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </>
                          )}
                        </React.Fragment>
                      )
                    })}

                    {/* Ungrouped Guests Section */}
                    {ungroupedGuests.length > 0 && (
                      <>
                        <tr
                          className={`border-b border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 transition-colors cursor-pointer ${isGroupFullySelected(ungroupedGuests) ? "bg-primary/5" : ""}`}
                          onClick={() => setShowUngroupedExpanded(!showUngroupedExpanded)}
                        >
                          <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelectGroup(ungroupedGuests)}
                              className={`w-4 h-4 border rounded flex items-center justify-center ${
                                isGroupFullySelected(ungroupedGuests)
                                  ? 'bg-primary border-primary'
                                  : isGroupPartiallySelected(ungroupedGuests)
                                    ? 'bg-primary/50 border-primary'
                                    : 'border-amber-400'
                              }`}
                            >
                              {isGroupFullySelected(ungroupedGuests) && <Check className="w-3 h-3 text-primary-foreground" />}
                              {isGroupPartiallySelected(ungroupedGuests) && <div className="w-2 h-0.5 bg-primary-foreground" />}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {showUngroupedExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-amber-600" />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <div>
                                <div className="font-medium text-amber-800">Ungrouped Guests</div>
                                <div className="text-xs text-amber-600">Legacy - needs group assignment</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              {ungroupedGuests.length}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ungroupedGuests.filter(g => g.confirmation_status === 'confirmed').length > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                {ungroupedGuests.filter(g => g.confirmation_status === 'confirmed').length}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ungroupedGuests.filter(g => g.confirmation_status === 'pending').length > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                {ungroupedGuests.filter(g => g.confirmation_status === 'pending').length}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ungroupedGuests.filter(g => g.confirmation_status === 'declined').length > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                {ungroupedGuests.filter(g => g.confirmation_status === 'declined').length}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          {visibleColumns.tags && <td className="px-3 py-2">-</td>}
                          {visibleColumns.invitedBy && <td className="px-3 py-2">-</td>}
                          {visibleColumns.inviteSent && <td className="px-3 py-2">-</td>}
                          {visibleColumns.travelInfo && <td className="px-3 py-2">-</td>}
                          <td className="px-3 py-2"></td>
                        </tr>
                        {showUngroupedExpanded && ungroupedGuests.map((guest) => (
                          <tr
                            key={guest.id}
                            className={`border-b border-amber-200 bg-amber-50/30 hover:bg-amber-100/30 transition-colors ${
                              selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => toggleGuestSelection(guest.id)}
                                className={`w-4 h-4 border rounded flex items-center justify-center ${
                                  selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                                }`}
                              >
                                {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                              </button>
                            </td>
                            <td className="px-2 py-2"></td>
                            <td className="px-3 py-2 pl-4">
                              <span className="text-foreground">{guest.name}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-muted-foreground text-xs">
                              {guest.phone_number || "-"}
                            </td>
                            <td colSpan={3} className="px-3 py-2 text-center">
                              <select
                                value={guest.confirmation_status}
                                onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="declined">Declined</option>
                              </select>
                            </td>
                            {visibleColumns.tags && (
                              <td className="px-3 py-2">
                                <div className="flex gap-1 flex-wrap">
                                  {guest.tags?.map(tag => (
                                    <span
                                      key={tag}
                                      className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getTagColor(tag)}`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {(!guest.tags || guest.tags.length === 0) && "-"}
                                </div>
                              </td>
                            )}
                            {visibleColumns.invitedBy && (
                              <td className="px-3 py-2">
                                {guest.invited_by && guest.invited_by.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {guest.invited_by.map(name => (
                                      <span
                                        key={name}
                                        className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            )}
                            {visibleColumns.inviteSent && (
                              <td className="px-3 py-2 text-center">
                                {guest.invitation_sent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                                    <MailCheck className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => handleSendGuestInvite(guest)}
                                  >
                                    <Send className="w-3 h-3" />
                                  </Button>
                                )}
                              </td>
                            )}
                            {visibleColumns.travelInfo && (
                              <td className="px-3 py-2">
                                {guest.is_traveling ? (
                                  <TooltipProvider>
                                    <div className="flex items-center gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                            <Plane className="w-3 h-3 text-blue-700" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Guest is traveling{guest.traveling_from ? ` from ${guest.traveling_from}` : ''}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      {guest.travel_arrangement === 'will_buy_ticket' && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-200 cursor-help">
                                              <Ticket className="w-3 h-3 text-blue-700" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Travel arrangement: Will purchase ticket</p>
                                            <p className="text-xs opacity-80">(verification required)</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {guest.travel_arrangement === 'no_ticket_needed' && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 cursor-help">
                                              <X className="w-3 h-3 text-purple-700" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Travel arrangement: No ticket needed</p>
                                            {guest.no_ticket_reason && <p className="text-xs opacity-80 mt-1">{guest.no_ticket_reason}</p>}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {guest.ticket_attachment_url && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-200 cursor-help">
                                              <Check className="w-3 h-3 text-green-700" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Travel ticket uploaded and verified</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">-</span>
                                )}
                              </td>
                            )}
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openEditGuest(guest)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDeleteGuest(guest.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {(showAddGroupModal || editingGroup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <h2 className="text-xl font-semibold text-foreground">
                {editingGroup ? "Edit Group" : "Add Guest Group"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddGroupModal(false)
                  setEditingGroup(null)
                  resetGroupForm()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Group Name *
                </label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g., The Smith Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                {editingGroup && editingGroup.guests && editingGroup.guests.some((g: Guest) => g.phone_number) ? (
                  <select
                    value={groupForm.phoneNumber}
                    onChange={(e) => setGroupForm({ ...groupForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">Select from guest phones or leave empty</option>
                    {editingGroup.guests
                      .filter((g: Guest) => g.phone_number)
                      .map((g: Guest) => (
                        <option key={g.id} value={g.phone_number || ""}>
                          {g.name}: {g.phone_number}
                        </option>
                      ))}
                  </select>
                ) : (
                  <Input
                    value={groupForm.phoneNumber}
                    onChange={(e) => setGroupForm({ ...groupForm, phoneNumber: e.target.value })}
                    placeholder="e.g., +1 555 123 4567"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        groupForm.tags.includes(tag)
                          ? getTagColor(tag)
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <Input
                  value={groupForm.notes}
                  onChange={(e) => setGroupForm({ ...groupForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Invited By
                </label>
                <div className="flex flex-wrap gap-2">
                  {partnerOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setGroupForm(prev => ({
                        ...prev,
                        invitedBy: prev.invitedBy.includes(name)
                          ? prev.invitedBy.filter(n => n !== name)
                          : [...prev.invitedBy, name]
                      }))}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        groupForm.invitedBy.includes(name)
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guests Section - Only show when creating a new group */}
              {!editingGroup && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">
                      Guests ({guestsInGroupModal.length})
                    </label>
                    {!isAddingGuestInModal && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingGuestInModal(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Guest
                      </Button>
                    )}
                  </div>

                  {/* List of added guests */}
                  {guestsInGroupModal.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {guestsInGroupModal.map((guest) => (
                        <div
                          key={guest.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {guest.name}
                            </div>
                            {guest.phoneNumber && (
                              <div className="text-xs text-muted-foreground">
                                {guest.phoneNumber}
                              </div>
                            )}
                            {guest.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {guest.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={() => removeGuestFromGroupModal(guest.id)}
                          >
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add guest form */}
                  {isAddingGuestInModal && (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
                      <div>
                        <Input
                          value={tempGuestForm.name}
                          onChange={(e) =>
                            setTempGuestForm({ ...tempGuestForm, name: e.target.value })
                          }
                          placeholder="Guest name *"
                          autoFocus
                        />
                      </div>

                      <div>
                        <Input
                          value={tempGuestForm.phoneNumber}
                          onChange={(e) =>
                            setTempGuestForm({ ...tempGuestForm, phoneNumber: e.target.value })
                          }
                          placeholder="Phone number (optional)"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                        <div className="flex flex-wrap gap-1">
                          {PREDEFINED_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTempGuestTag(tag)}
                              className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                tempGuestForm.tags.includes(tag)
                                  ? getTagColor(tag)
                                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <select
                          value={tempGuestForm.confirmationStatus}
                          onChange={(e) =>
                            setTempGuestForm({
                              ...tempGuestForm,
                              confirmationStatus: e.target.value as 'pending' | 'confirmed' | 'declined',
                            })
                          }
                          className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      <div>
                        <Input
                          value={tempGuestForm.dietaryRestrictions}
                          onChange={(e) =>
                            setTempGuestForm({
                              ...tempGuestForm,
                              dietaryRestrictions: e.target.value,
                            })
                          }
                          placeholder="Dietary restrictions (optional)"
                          className="text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setIsAddingGuestInModal(false)
                            setTempGuestForm({
                              name: "",
                              phoneNumber: "",
                              tags: [],
                              confirmationStatus: "pending",
                              dietaryRestrictions: "",
                              notes: "",
                            })
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={addGuestToGroupModal}
                          disabled={!tempGuestForm.name.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="flex gap-2 p-6 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddGroupModal(false)
                  setEditingGroup(null)
                  resetGroupForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                disabled={!groupForm.name}
              >
                {editingGroup ? "Update" : "Add"} Group
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add/Edit Guest Modal */}
      {(showAddGuestModal || editingGuest) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <h2 className="text-xl font-semibold text-foreground">
                {editingGuest ? "Edit Guest" : "Add Guest"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddGuestModal(false)
                  setEditingGuest(null)
                  setSelectedGroupId(null)
                  resetGuestForm()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Guest Name *
                </label>
                <Input
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={guestForm.phoneNumber}
                  onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
                  placeholder="+1 555 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Group *
                </label>
                {!isCreatingNewGroup ? (
                  <div className="space-y-2">
                    <select
                      value={selectedGroupId || ""}
                      onChange={(e) => setSelectedGroupId(e.target.value || null)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="">Select a group...</option>
                      {guestGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewGroup(true)
                        setSelectedGroupId(null)
                      }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Create new group
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={newGroupNameForGuest}
                      onChange={(e) => setNewGroupNameForGuest(e.target.value)}
                      placeholder="Enter new group name"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewGroup(false)
                        setNewGroupNameForGuest("")
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Select existing group instead
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  All guests must belong to a group. If no group is selected, one will be created automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleGuestTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        guestForm.tags.includes(tag)
                          ? getTagColor(tag)
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmation Status
                </label>
                <select
                  value={guestForm.confirmationStatus}
                  onChange={(e) => setGuestForm({ ...guestForm, confirmationStatus: e.target.value as 'pending' | 'confirmed' | 'declined' })}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dietary Restrictions
                </label>
                <Input
                  value={guestForm.dietaryRestrictions}
                  onChange={(e) => setGuestForm({ ...guestForm, dietaryRestrictions: e.target.value })}
                  placeholder="e.g., Vegetarian, Gluten-free"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <Input
                  value={guestForm.notes}
                  onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Invited By
                </label>
                <div className="flex flex-wrap gap-2">
                  {partnerOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setGuestForm(prev => ({
                        ...prev,
                        invitedBy: prev.invitedBy.includes(name)
                          ? prev.invitedBy.filter(n => n !== name)
                          : [...prev.invitedBy, name]
                      }))}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        guestForm.invitedBy.includes(name)
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Information Section - Always visible for admin to pre-configure */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Travel Information</h3>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={guestForm.isTraveling}
                    onCheckedChange={(checked) => setGuestForm({ ...guestForm, isTraveling: checked })}
                  />
                  <label className="text-sm font-medium text-foreground">
                    Guest is traveling
                  </label>
                </div>

                  {guestForm.isTraveling && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Traveling From
                        </label>
                        <Input
                          value={guestForm.travelingFrom}
                          onChange={(e) => setGuestForm({ ...guestForm, travelingFrom: e.target.value })}
                          placeholder="City or location"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Travel Arrangement
                        </label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setGuestForm({ ...guestForm, travelArrangement: 'will_buy_ticket' })}
                            className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm text-left ${
                              guestForm.travelArrangement === 'will_buy_ticket'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                          >
                            Will purchase ticket (requires verification)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuestForm({ ...guestForm, travelArrangement: 'no_ticket_needed' })}
                            className={`w-full px-3 py-2 rounded-lg border-2 transition-colors text-sm text-left ${
                              guestForm.travelArrangement === 'no_ticket_needed'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                          >
                            Does not need ticket (requires reason)
                          </button>
                        </div>
                      </div>

                      {guestForm.travelArrangement === 'no_ticket_needed' && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Reason for No Ticket
                          </label>
                          <Input
                            value={guestForm.noTicketReason}
                            onChange={(e) => setGuestForm({ ...guestForm, noTicketReason: e.target.value })}
                            placeholder="e.g., Lives at destination, traveling by car, etc."
                          />
                        </div>
                      )}

                      {guestForm.ticketAttachmentUrl && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">Ticket uploaded</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => window.open(guestForm.ticketAttachmentUrl!, '_blank')}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

            </div>

            <div className="flex gap-2 p-6 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddGuestModal(false)
                  setEditingGuest(null)
                  setSelectedGroupId(null)
                  resetGuestForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
                disabled={!guestForm.name}
              >
                {editingGuest ? "Update" : "Add"} Guest
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Assign to Group Modal */}
      {showAssignGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Assign {selectedGuestIds.size} Guest{selectedGuestIds.size !== 1 ? 's' : ''} to Group
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAssignGroupModal(false)
                  setNewGroupName('')
                  setAssignToGroupId('new')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Group
                </label>
                <select
                  value={assignToGroupId}
                  onChange={(e) => setAssignToGroupId(e.target.value as string | 'new')}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="new">Create New Group</option>
                  {guestGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.guests.length} guests)
                    </option>
                  ))}
                </select>
              </div>

              {assignToGroupId === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Group Name *
                  </label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., The Smith Family"
                  />
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Selected guests:</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {Array.from(selectedGuestIds).map(id => {
                    const guest = allGuests.find(g => g.id === id)
                    return guest ? (
                      <span key={id} className="px-2 py-0.5 text-xs bg-muted rounded-full">
                        {guest.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAssignGroupModal(false)
                    setNewGroupName('')
                    setAssignToGroupId('new')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAssignToGroup}
                  disabled={assignToGroupId === 'new' && !newGroupName.trim()}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Assign to Group
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Invited By Modal */}
      {showBulkInvitedByModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Update Invited By
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBulkInvitedByModal(false)
                  setBulkInvitedBy([])
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set who invited the selected {selectedGuestIds.size} guest{selectedGuestIds.size !== 1 ? 's' : ''}.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Invited By
                </label>
                <div className="flex flex-wrap gap-2">
                  {partnerOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBulkInvitedBy(prev => 
                        prev.includes(name)
                          ? prev.filter(n => n !== name)
                          : [...prev, name]
                      )}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        bulkInvitedBy.includes(name)
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select one or both partners, or leave empty to clear.
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Selected guests:</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {Array.from(selectedGuestIds).map(id => {
                    const guest = allGuests.find(g => g.id === id)
                    return guest ? (
                      <span key={id} className="px-2 py-0.5 text-xs bg-muted rounded-full">
                        {guest.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowBulkInvitedByModal(false)
                    setBulkInvitedBy([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBulkInvitedByUpdate}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Update {selectedGuestIds.size} Guest{selectedGuestIds.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">Import from CSV</h2>
                    <p className="text-sm text-muted-foreground">
                      {csvData.length} rows found. Map columns and import.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetCsvImport}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Import Mode Selector */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Import Mode</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvImportMode('guests')
                      setColumnMapping({})
                    }}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${
                      csvImportMode === 'guests'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4" />
                      <span className="font-medium">Import Guests</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Import individual guests with names. Groups will be auto-created.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvImportMode('groups')
                      setColumnMapping({})
                    }}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${
                      csvImportMode === 'groups'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Import Groups</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Import groups with guest count. Guests named &quot;Guest 1&quot;, &quot;Guest 2&quot;, etc.
                    </p>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {csvImportError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{csvImportError}</span>
                </div>
              )}

              {/* Column Mapping */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Column Mapping</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {csvImportMode === 'groups' 
                    ? 'Map columns. Group Name and Number of Guests are required.'
                    : 'Map columns. Guest Name and Group Name are required.'
                  }
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-1/2">CSV Column</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-1/2">Map to Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvHeaders.map((header, index) => (
                        <tr key={index} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                                {index + 1}
                              </div>
                              <span className="font-medium">{header || `Column ${index + 1}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={columnMapping[index.toString()] || ''}
                              onChange={(e) => updateColumnMapping(index.toString(), e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${
                                columnMapping[index.toString()] === 'name' || columnMapping[index.toString()] === 'groupName' || columnMapping[index.toString()] === 'guestCount'
                                  ? 'border-green-300 bg-green-50/50' 
                                  : columnMapping[index.toString()] 
                                    ? 'border-primary/30 bg-primary/5' 
                                    : ''
                              }`}
                            >
                              <option value="">-- Don&apos;t import --</option>
                              {DB_FIELDS.map(field => {
                                const isMapped = Object.entries(columnMapping).some(
                                  ([key, val]) => val === field.key && key !== index.toString()
                                )
                                return (
                                  <option 
                                    key={field.key} 
                                    value={field.key}
                                    disabled={isMapped}
                                  >
                                    {field.label}{field.required ? ' *' : ''}
                                  </option>
                                )
                              })}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Required field indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="text-red-500">*</span>
                  <span>Required field</span>
                  {csvImportMode === 'groups' ? (
                    <>
                      {!Object.values(columnMapping).includes('groupName') && (
                        <span className="ml-4 text-amber-600 font-medium">
                          ⚠️ Group Name must be mapped
                        </span>
                      )}
                      {!Object.values(columnMapping).includes('guestCount') && (
                        <span className="ml-4 text-amber-600 font-medium">
                          ⚠️ Number of Guests must be mapped
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {!Object.values(columnMapping).includes('name') && (
                        <span className="ml-4 text-amber-600 font-medium">
                          ⚠️ Guest Name must be mapped
                        </span>
                      )}
                      {!Object.values(columnMapping).includes('groupName') && (
                        <span className="ml-4 text-amber-600 font-medium">
                          ⚠️ Group Name must be mapped
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Preview (first 5 rows)
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                        {DB_FIELDS.filter(f => Object.values(columnMapping).includes(f.key)).map(field => (
                          <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                          {DB_FIELDS.filter(f => Object.values(columnMapping).includes(f.key)).map(field => {
                            const csvIndex = Object.entries(columnMapping).find(([, val]) => val === field.key)?.[0]
                            const value = csvIndex !== undefined ? row[parseInt(csvIndex)] || '' : ''
                            return (
                              <td key={field.key} className="px-3 py-2">
                                {value || <span className="text-muted-foreground italic">empty</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    ... and {csvData.length - 5} more rows
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {csvImportMode === 'groups' 
                    ? `${csvData.length} groups will be created with auto-generated guests`
                    : `${csvData.length} guests will be imported into groups`
                  }
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetCsvImport}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCsvImport}
                    disabled={csvImporting || (csvImportMode === 'groups' 
                      ? !Object.values(columnMapping).includes('groupName') || !Object.values(columnMapping).includes('guestCount')
                      : !Object.values(columnMapping).includes('name') || !Object.values(columnMapping).includes('groupName')
                    )}
                  >
                    {csvImporting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {csvImportMode === 'groups' 
                          ? `Import ${csvData.length} Groups`
                          : `Import ${csvData.length} Guests`
                        }
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmDialog.confirmVariant === 'destructive' ? 'bg-red-100' : 'bg-primary/10'
                }`}>
                  {confirmDialog.confirmVariant === 'destructive' ? (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{confirmDialog.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmDialog.confirmVariant === 'destructive' ? 'destructive' : 'default'}
                  className={`flex-1 ${confirmDialog.confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  onClick={confirmDialog.onConfirm}
                >
                  {confirmDialog.confirmLabel}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Send All Invites Modal */}
      {showSendInvitesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Send Invitations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSendInvitesModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure which guests should receive invitations.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendInvitesConfig.skipAlreadySent}
                    onChange={(e) => setSendInvitesConfig(prev => ({ ...prev, skipAlreadySent: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Skip already sent</span>
                    <p className="text-xs text-muted-foreground">Don&apos;t send to guests who already received an invite</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendInvitesConfig.onlyConfirmed}
                    onChange={(e) => setSendInvitesConfig(prev => ({ 
                      ...prev, 
                      onlyConfirmed: e.target.checked,
                      onlyPending: e.target.checked ? false : prev.onlyPending 
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Only confirmed guests</span>
                    <p className="text-xs text-muted-foreground">Send only to guests who have confirmed attendance</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendInvitesConfig.onlyPending}
                    onChange={(e) => setSendInvitesConfig(prev => ({ 
                      ...prev, 
                      onlyPending: e.target.checked,
                      onlyConfirmed: e.target.checked ? false : prev.onlyConfirmed 
                    }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Only pending guests</span>
                    <p className="text-xs text-muted-foreground">Send only to guests who haven&apos;t responded yet</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-4">
                  <strong className="text-foreground">
                    {(() => {
                      let filteredList = allGuests
                      if (sendInvitesConfig.skipAlreadySent) {
                        filteredList = filteredList.filter(g => !g.invitation_sent)
                      }
                      if (sendInvitesConfig.onlyConfirmed) {
                        filteredList = filteredList.filter(g => g.confirmation_status === 'confirmed')
                      }
                      if (sendInvitesConfig.onlyPending) {
                        filteredList = filteredList.filter(g => g.confirmation_status === 'pending')
                      }
                      return filteredList.length
                    })()}
                  </strong> guest(s) will receive invitations
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSendInvitesModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendAllInvites}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Notification Toast */}
      {notification.isOpen && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className={`p-4 shadow-lg border ${
            notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.title}
                </h4>
                <p className={`text-sm mt-0.5 ${
                  notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                className={`flex-shrink-0 ${
                  notification.type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Group Travel Info Dialog */}
      {showGroupTravelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Set Travel Info for Group</h2>
                </div>
                <button
                  onClick={() => setShowGroupTravelDialog(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {groupTravelForm.groupId ? 'Group:' : 'Selected Guests:'}
                </p>
                <p className="font-medium">{groupTravelForm.groupName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {groupTravelForm.groupId 
                    ? `${guestGroups.find(g => g.id === groupTravelForm.groupId)?.guests.length || 0} guest(s) will be updated`
                    : `${selectedGuestIds.size} guest(s) will be updated`
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Guest(s) traveling?</label>
                  <Switch
                    checked={groupTravelForm.isTraveling}
                    onCheckedChange={(checked) => setGroupTravelForm(prev => ({ ...prev, isTraveling: checked }))}
                  />
                </div>

                {groupTravelForm.isTraveling && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Traveling from</label>
                      <Input
                        value={groupTravelForm.travelingFrom}
                        onChange={(e) => setGroupTravelForm(prev => ({ ...prev, travelingFrom: e.target.value }))}
                        placeholder="e.g., New York, USA"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Travel arrangement <span className="text-muted-foreground">(optional)</span></label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setGroupTravelForm(prev => ({ ...prev, travelArrangement: 'will_buy_ticket' }))}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                            groupTravelForm.travelArrangement === 'will_buy_ticket'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Ticket className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Will purchase ticket</p>
                              <p className="text-xs text-muted-foreground">Guest will need to upload proof of purchase</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setGroupTravelForm(prev => ({ ...prev, travelArrangement: 'no_ticket_needed' }))}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                            groupTravelForm.travelArrangement === 'no_ticket_needed'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Does not need ticket</p>
                              <p className="text-xs text-muted-foreground">Guest must provide a reason</p>
                            </div>
                          </div>
                        </button>
                        
                        {groupTravelForm.travelArrangement && (
                          <button
                            onClick={() => setGroupTravelForm(prev => ({ ...prev, travelArrangement: null }))}
                            className="w-full p-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </div>

                    {groupTravelForm.travelArrangement === 'no_ticket_needed' && (
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Reason</label>
                        <textarea
                          value={groupTravelForm.noTicketReason}
                          onChange={(e) => setGroupTravelForm(prev => ({ ...prev, noTicketReason: e.target.value }))}
                          placeholder="e.g., Driving, Already have ticket, etc."
                          className="w-full px-3 py-2 border border-border rounded-lg resize-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowGroupTravelDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSetGroupTravel}
                  disabled={
                    groupTravelForm.isTraveling && 
                    groupTravelForm.travelArrangement === 'no_ticket_needed' && 
                    !groupTravelForm.noTicketReason.trim()
                  }
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Group
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Invitation Template Settings Modal */}
      {showInviteTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Invitation Message Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the message template for sending invitations to guests
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteTemplateModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                            >
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
                            {[
                              { var: '{{groupname}}', label: 'Group Name', desc: 'Name of the guest group' },
                              { var: '{{guestname}}', label: 'Guest Name', desc: 'Individual guest name' },
                              { var: '{{groupinvitationurl}}', label: 'Invitation URL', desc: 'Direct link to invitation' },
                            ].filter(item => 
                              !dynamicContentSearch || 
                              item.label.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.desc.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.var.toLowerCase().includes(dynamicContentSearch.toLowerCase())
                            ).map((item) => (
                              <DropdownMenuItem
                                key={item.var}
                                className="text-xs cursor-pointer flex-col items-start py-2"
                                onClick={() => {
                                  const editor = editorRef.current
                                  if (editor) {
                                    const selection = window.getSelection()
                                    let cursorPos = inviteTemplate.length
                                    
                                    // Find cursor position in template string by counting actual characters
                                    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
                                      const range = selection.getRangeAt(0)
                                      const preCaretRange = range.cloneRange()
                                      preCaretRange.selectNodeContents(editor)
                                      preCaretRange.setEnd(range.endContainer, range.endOffset)
                                      
                                      // Walk through nodes and count template string characters
                                      let charCount = 0
                                      const walker = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0): boolean => {
                                        if (node === range.endContainer) {
                                          if (node.nodeType === Node.TEXT_NODE) {
                                            // Filter out zero-width spaces when calculating offset
                                            const textBeforeCursor = (node.textContent || '').substring(0, range.endOffset)
                                            charCount += textBeforeCursor.replace(/\u200B/g, '').length
                                          }
                                          return true
                                        }
                                        if (node.nodeType === Node.TEXT_NODE) {
                                          // Filter out zero-width spaces
                                          charCount += (node.textContent || '').replace(/\u200B/g, '').length
                                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                                          const element = node as HTMLElement
                                          if (element.hasAttribute('data-variable')) {
                                            charCount += (element.getAttribute('data-variable') || '').length
                                            return false // Don't walk children of badge
                                          }
                                          // Handle BR tags as newlines
                                          if (element.tagName === 'BR') {
                                            charCount += 1 // \n is 1 character
                                            return false
                                          }
                                          // Handle DIV tags that are direct children of the editor (contentEditable line breaks)
                                          if (element.tagName === 'DIV' && parentIsEditor && indexInParent > 0) {
                                            // Only add newline if div doesn't start with BR (to avoid double counting)
                                            const firstChild = element.firstChild
                                            const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE && 
                                                               (firstChild as HTMLElement).tagName === 'BR'
                                            if (!startsWithBR) {
                                              charCount += 1 // Add \n before div content (except first div)
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
                                    
                                    // Insert variable into template string
                                    const newTemplate = inviteTemplate.slice(0, cursorPos) + item.var + inviteTemplate.slice(cursorPos)
                                    setInviteTemplate(newTemplate)
                                    
                                    // Focus editor after update
                                    setTimeout(() => editor.focus(), 0)
                                  }
                                }}
                              >
                                <div className="font-medium">{item.label}</div>
                                <div className="text-muted-foreground">{item.desc}</div>
                              </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Wedding Details */}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Wedding Details</div>
                            {[
                              { var: '{{partner1}}', label: 'Partner 1', desc: partnerNames.partner1 || 'First partner name' },
                              { var: '{{partner2}}', label: 'Partner 2', desc: partnerNames.partner2 || 'Second partner name' },
                              { var: '{{weddingdate}}', label: 'Wedding Date', desc: weddingDetails?.wedding_date ? new Date(weddingDetails.wedding_date).toLocaleDateString() : 'Wedding date' },
                            ].filter(item => 
                              !dynamicContentSearch || 
                              item.label.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.desc.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.var.toLowerCase().includes(dynamicContentSearch.toLowerCase())
                            ).map((item) => (
                              <DropdownMenuItem
                                key={item.var}
                                className="text-xs cursor-pointer flex-col items-start py-2"
                                onClick={() => {
                                  const editor = editorRef.current
                                  if (editor) {
                                    const selection = window.getSelection()
                                    let cursorPos = inviteTemplate.length
                                    
                                    // Find cursor position in template string by counting actual characters
                                    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
                                      const range = selection.getRangeAt(0)
                                      const preCaretRange = range.cloneRange()
                                      preCaretRange.selectNodeContents(editor)
                                      preCaretRange.setEnd(range.endContainer, range.endOffset)
                                      
                                      // Walk through nodes and count template string characters
                                      let charCount = 0
                                      const walker = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0): boolean => {
                                        if (node === range.endContainer) {
                                          if (node.nodeType === Node.TEXT_NODE) {
                                            // Filter out zero-width spaces when calculating offset
                                            const textBeforeCursor = (node.textContent || '').substring(0, range.endOffset)
                                            charCount += textBeforeCursor.replace(/\u200B/g, '').length
                                          }
                                          return true
                                        }
                                        if (node.nodeType === Node.TEXT_NODE) {
                                          // Filter out zero-width spaces
                                          charCount += (node.textContent || '').replace(/\u200B/g, '').length
                                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                                          const element = node as HTMLElement
                                          if (element.hasAttribute('data-variable')) {
                                            charCount += (element.getAttribute('data-variable') || '').length
                                            return false // Don't walk children of badge
                                          }
                                          // Handle BR tags as newlines
                                          if (element.tagName === 'BR') {
                                            charCount += 1 // \n is 1 character
                                            return false
                                          }
                                          // Handle DIV tags that are direct children of the editor (contentEditable line breaks)
                                          if (element.tagName === 'DIV' && parentIsEditor && indexInParent > 0) {
                                            // Only add newline if div doesn't start with BR (to avoid double counting)
                                            const firstChild = element.firstChild
                                            const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE && 
                                                               (firstChild as HTMLElement).tagName === 'BR'
                                            if (!startsWithBR) {
                                              charCount += 1 // Add \n before div content (except first div)
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
                                    
                                    // Insert variable into template string
                                    const newTemplate = inviteTemplate.slice(0, cursorPos) + item.var + inviteTemplate.slice(cursorPos)
                                    setInviteTemplate(newTemplate)
                                    
                                    // Focus editor after update
                                    setTimeout(() => editor.focus(), 0)
                                  }
                                }}
                              >
                                <div className="font-medium">{item.label}</div>
                                <div className="text-muted-foreground">{item.desc}</div>
                              </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Venue Information */}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Venue Information</div>
                            {[
                              { var: '{{ceremonyplace}}', label: 'Ceremony Venue', desc: weddingDetails?.ceremony_venue_name || 'Ceremony venue name' },
                              { var: '{{ceremonyaddress}}', label: 'Ceremony Address', desc: 'Full ceremony address' },
                              { var: '{{receptionplace}}', label: 'Reception Venue', desc: weddingDetails?.reception_venue_name || 'Reception venue name' },
                              { var: '{{receptionaddress}}', label: 'Reception Address', desc: 'Full reception address' },
                            ].filter(item => 
                              !dynamicContentSearch || 
                              item.label.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.desc.toLowerCase().includes(dynamicContentSearch.toLowerCase()) ||
                              item.var.toLowerCase().includes(dynamicContentSearch.toLowerCase())
                            ).map((item) => (
                              <DropdownMenuItem
                                key={item.var}
                                className="text-xs cursor-pointer flex-col items-start py-2"
                                onClick={() => {
                                  const editor = editorRef.current
                                  if (editor) {
                                    const selection = window.getSelection()
                                    let cursorPos = inviteTemplate.length
                                    
                                    // Find cursor position in template string by counting actual characters
                                    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
                                      const range = selection.getRangeAt(0)
                                      const preCaretRange = range.cloneRange()
                                      preCaretRange.selectNodeContents(editor)
                                      preCaretRange.setEnd(range.endContainer, range.endOffset)
                                      
                                      // Walk through nodes and count template string characters
                                      let charCount = 0
                                      const walker = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0): boolean => {
                                        if (node === range.endContainer) {
                                          if (node.nodeType === Node.TEXT_NODE) {
                                            // Filter out zero-width spaces when calculating offset
                                            const textBeforeCursor = (node.textContent || '').substring(0, range.endOffset)
                                            charCount += textBeforeCursor.replace(/\u200B/g, '').length
                                          }
                                          return true
                                        }
                                        if (node.nodeType === Node.TEXT_NODE) {
                                          // Filter out zero-width spaces
                                          charCount += (node.textContent || '').replace(/\u200B/g, '').length
                                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                                          const element = node as HTMLElement
                                          if (element.hasAttribute('data-variable')) {
                                            charCount += (element.getAttribute('data-variable') || '').length
                                            return false // Don't walk children of badge
                                          }
                                          // Handle BR tags as newlines
                                          if (element.tagName === 'BR') {
                                            charCount += 1 // \n is 1 character
                                            return false
                                          }
                                          // Handle DIV tags that are direct children of the editor (contentEditable line breaks)
                                          if (element.tagName === 'DIV' && parentIsEditor && indexInParent > 0) {
                                            // Only add newline if div doesn't start with BR (to avoid double counting)
                                            const firstChild = element.firstChild
                                            const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE && 
                                                               (firstChild as HTMLElement).tagName === 'BR'
                                            if (!startsWithBR) {
                                              charCount += 1 // Add \n before div content (except first div)
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
                                    
                                    // Insert variable into template string
                                    const newTemplate = inviteTemplate.slice(0, cursorPos) + item.var + inviteTemplate.slice(cursorPos)
                                    setInviteTemplate(newTemplate)
                                    
                                    // Focus editor after update
                                    setTimeout(() => editor.focus(), 0)
                                  }
                                }}
                              >
                                <div className="font-medium">{item.label}</div>
                                <div className="text-muted-foreground">{item.desc}</div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              Examples
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="px-2 py-1.5 text-xs font-semibold">Template Examples</div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => setInviteTemplate("Dear {{groupname}},\n\nWe are delighted to invite you to celebrate our wedding on {{weddingdate}}!\n\nView your personalized invitation here: {{groupinvitationurl}}\n\nWith love,\n{{partner1}} & {{partner2}}")}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Formal Invitation</span>
                                <span className="text-muted-foreground">Classic wedding invitation template</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => setInviteTemplate("Hey {{groupname}}! 👋\n\n{{partner1}} and {{partner2}} are getting married on {{weddingdate}}! 🎉\n\nCheck out your invite: {{groupinvitationurl}}\n\nCan't wait to celebrate with you!")}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Casual & Fun</span>
                                <span className="text-muted-foreground">Friendly and relaxed invitation</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => setInviteTemplate("Hello {{guestname}},\n\nYou're invited to our wedding at {{ceremonyplace}} on {{weddingdate}}.\n\nCeremony: {{ceremonyplace}}\nReception: {{receptionplace}}\n\nRSVP here: {{groupinvitationurl}}")}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Detailed Info</span>
                                <span className="text-muted-foreground">Includes venue details</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => setInviteTemplate("Hi {{groupname}}! Your invitation is ready: {{groupinvitationurl}}")}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Short & Simple</span>
                                <span className="text-muted-foreground">Quick message with link</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement
                        // Extract template by walking through nodes
                        const extractTemplate = (node: Node, parentIsEditor: boolean = false, indexInParent: number = 0, depth: number = 0): string => {
                          const indent = '  '.repeat(depth)
                          if (node.nodeType === Node.TEXT_NODE) {
                            // Filter out zero-width spaces used for cursor positioning
                            const text = (node.textContent || '').replace(/\u200B/g, '')
                            return text
                          } else if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement
                            
                            // If it's a badge span, return the variable
                            if (element.hasAttribute('data-variable')) {
                              const variable = element.getAttribute('data-variable') || ''
                              return variable
                            }
                            // Handle line breaks
                            if (element.tagName === 'BR') {
                              return '\n'
                            }
                            
                            // Check if this is a wrapper DIV (contentEditable often wraps all content in a single DIV)
                            // A wrapper DIV is: direct child of editor (indexInParent=0, parentIsEditor=true) with DIV children
                            const isWrapperDiv = element.tagName === 'DIV' && parentIsEditor && indexInParent === 0 &&
                                               Array.from(node.childNodes).some(child => 
                                                 child.nodeType === Node.ELEMENT_NODE && 
                                                 (child as HTMLElement).tagName === 'DIV'
                                               )
                            
                            // Handle DIV elements (contentEditable creates these on Enter)
                            if (element.tagName === 'DIV' && (parentIsEditor || isWrapperDiv)) {
                              const treatChildrenAsTopLevel = isWrapperDiv
                              const content = Array.from(node.childNodes)
                                .map((child, idx) => extractTemplate(child, treatChildrenAsTopLevel, idx, depth + 1))
                                .join('')
                              
                              // If this is the wrapper div, don't add any newlines - just return the content
                              if (isWrapperDiv) {
                                return content
                              }
                              
                              // Add newline before each div except the first one
                              // But only if the div doesn't start with a BR (to avoid double newlines)
                              const firstChild = node.firstChild
                              const startsWithBR = firstChild?.nodeType === Node.ELEMENT_NODE && 
                                                   (firstChild as HTMLElement).tagName === 'BR'
                              const shouldAddNewline = indexInParent > 0 && !startsWithBR
                              return (shouldAddNewline ? '\n' : '') + content
                            }
                            // Otherwise, recursively process children
                            const isEditor = element === target
                            return Array.from(node.childNodes)
                              .map((child, idx) => extractTemplate(child, isEditor, idx, depth + 1))
                              .join('')
                          }
                          return ''
                        }
                        const newText = extractTemplate(target, true, 0, 0)
                        
                        if (newText !== inviteTemplate) {
                          isUpdatingRef.current = true
                          setInviteTemplate(newText)
                        } else {
                        }
                      }}
                      onPaste={(e) => {
                        // Preserve plain text pasting only
                        e.preventDefault()
                        const text = e.clipboardData?.getData('text/plain') || ''
                        document.execCommand('insertText', false, text)
                      }}
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
                          },
                          weddingDetails
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
                        {[
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
                        ].filter(v => v.var !== showReplaceMenu).map((variable) => (
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowInviteTemplateModal(false)
                  // Reset to saved template if needed
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  try {
                    // Save template to page_config
                    const response = await fetch(`/api/weddings/${encodeURIComponent(weddingId)}/details`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        page_config: {
                          invitationTemplate: inviteTemplate
                        }
                      })
                    })

                    if (response.ok) {
                      setNotification({
                        isOpen: true,
                        type: 'success',
                        title: 'Settings Saved',
                        message: 'Invitation template has been saved successfully.'
                      })
                      setShowInviteTemplateModal(false)
                    } else {
                      setNotification({
                        isOpen: true,
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to save invitation template. Please try again.'
                      })
                    }
                  } catch (error) {
                    setNotification({
                      isOpen: true,
                      type: 'error',
                      title: 'Error',
                      message: 'An error occurred while saving. Please try again.'
                    })
                  }
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Message Viewing Modal */}
      {showMessageModal && selectedGroupForMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Message from {selectedGroupForMessage.name}</h2>
                {selectedGroupForMessage.rsvp_submitted_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted on {new Date(selectedGroupForMessage.rsvp_submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMessageModal(false)
                  setSelectedGroupForMessage(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-foreground whitespace-pre-wrap">
                  {selectedGroupForMessage.message || 'No message provided'}
                </p>
              </div>

              {/* Guest List */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Guests in this group:</h3>
                <div className="space-y-2">
                  {selectedGroupForMessage.guests.map(guest => (
                    <div key={guest.id} className="flex items-center justify-between px-3 py-2 bg-muted/20 rounded-md">
                      <span className="text-sm text-foreground">{guest.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClass(guest.confirmation_status)}`}>
                        {guest.confirmation_status === 'confirmed' ? 'Attending' : guest.confirmation_status === 'declined' ? 'Not Attending' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMessageModal(false)
                  setSelectedGroupForMessage(null)
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}

"use client"

import React, { useState, useEffect, use, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PremiumUpgradePrompt } from "@/components/ui/premium-gate"
import { useSubscriptionContext } from "@/components/contexts/subscription-context"
import { getCleanAdminUrl } from "@/lib/admin-url"
import {
  InvitationsHeaderToolbar,
  InvitationsChartsSection,
  GuestsTableFlat,
  GuestsTableGroups,
  AddEditGroupModal,
  AddEditGuestModal,
  AssignGroupModal,
  BulkInvitedByModal,
  ConfirmationDialog,
  CsvImportModal,
  GroupTravelDialog,
  SendInvitesModal,
  InvitationTemplateModal,
  NotificationToast,
  MessageViewingModal,
} from "./components"
import type { ConfirmDialogState } from "./components/confirmation-dialog"
import {
  Guest,
  GuestGroup,
  TimelineData,
  ColumnVisibility,
  GroupTravelForm,
  TAG_COLORS,
  PREDEFINED_TAGS,
} from "./types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

interface InvitationsPageProps {
  params: Promise<{ weddingId: string }>
}

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
  const [allTimelineData, setAllTimelineData] = useState<{
    chartData: Array<{
      date: string
      confirmed: number
      declined: number
      opens: number
      cumulativeConfirmed: number
      cumulativeDeclined: number
      cumulativeOpens: number
      groupId?: string
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
    openEvents: Array<{
      id: string
      timestamp: string
      groupId: string
      groupName: string
      deviceType: string
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
  const [chartsExpanded, setChartsExpanded] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Message viewing
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedGroupForMessage, setSelectedGroupForMessage] = useState<GuestGroup | null>(null)

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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'default',
    onConfirm: () => { }
  })

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
    fetchAllTimelineData() // Fetch all timeline data once
  }, [weddingId])

  // Fetch ALL timeline data once (no filtering on server)
  const fetchAllTimelineData = async () => {
    setTimelineLoading(true)
    try {
      // Always fetch all data, we'll filter client-side
      const url = `/api/invitation-tracking/timeline?weddingId=${encodeURIComponent(weddingId)}&range=all`
      const response = await fetch(url)
      const result = await response.json()
      if (response.ok) {
        setAllTimelineData(result)
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setTimelineLoading(false)
    }
  }

  // Client-side filtered timeline data based on range and group filter
  const timelineData = useMemo(() => {
    if (!allTimelineData) return null

    const now = new Date()
    let startDate: Date | null = null

    switch (timelineRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '14d':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = null
    }

    // Filter confirmation events
    let filteredConfirmationEvents = allTimelineData.confirmationEvents.filter(event => {
      const eventDate = new Date(event.timestamp)
      const passesDateFilter = !startDate || eventDate >= startDate
      const passesGroupFilter = timelineGroupFilter === 'all' || event.groupId === timelineGroupFilter
      return passesDateFilter && passesGroupFilter
    })

    // Filter open events  
    let filteredOpenEvents = (allTimelineData.openEvents || []).filter(event => {
      const eventDate = new Date(event.timestamp)
      const passesDateFilter = !startDate || eventDate >= startDate
      const passesGroupFilter = timelineGroupFilter === 'all' || event.groupId === timelineGroupFilter
      return passesDateFilter && passesGroupFilter
    })

    // Rebuild chart data from filtered events
    const dailyData: Record<string, {
      date: string
      confirmed: number
      declined: number
      opens: number
    }> = {}

    filteredConfirmationEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, declined: 0, opens: 0 }
      }
      if (event.type === 'confirmed') dailyData[date].confirmed++
      else if (event.type === 'declined') dailyData[date].declined++
    })

    filteredOpenEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, declined: 0, opens: 0 }
      }
      dailyData[date].opens++
    })

    // Build full date range
    const allDates = Object.keys(dailyData).map(d => new Date(d).getTime())
    const earliestDate = allDates.length > 0 ? Math.min(...allDates) : now.getTime()
    const chartStartDate = startDate ? startDate.getTime() : earliestDate

    const dateRange: Date[] = []
    const currentDate = new Date(chartStartDate)
    currentDate.setHours(0, 0, 0, 0)
    const endDate = new Date()
    endDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Initialize all dates
    const fullDailyData: Record<string, typeof dailyData[string]> = {}
    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      fullDailyData[dateStr] = { date: dateStr, confirmed: 0, declined: 0, opens: 0 }
    })

    // Merge actual data
    Object.assign(fullDailyData, dailyData)

    // Build cumulative chart data
    const chartData = Object.values(fullDailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce((acc, day, index) => {
        const prev = acc[index - 1]
        acc.push({
          ...day,
          cumulativeConfirmed: (prev?.cumulativeConfirmed || 0) + day.confirmed,
          cumulativeDeclined: (prev?.cumulativeDeclined || 0) + day.declined,
          cumulativeOpens: (prev?.cumulativeOpens || 0) + day.opens,
        })
        return acc
      }, [] as Array<typeof dailyData[string] & {
        cumulativeConfirmed: number
        cumulativeDeclined: number
        cumulativeOpens: number
      }>)

    return {
      chartData,
      confirmationEvents: filteredConfirmationEvents,
      summary: {
        totalConfirmed: filteredConfirmationEvents.filter(e => e.type === 'confirmed').length,
        totalDeclined: filteredConfirmationEvents.filter(e => e.type === 'declined').length,
        totalOpens: filteredOpenEvents.length,
      }
    }
  }, [allTimelineData, timelineRange, timelineGroupFilter])

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

  const navigateToGroupDetails = (groupId: string) => {
    router.push(getCleanAdminUrl(weddingId, `groups/${groupId}`))
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
        // Refresh timeline data to show the new status change in real-time
        await fetchAllTimelineData()
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
  const hasActiveFilters = !!(searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || groupFilter !== 'all' || invitedByFilter !== 'all' || openedFilter !== 'all')
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

      <InvitationsHeaderToolbar
        headerProps={{
          guestGroupsCount: guestGroups.length,
          filteredGroupsCount: filteredGroups.length,
          displayedGuestCount: displayedGuestCount,
          totalGuests: totalGuests,
          confirmedGuests: confirmedGuests,
          pendingGuests: pendingGuests,
          declinedGuests: declinedGuests,
          hasActiveFilters: hasActiveFilters,
          addDropdownOpen: addDropdownOpen,
          setAddDropdownOpen: setAddDropdownOpen,
          onAddGuest: () => {
            setSelectedGroupId(null)
            setShowAddGuestModal(true)
            setAddDropdownOpen(false)
          },
          onAddGroup: () => {
            setShowAddGroupModal(true)
            setAddDropdownOpen(false)
          },
          onImportCsv: () => {
            setAddDropdownOpen(false)
            setTimeout(() => {
              document.getElementById('csv-import-input')?.click()
            }, 100)
          },
          onExportCsv: handleExportCsv,
          onOpenInviteSettings: () => setShowInviteTemplateModal(true),
          onOpenSendInvites: () => setShowSendInvitesModal(true),
          onCsvFileSelect: handleCsvFileSelect,
        }}
        toolbarProps={{
          viewMode: viewMode,
          setViewMode: setViewMode,
          searchQuery: searchQuery,
          setSearchQuery: setSearchQuery,
          statusFilter: statusFilter,
          setStatusFilter: setStatusFilter,
          tagFilter: tagFilter,
          setTagFilter: setTagFilter,
          groupFilter: groupFilter,
          setGroupFilter: setGroupFilter,
          invitedByFilter: invitedByFilter,
          setInvitedByFilter: setInvitedByFilter,
          openedFilter: openedFilter,
          setOpenedFilter: setOpenedFilter,
          allTags: allTags,
          guestGroups: guestGroups,
          partnerOptions: partnerOptions,
          filteredGroupsCount: filteredGroups.length,
          totalGroupsCount: guestGroups.length,
          filteredGuestsCount: filteredGuests.length,
          totalGuestsCount: totalGuests,
          visibleColumns: visibleColumns,
          toggleColumn: toggleColumn,
          showColumnMenu: showColumnMenu,
          setShowColumnMenu: setShowColumnMenu,
          selectedGuestIds: selectedGuestIds,
          allGuests: allGuests,
          onBulkStatusUpdate: handleBulkStatusUpdate,
          onBulkDelete: handleBulkDelete,
          onAssignGroup: () => setShowAssignGroupModal(true),
          clearSelection: clearSelection,
          setGroupTravelForm: setGroupTravelForm,
          setShowGroupTravelDialog: setShowGroupTravelDialog,
          setBulkInvitedBy: setBulkInvitedBy,
          setShowBulkInvitedByModal: setShowBulkInvitedByModal,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <InvitationsChartsSection
          weddingId={weddingId}
          chartsExpanded={chartsExpanded}
          setChartsExpanded={setChartsExpanded}
          statusByInvitedByData={statusByInvitedByData}
          tagsByInvitedByData={tagsByInvitedByData}
          timelineLoading={timelineLoading}
          timelineData={timelineData}
          timelineRange={timelineRange}
          setTimelineRange={setTimelineRange}
          timelineGroupFilter={timelineGroupFilter}
          setTimelineGroupFilter={setTimelineGroupFilter}
          guestGroups={guestGroups}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Flat View - All Guests Table */}
        {viewMode === 'flat' && (
          <GuestsTableFlat
            filteredGuests={filteredGuests}
            totalGuests={totalGuests}
            selectedGuestIds={selectedGuestIds}
            toggleSelectAll={toggleSelectAll}
            toggleGuestSelection={toggleGuestSelection}
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            handleUpdateGuestStatus={handleUpdateGuestStatus}
            openEditGuest={openEditGuest}
            handleDeleteGuest={handleDeleteGuest}
            handleSendGuestInvite={handleSendGuestInvite}
            updateGuestInvitationStatus={updateGuestInvitationStatus}
          />
        )}

        {/* Groups Table View with Expandable Rows */}
        {viewMode === 'groups' && (
          <GuestsTableGroups
            filteredGroups={filteredGroups}
            ungroupedGuests={ungroupedGuests}
            guestGroupsCount={guestGroups.length}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            showUngroupedExpanded={showUngroupedExpanded}
            setShowUngroupedExpanded={setShowUngroupedExpanded}
            selectedGuestIds={selectedGuestIds}
            toggleSelectGroup={toggleSelectGroup}
            toggleGuestSelection={toggleGuestSelection}
            isGroupFullySelected={isGroupFullySelected}
            isGroupPartiallySelected={isGroupPartiallySelected}
            visibleColumns={visibleColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            handleUpdateGuestStatus={handleUpdateGuestStatus}
            handleGroupStatusUpdate={handleGroupStatusUpdate}
            openEditGuest={openEditGuest}
            openEditGroup={openEditGroup}
            openAddGuestToGroup={openAddGuestToGroup}
            handleDeleteGuest={handleDeleteGuest}
            handleDeleteGroup={handleDeleteGroup}
            handleSendGuestInvite={handleSendGuestInvite}
            handleSendGroupInvite={handleSendGroupInvite}
            handleCopyRSVPLink={handleCopyRSVPLink}
            updateGuestInvitationStatus={updateGuestInvitationStatus}
            updateGroupInvitationStatus={updateGroupInvitationStatus}
            openGroupTravelDialog={openGroupTravelDialog}
            setSelectedGroupForMessage={setSelectedGroupForMessage}
            setShowMessageModal={setShowMessageModal}
            getInvitationUrl={getInvitationUrl}
            navigateToGroupDetails={navigateToGroupDetails}
          />
        )}
      </div>
      {/* Add/Edit Group Modal */}
      <AddEditGroupModal
        isOpen={showAddGroupModal || editingGroup !== null}
        editingGroup={editingGroup}
        groupForm={groupForm}
        setGroupForm={setGroupForm}
        partnerOptions={partnerOptions}
        guestsInGroupModal={guestsInGroupModal}
        isAddingGuestInModal={isAddingGuestInModal}
        setIsAddingGuestInModal={setIsAddingGuestInModal}
        tempGuestForm={tempGuestForm}
        setTempGuestForm={setTempGuestForm}
        onClose={() => {
          setShowAddGroupModal(false)
          setEditingGroup(null)
          resetGroupForm()
        }}
        onSubmit={editingGroup ? handleUpdateGroup : handleAddGroup}
        addGuestToGroupModal={addGuestToGroupModal}
        removeGuestFromGroupModal={removeGuestFromGroupModal}
        toggleTag={toggleTag}
        toggleTempGuestTag={toggleTempGuestTag}
      />

      {/* Add/Edit Guest Modal */}
      <AddEditGuestModal
        isOpen={showAddGuestModal || editingGuest !== null}
        editingGuest={editingGuest}
        guestForm={guestForm}
        setGuestForm={setGuestForm}
        guestGroups={guestGroups}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        isCreatingNewGroup={isCreatingNewGroup}
        setIsCreatingNewGroup={setIsCreatingNewGroup}
        newGroupNameForGuest={newGroupNameForGuest}
        setNewGroupNameForGuest={setNewGroupNameForGuest}
        partnerOptions={partnerOptions}
        onClose={() => {
          setShowAddGuestModal(false)
          setEditingGuest(null)
          setSelectedGroupId(null)
          resetGuestForm()
        }}
        onSubmit={editingGuest ? handleUpdateGuest : handleAddGuest}
        toggleGuestTag={toggleGuestTag}
      />

      {/* Assign to Group Modal */}
      <AssignGroupModal
        isOpen={showAssignGroupModal}
        onClose={() => setShowAssignGroupModal(false)}
        selectedGuestIds={selectedGuestIds}
        allGuests={allGuests}
        guestGroups={guestGroups}
        assignToGroupId={assignToGroupId}
        setAssignToGroupId={setAssignToGroupId}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        onAssign={handleAssignToGroup}
      />

      {/* Bulk Invited By Modal */}
      <BulkInvitedByModal
        isOpen={showBulkInvitedByModal}
        onClose={() => setShowBulkInvitedByModal(false)}
        selectedGuestIds={selectedGuestIds}
        allGuests={allGuests}
        partnerOptions={partnerOptions}
        bulkInvitedBy={bulkInvitedBy}
        setBulkInvitedBy={setBulkInvitedBy}
        onUpdate={handleBulkInvitedByUpdate}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={resetCsvImport}
        csvData={csvData}
        csvHeaders={csvHeaders}
        csvImportMode={csvImportMode}
        setCsvImportMode={setCsvImportMode}
        columnMapping={columnMapping}
        setColumnMapping={setColumnMapping}
        csvImportError={csvImportError}
        csvImporting={csvImporting}
        dbFields={DB_FIELDS}
        onImport={handleCsvImport}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Send All Invites Modal */}
      <SendInvitesModal
        isOpen={showSendInvitesModal}
        onClose={() => setShowSendInvitesModal(false)}
        allGuests={allGuests}
        config={sendInvitesConfig}
        setConfig={setSendInvitesConfig}
        onSend={handleSendAllInvites}
      />

      {/* Notification Toast */}
      <NotificationToast
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Group Travel Info Dialog */}
      <GroupTravelDialog
        isOpen={showGroupTravelDialog}
        groupTravelForm={groupTravelForm}
        setGroupTravelForm={setGroupTravelForm}
        guestGroups={guestGroups}
        selectedGuestIds={selectedGuestIds}
        onClose={() => setShowGroupTravelDialog(false)}
        onSubmit={handleSetGroupTravel}
      />

      {/* Invitation Template Settings Modal */}
      <InvitationTemplateModal
        isOpen={showInviteTemplateModal}
        onClose={() => setShowInviteTemplateModal(false)}
        invitationTemplate={inviteTemplate}
        onSave={async (template: string) => {
          const response = await fetch(`/api/weddings/${encodeURIComponent(weddingId)}/details`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page_config: {
                invitationTemplate: template
              }
            })
          })

          if (response.ok) {
            setInviteTemplate(template)
            setNotification({
              isOpen: true,
              type: 'success',
              title: 'Settings Saved',
              message: 'Invitation template has been saved successfully.'
            })
          } else {
            throw new Error('Failed to save')
          }
        }}
        weddingDetails={weddingDetails}
        partnerNames={partnerNames}
        weddingId={weddingId}
        weddingNameId={weddingNameId}
      />

      {/* Message Viewing Modal */}
      <MessageViewingModal
        isOpen={showMessageModal}
        group={selectedGroupForMessage}
        onClose={() => {
          setShowMessageModal(false)
          setSelectedGroupForMessage(null)
        }}
      />
    </main>
  )
}

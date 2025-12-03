"use client"

import { useState, useEffect, use, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  FileSpreadsheet,
  AlertCircle,
  Send,
  Mail,
  MailCheck,
  UserCheck,
  MoreVertical
} from "lucide-react"

interface Guest {
  id: string
  wedding_name_id: string
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
}

interface GuestGroup {
  id: string
  wedding_name_id: string
  name: string
  phone_number: string | null
  tags: string[]
  notes: string | null
  invited_by: string[]
  invitation_sent: boolean
  invitation_sent_at: string | null
  created_at: string
  guests: Guest[]
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
  
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([])
  const [ungroupedGuests, setUngroupedGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showUngroupedExpanded, setShowUngroupedExpanded] = useState(true)
  
  // View mode: 'grouped' or 'flat' - initialized from URL param
  const initialViewMode = searchParams.get('view') === 'flat' ? 'flat' : 'grouped'
  const [viewMode, setViewModeState] = useState<'grouped' | 'flat'>(initialViewMode)
  
  // Update URL when view mode changes
  const setViewMode = (mode: 'grouped' | 'flat') => {
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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`invitations-columns-${weddingId}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fall through to default
        }
      }
    }
    return {
      phone: true,
      group: true,
      tags: true,
      status: true,
      dietary: true,
      invitedBy: true,
      inviteSent: true,
    }
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  
  // Send invites modal state
  const [showSendInvitesModal, setShowSendInvitesModal] = useState(false)
  const [sendInvitesConfig, setSendInvitesConfig] = useState({
    skipAlreadySent: true,
    onlyConfirmed: false,
    onlyPending: false,
  })
  
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
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [csvImportError, setCsvImportError] = useState<string | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  
  // Database fields for CSV mapping
  const DB_FIELDS = [
    { key: 'name', label: 'Name', required: true },
    { key: 'phoneNumber', label: 'Phone Number', required: false },
    { key: 'tags', label: 'Tags (comma-separated)', required: false },
    { key: 'confirmationStatus', label: 'Status (pending/confirmed/declined)', required: false },
    { key: 'dietaryRestrictions', label: 'Dietary Restrictions', required: false },
    { key: 'invitedBy', label: 'Invited By (comma-separated)', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ]
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    phoneNumber: "",
    tags: [] as string[],
    notes: "",
    invitedBy: [] as string[],
  })
  
  const [guestForm, setGuestForm] = useState({
    name: "",
    phoneNumber: "",
    tags: [] as string[],
    confirmationStatus: "pending" as 'pending' | 'confirmed' | 'declined',
    dietaryRestrictions: "",
    notes: "",
    invitedBy: [] as string[],
  })

  useEffect(() => {
    fetchGuestGroups()
    fetchUngroupedGuests()
    fetchWeddingData()
  }, [weddingId])

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
      console.log('Wedding data response:', result)
      if (result.details) {
        setPartnerNames({
          partner1: result.details.partner1_first_name || '',
          partner2: result.details.partner2_first_name || '',
        })
      }
    } catch (error) {
      console.error("Error fetching wedding data:", error)
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
      const response = await fetch(`/api/guest-groups?weddingNameId=${encodeURIComponent(weddingId)}`)
      const result = await response.json()
      if (result.data) {
        setGuestGroups(result.data)
      }
    } catch (error) {
      console.error("Error fetching guest groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUngroupedGuests = async () => {
    try {
      const response = await fetch(`/api/guests?weddingNameId=${encodeURIComponent(weddingId)}&ungrouped=true`)
      const result = await response.json()
      if (result.data) {
        setUngroupedGuests(result.data)
      }
    } catch (error) {
      console.error("Error fetching ungrouped guests:", error)
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
          weddingNameId: weddingId,
          name: groupForm.name,
          phoneNumber: groupForm.phoneNumber || null,
          tags: groupForm.tags,
          notes: groupForm.notes || null,
          invitedBy: groupForm.invitedBy,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error("Error adding group:", result.error)
        setNotification({ isOpen: true, type: 'error', title: 'Error', message: `Error adding group: ${result.error}` })
        return
      }
      
      await fetchGuestGroups()
      setShowAddGroupModal(false)
      resetGroupForm()
      setNotification({ isOpen: true, type: 'success', title: 'Success', message: 'Group added successfully!' })
    } catch (error) {
      console.error("Error adding group:", error)
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
      console.error("Error updating group:", error)
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
          console.error("Error deleting group:", error)
          setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error deleting group. Please try again.' })
        }
      }
    })
  }

  const handleAddGuest = async () => {
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingNameId: weddingId,
          guestGroupId: selectedGroupId,
          name: guestForm.name,
          phoneNumber: guestForm.phoneNumber || null,
          tags: guestForm.tags,
          confirmationStatus: guestForm.confirmationStatus,
          dietaryRestrictions: guestForm.dietaryRestrictions || null,
          notes: guestForm.notes || null,
          invitedBy: guestForm.invitedBy,
        }),
      })
      
      if (response.ok) {
        await fetchGuestGroups()
        await fetchUngroupedGuests()
        setShowAddGuestModal(false)
        setSelectedGroupId(null)
        resetGuestForm()
      }
    } catch (error) {
      console.error("Error adding guest:", error)
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
      console.error("Error updating guest:", error)
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
          console.error("Error deleting guest:", error)
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
      console.error("Error updating guest status:", error)
    }
  }

  const resetGroupForm = () => {
    setGroupForm({ name: "", phoneNumber: "", tags: [], notes: "", invitedBy: [] })
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
    })
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
            weddingNameId: weddingId,
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
      console.error("Error assigning guests to group:", error)
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
      console.error("Error updating guest statuses:", error)
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
          console.error("Error deleting guests:", error)
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
      console.error("Error updating invited by:", error)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating guests. Please try again.' })
    }
  }

  // Update all guests in a group to a specific status
  const handleGroupStatusUpdate = async (group: GuestGroup, newStatus: 'confirmed' | 'declined') => {
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
      console.error("Error updating group status:", error)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message: 'Error updating group. Please try again.' })
    }
  }

  // Send invite placeholder functions (functionality to be added later)
  const handleSendGroupInvite = (group: GuestGroup) => {
    // TODO: Implement actual sending logic
    setNotification({ 
      isOpen: true, 
      type: 'success', 
      title: 'Coming Soon', 
      message: `Invite sending for "${group.name}" will be available soon.` 
    })
  }

  const handleSendGuestInvite = (guest: Guest) => {
    // TODO: Implement actual sending logic
    setNotification({ 
      isOpen: true, 
      type: 'success', 
      title: 'Coming Soon', 
      message: `Invite sending for "${guest.name}" will be available soon.` 
    })
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
        
        // Auto-map columns based on header names
        const autoMapping: Record<string, string> = {}
        headers.forEach((header, index) => {
          const headerLower = header.toLowerCase().trim()
          if (headerLower.includes('name') && !headerLower.includes('phone')) {
            autoMapping[index.toString()] = 'name'
          } else if (headerLower.includes('phone') || headerLower.includes('tel') || headerLower.includes('mobile')) {
            autoMapping[index.toString()] = 'phoneNumber'
          } else if (headerLower.includes('email') || headerLower.includes('mail')) {
            autoMapping[index.toString()] = 'email'
          } else if (headerLower.includes('tag')) {
            autoMapping[index.toString()] = 'tags'
          } else if (headerLower.includes('status') || headerLower.includes('confirm')) {
            autoMapping[index.toString()] = 'confirmationStatus'
          } else if (headerLower.includes('diet') || headerLower.includes('allerg') || headerLower.includes('restriction')) {
            autoMapping[index.toString()] = 'dietaryRestrictions'
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
    // Check if name field is mapped
    const hasNameMapping = Object.values(columnMapping).includes('name')
    if (!hasNameMapping) {
      setCsvImportError("Name field is required. Please map a column to 'Name'.")
      return false
    }
    setCsvImportError(null)
    return true
  }

  const handleCsvImport = async () => {
    if (!validateCsvMapping()) return
    
    setCsvImporting(true)
    setCsvImportError(null)
    
    try {
      // Transform CSV data to guest objects
      const guests = csvData.map(row => {
        const guest: Record<string, string | string[]> = {}
        
        Object.entries(columnMapping).forEach(([csvIndex, dbField]) => {
          const value = row[parseInt(csvIndex)] || ''
          
          if (dbField === 'tags') {
            // Split tags by comma
            guest[dbField] = value.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
          } else if (dbField === 'confirmationStatus') {
            // Normalize status values
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
      }).filter(guest => guest.name && (guest.name as string).trim())
      
      if (guests.length === 0) {
        setCsvImportError("No valid guests found in CSV. Make sure the Name column has values.")
        setCsvImporting(false)
        return
      }
      
      // Bulk import
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          weddingNameId: weddingId,
          guests,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setCsvImportError(result.error || "Failed to import guests")
        setCsvImporting(false)
        return
      }
      
      // Success - refresh data and close modal
      await fetchGuestGroups()
      await fetchUngroupedGuests()
      
      setShowCsvImportModal(false)
      setCsvData([])
      setCsvHeaders([])
      setColumnMapping({})
      setNotification({ isOpen: true, type: 'success', title: 'Import Complete', message: `Successfully imported ${result.count} guests!` })
    } catch {
      setCsvImportError("Failed to import guests. Please try again.")
    } finally {
      setCsvImporting(false)
    }
  }

  const resetCsvImport = () => {
    setShowCsvImportModal(false)
    setCsvData([])
    setCsvHeaders([])
    setColumnMapping({})
    setCsvImportError(null)
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

  // Calculate stats (including ungrouped guests)
  const groupedGuestsCount = guestGroups.reduce((acc, group) => acc + group.guests.length, 0)
  const totalGuests = groupedGuestsCount + ungroupedGuests.length
  const confirmedGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "confirmed").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "confirmed").length
  const declinedGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "declined").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "declined").length
  const pendingGuests = guestGroups.reduce(
    (acc, group) => acc + group.guests.filter(g => g.confirmation_status === "pending").length,
    0
  ) + ungroupedGuests.filter(g => g.confirmation_status === "pending").length

  const stats = [
    { label: "Total Groups", value: guestGroups.length.toString(), color: "primary" },
    { label: "Total Guests", value: totalGuests.toString(), color: "primary" },
    { label: "Confirmed", value: confirmedGuests.toString(), color: "secondary" },
    { label: "Declined", value: declinedGuests.toString(), color: "destructive" },
    { label: "Pending", value: pendingGuests.toString(), color: "muted" },
  ]

  // Get all unique tags from groups
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    guestGroups.forEach(group => {
      group.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [guestGroups])

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

  // Filter guests based on current filters
  const filteredGuests = useMemo(() => {
    return allGuests.filter(guest => {
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
  }, [allGuests, searchQuery, statusFilter, tagFilter, groupFilter, invitedByFilter])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header
          showBackButton
          backHref={`/admin/${weddingId}/dashboard`}
          title="Invitations"
        />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        showBackButton
        backHref={`/admin/${weddingId}/dashboard`}
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
                <span className="text-muted-foreground">{guestGroups.length} groups</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium">
                <span className="text-foreground font-semibold">{totalGuests}</span>
                <span className="text-muted-foreground">guests</span>
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
              <DropdownMenu>
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
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Guest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddGroupModal(true)}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add Group
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault()
                      document.getElementById('csv-import-input')?.click()
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
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

        {/* Toolbar: View Toggle, Filters, and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          {/* Left: View Toggle and Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-muted/30">
              <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'grouped' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={viewMode === 'flat'}
                onCheckedChange={(checked) => setViewMode(checked ? 'flat' : 'grouped')}
                className="scale-75"
              />
              <LayoutList className={`w-3.5 h-3.5 ${viewMode === 'flat' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            {/* Inline Filters - Only in flat view */}
            {viewMode === 'flat' && (
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
                {(searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || groupFilter !== 'all' || invitedByFilter !== 'all') && (
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
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {filteredGuests.length}/{totalGuests}
                </span>
              </>
            )}

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
                  {(['phone', 'group', 'tags', 'status', 'dietary', 'invitedBy', 'inviteSent'] as const).map((key) => (
                    <button
                      key={key}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2"
                      onClick={() => toggleColumn(key)}
                    >
                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${visibleColumns[key] ? 'bg-primary border-primary' : 'border-border'}`}>
                        {visibleColumns[key] && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="capitalize">{key === 'inviteSent' ? 'Invite Sent' : key === 'invitedBy' ? 'Invited By' : key}</span>
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
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Name
                      </th>
                      {visibleColumns.phone && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Phone
                        </th>
                      )}
                      {visibleColumns.group && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Group
                        </th>
                      )}
                      {visibleColumns.tags && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Tags
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Status
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
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                                <MailCheck className="w-3.5 h-3.5" />
                                Sent
                              </span>
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

        {/* Grouped View - Guest Groups List */}
        {viewMode === 'grouped' && (
        <div className="space-y-3">
          {guestGroups.length === 0 && ungroupedGuests.length === 0 ? (
            <Card className="p-8 text-center border border-border">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-2">No guests yet</h3>
              <p className="text-sm text-muted-foreground mb-3">Create your first guest group or add individual guests</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => {
                  setSelectedGroupId(null)
                  setShowAddGuestModal(true)
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Guest
                </Button>
                <Button onClick={() => setShowAddGroupModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </Button>
              </div>
            </Card>
          ) : (
            <>
            {guestGroups.map((group) => (
              <Card key={group.id} className="border border-border overflow-hidden shadow-sm">
                {/* Group Header */}
                <div
                  className="p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{group.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          {group.phone_number && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {group.phone_number}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {group.guests.length} guest{group.guests.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Tags */}
                      <div className="flex gap-1">
                        {group.tags?.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {/* Group Status Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleGroupStatusUpdate(group, 'confirmed')}
                          title="Confirm all guests in group"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleGroupStatusUpdate(group, 'declined')}
                          title="Decline all guests in group"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          All
                        </Button>
                        {group.invitation_sent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 px-2">
                            <MailCheck className="w-3.5 h-3.5" />
                            Sent
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleSendGroupInvite(group)}
                            title="Send invite to this group"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Invite
                          </Button>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddGuestToGroup(group.id)}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditGroup(group)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guests Table */}
                {expandedGroups.has(group.id) && (
                  <div className="border-t border-border">
                    {group.guests.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <p className="mb-2">No guests in this group</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddGuestToGroup(group.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Guest
                        </Button>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/20 border-b border-border">
                          <tr>
                            <th className="px-2 py-3 text-left w-8">
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
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Name
                            </th>
                            {visibleColumns.phone && (
                              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Phone
                              </th>
                            )}
                            {visibleColumns.tags && (
                              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Tags
                              </th>
                            )}
                            {visibleColumns.status && (
                              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Status
                              </th>
                            )}
                            {visibleColumns.dietary && (
                              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Dietary
                              </th>
                            )}
                            {visibleColumns.invitedBy && (
                              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Invited By
                              </th>
                            )}
                            {visibleColumns.inviteSent && (
                              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Invite
                              </th>
                            )}
                            <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.guests.map((guest, index) => (
                            <tr
                              key={guest.id}
                              className={`border-b border-border hover:bg-muted/30 transition-colors ${
                                index % 2 === 0 ? "bg-background" : "bg-muted/10"
                              } ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""}`}
                            >
                              <td className="px-2 py-3">
                                <button
                                  onClick={() => toggleGuestSelection(guest.id)}
                                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                                    selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                                  }`}
                                >
                                  {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                                </button>
                              </td>
                              <td className="px-3 py-3 font-medium text-foreground">{guest.name}</td>
                              {visibleColumns.phone && (
                                <td className="px-3 py-3 text-muted-foreground text-sm">{guest.phone_number || "-"}</td>
                              )}
                              {visibleColumns.tags && (
                                <td className="px-3 py-3">
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
                              {visibleColumns.status && (
                                <td className="px-3 py-3">
                                  <select
                                    value={guest.confirmation_status}
                                    onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="declined">Declined</option>
                                  </select>
                                </td>
                              )}
                              {visibleColumns.dietary && (
                                <td className="px-3 py-3 text-muted-foreground text-sm">
                                  {guest.dietary_restrictions || "-"}
                                </td>
                              )}
                              {visibleColumns.invitedBy && (
                                <td className="px-3 py-3">
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
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </td>
                              )}
                              {visibleColumns.inviteSent && (
                                <td className="px-3 py-3 text-center">
                                  {guest.invitation_sent ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                                      <MailCheck className="w-3.5 h-3.5" />
                                      Sent
                                    </span>
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
                              <td className="px-3 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditGuest(guest)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteGuest(guest.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            ))}

          {/* Ungrouped Guests Section */}
          {ungroupedGuests.length > 0 && (
            <Card className="border border-border overflow-hidden shadow-sm mt-6">
              <div
                className="p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setShowUngroupedExpanded(!showUngroupedExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {showUngroupedExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">Ungrouped Guests</h3>
                      <span className="text-sm text-muted-foreground">
                        {ungroupedGuests.length} guest{ungroupedGuests.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {showUngroupedExpanded && (
                <div className="border-t border-border">
                  <table className="w-full">
                    <thead className="bg-muted/20 border-b border-border">
                      <tr>
                        <th className="px-2 py-3 text-left w-8">
                          <button
                            onClick={() => toggleSelectGroup(ungroupedGuests)}
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              isGroupFullySelected(ungroupedGuests)
                                ? 'bg-primary border-primary'
                                : isGroupPartiallySelected(ungroupedGuests)
                                  ? 'bg-primary/50 border-primary'
                                  : 'border-border'
                            }`}
                          >
                            {isGroupFullySelected(ungroupedGuests) && <Check className="w-3 h-3 text-primary-foreground" />}
                            {isGroupPartiallySelected(ungroupedGuests) && <div className="w-2 h-0.5 bg-primary-foreground" />}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Name
                        </th>
                        {visibleColumns.phone && (
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Phone
                          </th>
                        )}
                        {visibleColumns.tags && (
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Tags
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Status
                          </th>
                        )}
                        {visibleColumns.dietary && (
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Dietary
                          </th>
                        )}
                        {visibleColumns.invitedBy && (
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Invited By
                          </th>
                        )}
                        {visibleColumns.inviteSent && (
                          <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Invite
                          </th>
                        )}
                        <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ungroupedGuests.map((guest, index) => (
                        <tr
                          key={guest.id}
                          className={`border-b border-border hover:bg-muted/30 transition-colors ${
                            index % 2 === 0 ? "bg-background" : "bg-muted/10"
                          } ${selectedGuestIds.has(guest.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-2 py-3">
                            <button
                              onClick={() => toggleGuestSelection(guest.id)}
                              className={`w-4 h-4 border rounded flex items-center justify-center ${
                                selectedGuestIds.has(guest.id) ? 'bg-primary border-primary' : 'border-border'
                              }`}
                            >
                              {selectedGuestIds.has(guest.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">{guest.name}</td>
                          {visibleColumns.phone && (
                            <td className="px-3 py-3 text-muted-foreground text-sm">{guest.phone_number || "-"}</td>
                          )}
                          {visibleColumns.tags && (
                            <td className="px-3 py-3">
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
                          {visibleColumns.status && (
                            <td className="px-3 py-3">
                              <select
                                value={guest.confirmation_status}
                                onChange={(e) => handleUpdateGuestStatus(guest, e.target.value as 'pending' | 'confirmed' | 'declined')}
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-0 ${getStatusBadgeClass(guest.confirmation_status)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="declined">Declined</option>
                              </select>
                            </td>
                          )}
                          {visibleColumns.dietary && (
                            <td className="px-3 py-3 text-muted-foreground text-sm">
                              {guest.dietary_restrictions || "-"}
                            </td>
                          )}
                          {visibleColumns.invitedBy && (
                            <td className="px-3 py-3">
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
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.inviteSent && (
                            <td className="px-3 py-3 text-center">
                              {guest.invitation_sent ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                                  <MailCheck className="w-3.5 h-3.5" />
                                  Sent
                                </span>
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
                          <td className="px-3 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditGuest(guest)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGuest(guest.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
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
          </>
          )}
        </div>
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {(showAddGroupModal || editingGroup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
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

            <div className="space-y-4">
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
                <Input
                  value={groupForm.phoneNumber}
                  onChange={(e) => setGroupForm({ ...groupForm, phoneNumber: e.target.value })}
                  placeholder="e.g., +1 555 123 4567"
                />
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

              <div className="flex gap-2 pt-4">
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
            </div>
          </Card>
        </div>
      )}

      {/* Add/Edit Guest Modal */}
      {(showAddGuestModal || editingGuest) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
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

            <div className="space-y-4">
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
                  Group
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">No group</option>
                  {guestGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
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

              <div className="flex gap-2 pt-4">
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
                    <h2 className="text-xl font-semibold">Import Guests from CSV</h2>
                    <p className="text-sm text-muted-foreground">
                      Map your CSV columns to guest fields. {csvData.length} rows found.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetCsvImport}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
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
                  Map each CSV column to a guest field. Name is required. Leave unmapped for columns you don&apos;t need.
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
                                columnMapping[index.toString()] === 'name' 
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
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-red-500">*</span>
                  <span>Required field</span>
                  {!Object.values(columnMapping).includes('name') && (
                    <span className="ml-4 text-amber-600 font-medium">
                      ⚠️ Name field must be mapped
                    </span>
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
                  {csvData.length} guests will be imported as ungrouped guests
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetCsvImport}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCsvImport}
                    disabled={csvImporting || !Object.values(columnMapping).includes('name')}
                  >
                    {csvImporting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {csvData.length} Guests
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
    </main>
  )
}

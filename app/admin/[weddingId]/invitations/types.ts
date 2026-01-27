export interface Guest {
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
  // Extended fields for flat view
  groupName?: string
  allTags?: string[]
}

export interface GuestGroup {
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

export interface TimelineData {
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
  openEvents?: Array<{
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
}

export interface ColumnVisibility {
  phone: boolean
  group: boolean
  tags: boolean
  status: boolean
  dietary: boolean
  invitedBy: boolean
  inviteSent: boolean
  travelInfo: boolean
}

export interface GroupTravelForm {
  groupId: string
  groupName: string
  isTraveling: boolean
  travelingFrom: string
  travelArrangement: 'will_buy_ticket' | 'no_ticket_needed' | null
  noTicketReason: string
}

export const TAG_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-700 border-blue-200",
  friends: "bg-green-100 text-green-700 border-green-200",
  work: "bg-purple-100 text-purple-700 border-purple-200",
  neighbors: "bg-orange-100 text-orange-700 border-orange-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
}

export const PREDEFINED_TAGS = ["family", "friends", "work", "neighbors"]

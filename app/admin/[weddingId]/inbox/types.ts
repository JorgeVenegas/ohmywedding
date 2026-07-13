export interface Contact {
  id: string
  display_name: string | null
  external_address: string
  guest_id: string | null
}

export interface Conversation {
  id: string
  wedding_id: string
  contact_id: string
  status: "open" | "snoozed" | "closed"
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  session_expires_at: string | null
  contacts: Contact | null
}

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed"

export interface Message {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  sender_type: "guest" | "host" | "system" | "ai"
  body: string | null
  message_type: string
  status: MessageStatus
  error_code: string | null
  error_message: string | null
  created_at: string
}

export interface ContextGuest {
  id: string
  name: string
  confirmation_status: "pending" | "confirmed" | "declined"
  dietary_restrictions: string | null
  is_traveling: boolean | null
  traveling_from: string | null
  travel_arrangement: string | null
  tags: string[]
  guest_group_id: string | null
}

export interface ContextGroup {
  id: string
  name: string | null
  extra_passes: number
  extra_passes_confirmed: number
}

export interface GroupMember {
  id: string
  name: string
  confirmation_status: "pending" | "confirmed" | "declined"
  seat_number: number | null
  table_name: string | null
}

export interface DishAssignment {
  id: string
  dishes: { id: string; name: string; category: string } | null
}

export interface MenuAssignment {
  id: string
  menus: { id: string; name: string } | null
}

export interface MenuCourse {
  course_number: number
  course_name: string | null
  dish: { name: string; category: string } | null
}

export interface SeatAssignment {
  id: string
  seat_number: number | null
  seating_tables: { id: string; name: string } | null
}

export interface ConversationDetail {
  conversation: Conversation
  guest: ContextGuest | null
  group: ContextGroup | null
  groupMembers: GroupMember[]
  dishAssignment: DishAssignment | null
  menuAssignment: MenuAssignment | null
  menuCourses: MenuCourse[]
  seatAssignment: SeatAssignment | null
  rsvpRespondedAt: string | null
}

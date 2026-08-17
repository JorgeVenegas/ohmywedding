export type AIRole = 'guest' | 'couple' | 'partner' | 'planner' | 'planner_staff' | 'superadmin'

export type AIChannel = 'whatsapp' | 'planner_dashboard' | 'couple_dashboard' | 'staff_dashboard'

export interface AIIdentity {
  userId: string | null
  role: AIRole
  weddingId: string
  channel: AIChannel
}

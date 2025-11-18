// Client-side utility functions for wedding data formatting
// These functions don't require server components and can be used in client components

export function formatWeddingDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date TBD'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Date TBD'
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatWeddingTime(timeString: string | null | undefined): string {
  if (!timeString) return 'Time TBD'
  
  const [hours, minutes] = timeString.split(':')
  if (!hours || !minutes) return 'Time TBD'
  
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function calculateDaysUntilWedding(weddingDate: string | null | undefined): number {
  if (!weddingDate) return 0 // Return 0 if no date is set
  
  const wedding = new Date(weddingDate)
  if (isNaN(wedding.getTime())) return 0 // Return 0 if invalid date
  
  const today = new Date()
  const diffTime = wedding.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
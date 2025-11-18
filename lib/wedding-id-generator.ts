import { createClient } from "./supabase-client"

export async function generateWeddingIds(
  partner1: string,
  partner2: string,
  lastName1?: string | null,
  lastName2?: string | null,
  date?: Date | string | null,
): Promise<{ dateId: string; weddingNameId: string }> {
  const supabase = createClient()

  // Handle date input - generate dateId based on date or use placeholder
  let dateId: string;
  
  if (date) {
    // Handle date input - if it's a string, parse it as local date
    let parsedDate: Date;
    if (typeof date === 'string') {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day); // month is 0-based in Date constructor
    } else {
      parsedDate = date;
    }

    // Format date as MMDDYY
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
    const day = String(parsedDate.getDate()).padStart(2, "0")
    const year = String(parsedDate.getFullYear()).slice(-2)
    dateId = `${month}${day}${year}`
  } else {
    // Use current date as placeholder when no wedding date is provided
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const year = String(now.getFullYear()).slice(-2)
    dateId = `${month}${day}${year}`
  }

  // Create base name (first names only, lowercase, no spaces)
  const baseName = `${partner1.toLowerCase().replace(/\s+/g, "")}&${partner2.toLowerCase().replace(/\s+/g, "")}`
  let weddingNameId = baseName

  // Check for existing weddings with the same wedding_name_id (globally unique now)
  const { data: existing } = await supabase
    .from("weddings")
    .select("wedding_name_id")

  if (existing && existing.length > 0) {
    const existingNames = existing.map(w => w.wedding_name_id)
    
    // Check if base name exists
    if (existingNames.includes(baseName)) {
      // Try with last name initials
      const initial1 = lastName1 ? lastName1[0].toLowerCase() : ''
      const initial2 = lastName2 ? lastName2[0].toLowerCase() : ''
      const nameWithInitials = `${partner1.toLowerCase().replace(/\s+/g, "")}${initial1}&${partner2.toLowerCase().replace(/\s+/g, "")}${initial2}`
      
      if (!existingNames.includes(nameWithInitials)) {
        weddingNameId = nameWithInitials
      } else {
        // Add a numeric suffix
        let counter = 1
        while (existingNames.includes(`${nameWithInitials}-${counter}`)) {
          counter++
        }
        weddingNameId = `${nameWithInitials}-${counter}`
      }
    }
  }

  return { dateId, weddingNameId }
}

// Legacy function for backward compatibility
export async function generateWeddingId(
  partner1: string,
  partner2: string,
  lastName1: string,
  lastName2: string,
  date: Date,
): Promise<string> {
  const { dateId, weddingNameId } = await generateWeddingIds(partner1, partner2, lastName1, lastName2, date)
  return `${dateId}/${weddingNameId}`
}

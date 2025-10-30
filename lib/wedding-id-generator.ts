import { createClient } from "./supabase-client"

export async function generateWeddingIds(
  partner1: string,
  partner2: string,
  lastName1: string,
  lastName2: string,
  date: Date | string,
): Promise<{ dateId: string; weddingNameId: string }> {
  const supabase = createClient()

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
  const dateId = `${month}${day}${year}`

  // Create base name (first names only, lowercase, no spaces)
  const baseName = `${partner1.toLowerCase().replace(/\s+/g, "")}&${partner2.toLowerCase().replace(/\s+/g, "")}`
  let weddingNameId = baseName

  // Check for collisions
  const { data: existing } = await supabase
    .from("weddings")
    .select("date_id, wedding_name_id")
    .eq("date_id", dateId)
    .like("wedding_name_id", `${baseName}%`)

  if (existing && existing.length > 0) {
    // Append last initials for first collision
    const nameWithInitials = `${partner1.toLowerCase().replace(/\s+/g, "")}${lastName1[0].toLowerCase()}&${partner2.toLowerCase().replace(/\s+/g, "")}${lastName2[0].toLowerCase()}`
    weddingNameId = nameWithInitials

    // Check for further collisions
    const { data: existing2 } = await supabase
      .from("weddings")
      .select("date_id, wedding_name_id")
      .eq("date_id", dateId)
      .like("wedding_name_id", `${nameWithInitials}%`)

    if (existing2 && existing2.length > 0) {
      weddingNameId = `${nameWithInitials}-${existing2.length + 1}`
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

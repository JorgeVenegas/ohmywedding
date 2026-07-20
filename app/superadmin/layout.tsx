import { createServerSupabaseClient } from "@/lib/supabase-server"
import { isSuperUser } from "@/lib/superadmin"
import { redirect } from "next/navigation"
import { SuperadminSidebar } from "@/components/superadmin/sidebar"

export const dynamic = 'force-dynamic'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  
  // Check if user is authenticated
  // Handle refresh token errors gracefully
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.warn('[SuperAdmin] Auth error:', error.message)
      redirect('/login?redirect=/superadmin')
    }
    user = data.user
  } catch {
    redirect('/login?redirect=/superadmin')
  }
  
  if (!user) {
    redirect('/login?redirect=/superadmin')
  }
  
  // Check if user is a superuser
  if (!(await isSuperUser(supabase, { userId: user.id }))) {
    redirect('/')
  }
  
  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <div className="flex">
        <SuperadminSidebar userEmail={user.email || ''} />
        <main className="flex-1 ml-72 p-10">
          {children}
        </main>
      </div>
    </div>
  )
}

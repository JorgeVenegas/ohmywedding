import { createServerSupabaseClient } from "@/lib/supabase-server"
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
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('[SuperAdmin] User:', user?.id, user?.email)
  
  if (!user) {
    console.log('[SuperAdmin] No user, redirecting to login')
    redirect('/login?redirect=/superadmin')
  }
  
  // Check if user is a superuser
  const { data: superuser, error: superuserError } = await supabase
    .from('superusers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  console.log('[SuperAdmin] Superuser check:', { superuser, superuserError, userId: user.id })
  
  if (!superuser) {
    console.log('[SuperAdmin] Not a superuser, redirecting to home')
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

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Heart, Users, CreditCard, Activity, TrendingUp, Clock, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = await createServerSupabaseClient()
  
  // Get total weddings count
  const { count: weddingsCount } = await supabase
    .from('weddings')
    .select('*', { count: 'exact', head: true })
  
  // Get weddings by plan
  const { data: planStats } = await supabase
    .from('wedding_features')
    .select('plan')
  
  const planCounts = {
    free: 0,
    premium: 0,
    deluxe: 0
  }
  
  planStats?.forEach((row) => {
    const plan = row.plan || 'free'
    if (plan in planCounts) {
      planCounts[plan as keyof typeof planCounts]++
    }
  })
  
  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('superuser_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  return {
    weddingsCount: weddingsCount || 0,
    planCounts,
    recentActivity: recentActivity || []
  }
}

export default async function SuperadminDashboard() {
  const stats = await getStats()
  
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Superadmin Panel</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Dashboard</h1>
        <p className="text-[#420c14]/60 mt-2">
          Platform metrics and recent activity
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#420c14]/60">Total Weddings</p>
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#420c14]" />
            </div>
          </div>
          <p className="text-3xl font-serif text-[#420c14]">{stats.weddingsCount}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#420c14]/60">Free Plan</p>
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#420c14]/60" />
            </div>
          </div>
          <p className="text-3xl font-serif text-[#420c14]">{stats.planCounts.free}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-[#DDA46F]/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#420c14]/60">Premium Plan</p>
            <div className="w-10 h-10 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#DDA46F]" />
            </div>
          </div>
          <p className="text-3xl font-serif text-[#420c14]">{stats.planCounts.premium}</p>
        </div>
        
        <div className="bg-gradient-to-br from-[#420c14] to-[#5a1a22] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#f5f2eb]/70">Deluxe Plan</p>
            <div className="w-10 h-10 rounded-xl bg-[#DDA46F] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#420c14]" />
            </div>
          </div>
          <p className="text-3xl font-serif text-[#f5f2eb]">{stats.planCounts.deluxe}</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/superadmin/weddings" className="group">
            <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm hover:border-[#DDA46F] hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#420c14]/5 flex items-center justify-center group-hover:bg-[#DDA46F]/10 transition-colors">
                    <Heart className="w-6 h-6 text-[#420c14]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#420c14]">Manage Weddings</h3>
                    <p className="text-sm text-[#420c14]/60">Search & change plans</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#420c14]/30 group-hover:text-[#DDA46F] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
          
          <Link href="/superadmin/plans" className="group">
            <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm hover:border-[#DDA46F] hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#420c14]/5 flex items-center justify-center group-hover:bg-[#DDA46F]/10 transition-colors">
                    <CreditCard className="w-6 h-6 text-[#420c14]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#420c14]">Plan Features</h3>
                    <p className="text-sm text-[#420c14]/60">Configure limits</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#420c14]/30 group-hover:text-[#DDA46F] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
          
          <Link href="/superadmin/subscriptions" className="group">
            <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm hover:border-[#DDA46F] hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#420c14]/5 flex items-center justify-center group-hover:bg-[#DDA46F]/10 transition-colors">
                    <Activity className="w-6 h-6 text-[#420c14]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#420c14]">Subscriptions</h3>
                    <p className="text-sm text-[#420c14]/60">View payments</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#420c14]/30 group-hover:text-[#DDA46F] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F]">Recent Activity</p>
          {stats.recentActivity.length > 0 && (
            <Link 
              href="/superadmin/activity" 
              className="text-sm text-[#DDA46F] hover:text-[#c99560] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
          {stats.recentActivity.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
              <p className="text-[#420c14]/60">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#420c14]/5">
              {stats.recentActivity.map((activity: {
                id: string
                action_type: string
                target_type: string
                target_name: string
                reason: string
                created_at: string
                superuser_id: string
              }) => (
                <div key={activity.id} className="flex items-start gap-4 p-5 hover:bg-[#420c14]/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#DDA46F]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-[#DDA46F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-[#420c14]/5 text-[#420c14] rounded-lg font-medium">
                        {activity.action_type}
                      </span>
                      <span className="text-xs text-[#420c14]/40">
                        by {activity.superuser_id.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm text-[#420c14]/80 mt-1">
                      {activity.target_type}: <span className="font-medium text-[#420c14]">{activity.target_name}</span>
                    </p>
                    {activity.reason && (
                      <p className="text-sm text-[#420c14]/50 mt-1 italic">
                        &ldquo;{activity.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#420c14]/40 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

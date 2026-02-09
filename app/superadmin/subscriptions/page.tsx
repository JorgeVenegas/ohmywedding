import { createServerSupabaseClient } from "@/lib/supabase-server"
import { CreditCard, Calendar, User, Crown, TrendingUp, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export const dynamic = 'force-dynamic'

async function getSubscriptions() {
  const supabase = await createServerSupabaseClient()
  
  // Get wedding subscriptions with owner info
  const { data, error } = await supabase
    .from('wedding_subscriptions')
    .select('*, weddings(id, partner1_first_name, partner2_first_name, owner_id)')
    .order('updated_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }
  
  return data || []
}

export default async function SubscriptionsPage() {
  const subscriptions = await getSubscriptions()
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        )
      case 'trial': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Trial
          </span>
        )
      case 'cancelled': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        )
      case 'expired': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 text-xs font-medium">
            Expired
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 text-xs font-medium">
            {status}
          </span>
        )
    }
  }
  
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'deluxe': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#420c14] to-[#5a1a22] text-[#f5f2eb] text-xs font-medium">
            <Crown className="w-3 h-3 text-[#DDA46F]" />
            Deluxe
          </span>
        )
      case 'premium': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DDA46F]/10 text-[#DDA46F] text-xs font-medium border border-[#DDA46F]/30">
            <TrendingUp className="w-3 h-3" />
            Premium
          </span>
        )
      case 'free':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 text-xs font-medium">
            Free
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 text-xs font-medium">
            {plan || 'Unknown'}
          </span>
        )
    }
  }
  
  // Calculate stats
  const stats = {
    total: subscriptions.length,
    premium: subscriptions.filter(s => s.plan === 'premium').length,
    deluxe: subscriptions.filter(s => s.plan === 'deluxe').length,
    free: subscriptions.filter(s => s.plan === 'free').length,
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Payments</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Subscriptions</h1>
        <p className="text-[#420c14]/60 mt-2">
          Wedding subscription plans and payment tracking
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3">Total Subscriptions</p>
          <p className="text-3xl font-serif text-[#420c14]">{stats.total}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3">Free Plan</p>
          <p className="text-3xl font-serif text-[#420c14]/40">{stats.free}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-[#DDA46F]/30 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3">Premium</p>
          <p className="text-3xl font-serif text-[#DDA46F]">{stats.premium}</p>
        </div>
        
        <div className="bg-gradient-to-br from-[#420c14] to-[#5a1a22] rounded-2xl p-6 shadow-lg">
          <p className="text-sm font-medium text-[#f5f2eb]/70 mb-3">Deluxe</p>
          <p className="text-3xl font-serif text-[#f5f2eb]">{stats.deluxe}</p>
        </div>

        <Link href="/superadmin/subscriptions/funnel">
          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Conversion Funnel
            </p>
            <p className="text-sm text-blue-600/60">View analytics →</p>
          </div>
        </Link>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/superadmin/subscriptions/payments">
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-[#420c14]">Payment Records</p>
                <p className="text-sm text-[#420c14]/60">Track payment lifecycle and revenue →</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/superadmin/subscriptions/funnel">
          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-[#420c14]">Conversion Funnel</p>
                <p className="text-sm text-[#420c14]/60">View funnel analytics →</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Subscriptions List */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#420c14]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#420c14]" />
            </div>
            <div>
              <h2 className="font-medium text-[#420c14]">All Subscriptions</h2>
              <p className="text-sm text-[#420c14]/60">Active wedding subscriptions</p>
            </div>
          </div>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
            <p className="text-[#420c14]/60">No subscriptions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5">
            {subscriptions.map((sub: any) => (
              <div 
                key={sub.id}
                className="flex items-center justify-between p-5 hover:bg-[#420c14]/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#420c14]/40" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#420c14] mb-1">
                      {sub.weddings?.partner1_first_name} & {sub.weddings?.partner2_first_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#420c14]/50">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      <span className="font-mono text-xs bg-[#420c14]/5 px-2 py-0.5 rounded">
                        {sub.wedding_id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getPlanBadge(sub.plan)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

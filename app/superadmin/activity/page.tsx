import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Activity, Clock, ChevronRight, Settings, CreditCard, Heart } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

export const dynamic = 'force-dynamic'

async function getActivityLogs() {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('superuser_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }
  
  return data || []
}

export default async function ActivityLogPage() {
  const logs = await getActivityLogs()
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'plan_change': 
        return <CreditCard className="w-5 h-5 text-[#DDA46F]" />
      case 'feature_update': 
        return <Settings className="w-5 h-5 text-blue-500" />
      case 'wedding_edit': 
        return <Heart className="w-5 h-5 text-[#420c14]" />
      default: 
        return <Activity className="w-5 h-5 text-[#420c14]/40" />
    }
  }
  
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'plan_change': 
        return (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#DDA46F]/10 text-[#DDA46F] font-medium">
            Plan Change
          </span>
        )
      case 'feature_update': 
        return (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium">
            Feature Update
          </span>
        )
      case 'wedding_edit': 
        return (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#420c14]/10 text-[#420c14] font-medium">
            Wedding Edit
          </span>
        )
      default: 
        return (
          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#420c14]/5 text-[#420c14]/60 font-medium">
            {action.replace('_', ' ')}
          </span>
        )
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Audit</p>
        <h1 className="text-4xl font-serif text-[#420c14]">Activity Log</h1>
        <p className="text-[#420c14]/60 mt-2">
          All actions performed by superusers
        </p>
      </div>
      
      {/* Activity List */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#420c14]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#420c14]" />
            </div>
            <div>
              <h2 className="font-medium text-[#420c14]">Activity History</h2>
              <p className="text-sm text-[#420c14]/60">Audit trail of all superuser actions</p>
            </div>
          </div>
        </div>
        
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
            <p className="text-[#420c14]/60">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5">
            {logs.map((log) => (
              <div 
                key={log.id}
                className="p-5 hover:bg-[#420c14]/[0.02] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f5f2eb] flex items-center justify-center flex-shrink-0">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-[#420c14]/50 bg-[#420c14]/5 px-2 py-0.5 rounded">
                        {log.superuser_id.slice(0, 8)}...
                      </span>
                      {getActionBadge(log.action_type)}
                    </div>
                    
                    <p className="text-sm text-[#420c14]/80 mt-2">
                      {log.target_type}: <span className="font-medium text-[#420c14]">{log.target_name}</span>
                    </p>
                    
                    {/* Show old -> new value */}
                    {log.old_value && log.new_value && (
                      <div className="flex items-center gap-2 text-sm mt-3">
                        <code className="px-2.5 py-1 bg-red-50 rounded-lg text-red-600 text-xs font-mono">
                          {JSON.stringify(log.old_value)}
                        </code>
                        <ChevronRight className="w-4 h-4 text-[#420c14]/30" />
                        <code className="px-2.5 py-1 bg-green-50 rounded-lg text-green-600 text-xs font-mono">
                          {JSON.stringify(log.new_value)}
                        </code>
                      </div>
                    )}
                    
                    {/* Reason */}
                    {log.reason && (
                      <p className="text-sm text-[#420c14]/50 mt-3 italic border-l-2 border-[#DDA46F]/30 pl-3">
                        &ldquo;{log.reason}&rdquo;
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-[#420c14]/40 mt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="text-[#420c14]/30">
                        ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true })})
                      </span>
                      {log.ip_address && log.ip_address !== 'unknown' && (
                        <span className="font-mono bg-[#420c14]/5 px-2 py-0.5 rounded">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

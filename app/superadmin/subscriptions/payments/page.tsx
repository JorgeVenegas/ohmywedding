"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { format } from "date-fns"
import Link from "next/link"
import {
  CreditCard,
  Calendar,
  User,
  Crown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Banknote,
  Eye,
  ShoppingCart,
} from "lucide-react"

interface SubscriptionPayment {
  id: string
  wedding_id: string
  wedding_subscription_id: string | null
  user_id: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  source: string
  to_plan: string | null
  amount_cents: number
  currency: string
  status: string
  metadata: Record<string, unknown> | null
  visited_at: string
  checkout_started_at: string | null
  action_required_at: string | null
  completed_at: string | null
  failed_at: string | null
  created_at: string
  updated_at: string
  weddings?: {
    id: string
    partner1_first_name: string | null
    partner2_first_name: string | null
    wedding_name_id: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  visited: {
    label: "Visited",
    icon: Eye,
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
  checkout_started: {
    label: "Checkout",
    icon: ShoppingCart,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  processing: {
    label: "Processing",
    icon: RefreshCw,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  requires_action: {
    label: "Requires Action",
    icon: AlertTriangle,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  expired: {
    label: "Expired",
    icon: Clock,
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
  refunded: {
    label: "Refunded",
    icon: RefreshCw,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  abandoned: {
    label: "Abandoned",
    icon: XCircle,
    className: "bg-gray-50 text-gray-400 border-gray-200",
  },
}

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_orders")
        .select("*, weddings(id, partner1_first_name, partner2_first_name, wedding_name_id)")
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching subscription payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPayments = filterStatus === "all"
    ? payments
    : payments.filter((p) => p.status === filterStatus)

  // Stats
  const totalPayments = payments.length
  const completedPayments = payments.filter((p) => p.status === "completed")
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount_cents, 0)
  const pendingPayments = payments.filter((p) =>
    ["pending", "processing", "requires_action"].includes(p.status)
  )
  const failedPayments = payments.filter((p) => p.status === "failed")
  const statuses = Array.from(new Set(payments.map((p) => p.status)))

  const getPlanBadge = (plan: string | null) => {
    if (!plan) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
          Undecided
        </span>
      )
    }
    if (plan === "deluxe") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#420c14] to-[#5a1a22] text-[#f5f2eb] text-[10px] font-medium">
          <Crown className="w-2.5 h-2.5 text-[#DDA46F]" />
          Deluxe
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DDA46F]/10 text-[#DDA46F] text-[10px] font-medium border border-[#DDA46F]/30">
        <TrendingUp className="w-2.5 h-2.5" />
        Premium
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.className}`}>
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </span>
    )
  }

  const formatAmount = (cents: number, currency: string) => {
    const amount = cents / 100
    if (currency === "mxn") {
      return `$${amount.toLocaleString("es-MX")} MXN`
    }
    return `$${amount.toLocaleString("en-US")} ${currency.toUpperCase()}`
  }

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Payments</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Subscription Payments</h1>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DDA46F]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#DDA46F] mb-2">Payments</p>
          <h1 className="text-4xl font-serif text-[#420c14]">Subscription Payments</h1>
          <p className="text-[#420c14]/60 mt-2">
            Track payment lifecycle for subscription upgrades
          </p>
        </div>
        <Link
          href="/superadmin/subscriptions"
          className="inline-flex items-center gap-2 text-sm text-[#420c14]/60 hover:text-[#420c14] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#420c14]/10 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Total Payments
          </p>
          <p className="text-3xl font-serif text-[#420c14]">{totalPayments}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/50 shadow-sm">
          <p className="text-sm font-medium text-emerald-700/70 mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Revenue
          </p>
          <p className="text-3xl font-serif text-emerald-700">
            {formatAmount(totalRevenue, "mxn")}
          </p>
          <p className="text-xs text-emerald-600/60 mt-1">
            {completedPayments.length} completed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-amber-200/50 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending
          </p>
          <p className="text-3xl font-serif text-amber-600">{pendingPayments.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-red-200/50 shadow-sm">
          <p className="text-sm font-medium text-[#420c14]/60 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            Failed
          </p>
          <p className="text-3xl font-serif text-red-500">{failedPayments.length}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-[#420c14] text-[#f5f2eb]"
              : "bg-white text-[#420c14]/60 border border-[#420c14]/10 hover:bg-[#420c14]/5"
          }`}
        >
          All ({totalPayments})
        </button>
        {statuses.map((status) => {
          const config = STATUS_CONFIG[status]
          const count = payments.filter((p) => p.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filterStatus === status
                  ? "bg-[#420c14] text-[#f5f2eb]"
                  : "bg-white text-[#420c14]/60 border border-[#420c14]/10 hover:bg-[#420c14]/5"
              }`}
            >
              {config?.label || status} ({count})
            </button>
          )
        })}
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-2xl border border-[#420c14]/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#420c14]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#420c14]/5 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#420c14]" />
            </div>
            <div>
              <h2 className="font-medium text-[#420c14]">Payment Records</h2>
              <p className="text-sm text-[#420c14]/60">
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-[#420c14]/20 mx-auto mb-4" />
            <p className="text-[#420c14]/60">
              {payments.length === 0 ? "No subscription payments yet" : "No payments match this filter"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#420c14]/5">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-5 hover:bg-[#420c14]/[0.02] transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_0.8fr] gap-4 items-center">
                  {/* Column 1: Wedding + User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#420c14]/5 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#420c14]/40" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-[#420c14] truncate">
                          {payment.weddings?.partner1_first_name && payment.weddings?.partner2_first_name
                            ? `${payment.weddings.partner1_first_name} & ${payment.weddings.partner2_first_name}`
                            : payment.weddings?.wedding_name_id || "Unknown"}
                        </span>
                        {getPlanBadge(payment.to_plan)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#420c14]/50">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(payment.created_at), "MMM d, yyyy h:mm a")}</span>
                      </div>
                      {payment.stripe_payment_intent_id && (
                        <div className="mt-1">
                          <span className="font-mono text-[10px] bg-[#420c14]/5 px-1.5 py-0.5 rounded text-[#420c14]/40">
                            {payment.stripe_payment_intent_id.slice(0, 20)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Status + Subscription Link */}
                  <div className="flex flex-col gap-1.5">
                    {getStatusBadge(payment.status)}
                    {payment.wedding_subscription_id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Subscription linked
                      </span>
                    ) : payment.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Not linked
                      </span>
                    ) : null}
                    {payment.completed_at && (
                      <span className="text-[10px] text-[#420c14]/40">
                        Completed {format(new Date(payment.completed_at), "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>

                  {/* Column 3: Amount */}
                  <div className="flex flex-col items-end">
                    <p className="text-xl font-serif text-[#420c14]">
                      {formatAmount(payment.amount_cents, payment.currency)}
                    </p>
                    <span className="text-[10px] text-[#420c14]/40 uppercase">
                      {payment.currency}
                    </span>
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

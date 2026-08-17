"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Heart,
  Settings2,
  CreditCard,
  Activity,
  Crown,
  LogOut,
  ExternalLink,
  Ticket,
  Tag,
  Award,
  SlidersHorizontal,
  FileText,
  CalendarCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface SuperadminSidebarProps {
  userEmail: string
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  { title: "Dashboard",    href: "/superadmin",                icon: LayoutDashboard },
  { title: "Weddings",     href: "/superadmin/weddings",       icon: Heart },
  { title: "Plan Features",href: "/superadmin/plans",          icon: Settings2 },
  { title: "Subscriptions",href: "/superadmin/subscriptions",  icon: CreditCard },
  { title: "Quotes",       href: "/superadmin/quotes",         icon: FileText },
  { title: "Bookings",     href: "/superadmin/bookings",       icon: CalendarCheck },
  { title: "Coupons",      href: "/superadmin/coupons",        icon: Ticket },
  { title: "Promotions",   href: "/superadmin/promotions",     icon: Tag },
  { title: "Certificates", href: "/superadmin/certificates",   icon: Award },
  { title: "Activity Log", href: "/superadmin/activity",       icon: Activity },
  { title: "Settings",     href: "/superadmin/settings",       icon: SlidersHorizontal },
]

export function SuperadminSidebar({ userEmail, collapsed = false, onToggle }: SuperadminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#420c14] text-white flex flex-col shadow-2xl transition-[width] duration-300 ease-in-out overflow-hidden z-30",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className={cn("border-b border-[#5a1a22] flex-shrink-0", collapsed ? "p-3" : "p-6")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#DDA46F] flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-[#420c14]" />
            </div>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#f5f2eb]/50 hover:text-[#f5f2eb] hover:bg-[#5a1a22] transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="relative w-36 h-10">
                <Image
                  src="/images/logos/OMW Logo Gold.png"
                  alt="OhMyWedding"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#f5f2eb]/40 hover:text-[#f5f2eb] hover:bg-[#5a1a22] transition-colors flex-shrink-0 mt-0.5"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#DDA46F] flex items-center justify-center">
                <Crown className="w-3 h-3 text-[#420c14]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#DDA46F]">Superadmin Panel</p>
            </div>
            <p className="text-xs text-[#f5f2eb]/60 truncate mt-2">{userEmail}</p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto", collapsed ? "p-2 pt-4" : "p-5 pt-4")}>
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#DDA46F]/60 mb-3 px-4">Menu</p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/superadmin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-4 py-3",
                isActive
                  ? "bg-[#DDA46F] text-[#420c14] shadow-lg shadow-[#DDA46F]/20"
                  : "text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb]"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-4.5 h-4.5" : "w-5 h-5", isActive && "text-[#420c14]")} style={collapsed ? { width: 18, height: 18 } : undefined} />
              {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-[#5a1a22] flex-shrink-0", collapsed ? "p-2 space-y-1" : "p-5 space-y-1")}>
        <Link
          href="/"
          title={collapsed ? "View Site" : undefined}
          className={cn(
            "flex items-center text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb] rounded-xl transition-all duration-200",
            collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-4 py-3"
          )}
        >
          <ExternalLink className="flex-shrink-0" style={{ width: 18, height: 18 }} />
          {!collapsed && <span className="font-medium text-sm">View Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb] rounded-xl transition-all duration-200",
            collapsed ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-4 py-3"
          )}
        >
          <LogOut className="flex-shrink-0" style={{ width: 18, height: 18 }} />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  )
}

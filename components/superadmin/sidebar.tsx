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
  Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface SuperadminSidebarProps {
  userEmail: string
}

const navItems = [
  {
    title: "Dashboard",
    href: "/superadmin",
    icon: LayoutDashboard,
  },
  {
    title: "Weddings",
    href: "/superadmin/weddings",
    icon: Heart,
  },
  {
    title: "Plan Features",
    href: "/superadmin/plans",
    icon: Settings2,
  },
  {
    title: "Subscriptions",
    href: "/superadmin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Coupons",
    href: "/superadmin/coupons",
    icon: Ticket,
  },
  {
    title: "Activity Log",
    href: "/superadmin/activity",
    icon: Activity,
  },
]

export function SuperadminSidebar({ userEmail }: SuperadminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-[#420c14] text-white flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-[#5a1a22]">
        <div className="mb-3">
          <div className="relative w-44 h-12">
            <Image
              src="/images/logos/OMW Logo Gold.png"
              alt="OhMyWedding"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#DDA46F] flex items-center justify-center">
            <Crown className="w-3 h-3 text-[#420c14]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#DDA46F]">Superadmin Panel</p>
        </div>
        <p className="text-xs text-[#f5f2eb]/60 truncate mt-2">{userEmail}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#DDA46F]/60 mb-4 px-4">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/superadmin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-[#DDA46F] text-[#420c14] shadow-lg shadow-[#DDA46F]/20" 
                  : "text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-[#420c14]")} />
              <span className="font-medium text-sm">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-[#5a1a22] space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb] rounded-xl transition-all duration-300"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="font-medium text-sm">View Site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#f5f2eb]/70 hover:bg-[#5a1a22] hover:text-[#f5f2eb] rounded-xl transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}

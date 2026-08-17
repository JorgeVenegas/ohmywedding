"use client"

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "./sidebar"

interface SuperadminShellProps {
  children: React.ReactNode
  userEmail: string
}

export function SuperadminShell({ children, userEmail }: SuperadminShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('superadmin-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('superadmin-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-[#f5f2eb]">
      <SuperadminSidebar userEmail={userEmail} collapsed={collapsed} onToggle={toggle} />
      <main
        className="flex-1 p-10 transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: !mounted ? 288 : collapsed ? 64 : 288 }}
      >
        {children}
      </main>
    </div>
  )
}

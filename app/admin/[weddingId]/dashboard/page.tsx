"use client"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, ArrowRight, Mail, Gift, Settings } from "lucide-react"
import { Header } from "@/components/header"
import { UpdateWeddingNameId } from "@/components/ui/update-wedding-name-id"
import { getCleanAdminUrl } from "@/lib/admin-url"
import { getWeddingPath } from "@/lib/wedding-url"

interface AdminDashboardProps {
  params: Promise<{ weddingId: string }>
}

export default function AdminDashboard({ params }: AdminDashboardProps) {
  const { weddingId } = use(params)
  const decodedWeddingId = decodeURIComponent(weddingId)

  const sections = [
    {
      title: "Invitations & Guests",
      description: "Manage guest groups, invitations, RSVPs, and track confirmations",
      icon: Mail,
      href: getCleanAdminUrl(weddingId, 'invitations'),
      color: "primary",
    },
    {
      title: "Gift Registry",
      description: "Manage your wedding gift registries and wishlists",
      icon: Gift,
      href: getCleanAdminUrl(weddingId, 'registry'),
      color: "accent",
    },
    {
      title: "Settings",
      description: "Configure features, RSVP options, invitations, and general preferences",
      icon: Settings,
      href: getCleanAdminUrl(weddingId, 'settings'),
      color: "secondary",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header
        rightContent={
          <div className="flex gap-2">
            <Link href={getWeddingPath(weddingId)}>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
                View Website
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back!</h1>
          <p className="text-lg text-muted-foreground">Manage your wedding website and guest information</p>
        </div>

        {/* Management Sections */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Management</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => {
              const Icon = section.icon
              const colorClasses = {
                primary: "border-primary/20 hover:border-primary/50 hover:bg-primary/5",
                secondary: "border-secondary/20 hover:border-secondary/50 hover:bg-secondary/5",
                accent: "border-accent/20 hover:border-accent/50 hover:bg-accent/5",
              }
              const iconColorClasses = {
                primary: "text-primary",
                secondary: "text-secondary",
                accent: "text-accent",
              }
              return (
                <Link key={index} href={section.href}>
                  <Card
                    className={`p-6 border transition-all duration-300 cursor-pointer h-full ${
                      colorClasses[section.color as keyof typeof colorClasses]
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3 rounded-lg ${
                          section.color === "primary"
                            ? "bg-primary/10"
                            : section.color === "secondary"
                              ? "bg-secondary/10"
                              : "bg-accent/10"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${iconColorClasses[section.color as keyof typeof iconColorClasses]}`}
                        />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>
          <UpdateWeddingNameId currentWeddingNameId={decodedWeddingId} />
        </div>
      </div>
    </main>
  )
}

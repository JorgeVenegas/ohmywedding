"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, ImageIcon, MessageSquare, Settings, LogOut, BarChart3, CheckCircle2, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"

export default function AdminDashboard({ params }: { params: { weddingId: string } }) {
  const stats = [
    { label: "Total Guests", value: "142", icon: Users, color: "primary" },
    { label: "RSVPs Received", value: "98", icon: CheckCircle2, color: "secondary" },
    { label: "Guest Photos", value: "24", icon: ImageIcon, color: "accent" },
    { label: "Messages", value: "15", icon: MessageSquare, color: "primary" },
  ]

  const sections = [
    {
      title: "Wedding Details",
      description: "Update your wedding information, colors, and story",
      icon: Settings,
      href: `/admin/${params.weddingId}/details`,
      color: "primary",
    },
    {
      title: "Guest List & RSVPs",
      description: "View RSVPs, manage guest list, and track attendance",
      icon: Users,
      href: `/admin/${params.weddingId}/guests`,
      color: "secondary",
    },
    {
      title: "Gallery",
      description: "Upload and manage your engagement photos",
      icon: ImageIcon,
      href: `/admin/${params.weddingId}/gallery`,
      color: "accent",
    },
    {
      title: "Guest Moments",
      description: "Review and approve photos uploaded by guests",
      icon: ImageIcon,
      href: `/admin/${params.weddingId}/moments`,
      color: "primary",
    },
    {
      title: "Guest Messages",
      description: "Read well-wishes and messages from your guests",
      icon: MessageSquare,
      href: `/admin/${params.weddingId}/messages`,
      color: "secondary",
    },
    {
      title: "Analytics",
      description: "View website traffic and engagement metrics",
      icon: BarChart3,
      href: `/admin/${params.weddingId}/analytics`,
      color: "accent",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header
        rightContent={
          <div className="flex gap-2">
            <Link href={`/${params.weddingId}`}>
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

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              primary: "bg-primary/10 text-primary",
              secondary: "bg-secondary/10 text-secondary",
              accent: "bg-accent/10 text-accent",
            }
            return (
              <Card key={index} className="p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )
          })}
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
      </div>
    </main>
  )
}

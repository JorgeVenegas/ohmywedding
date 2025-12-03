"use client"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Filter, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Header } from "@/components/header"

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>
}

export default function GuestsPage({ params }: GuestsPageProps) {
  const { weddingId } = use(params)
  const guests = [
    { id: 1, name: "John Smith", email: "john@example.com", status: "Attending", companions: 1 },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", status: "Attending", companions: 0 },
    { id: 3, name: "Michael Brown", email: "michael@example.com", status: "Not Attending", companions: 0 },
    { id: 4, name: "Emily Davis", email: "emily@example.com", status: "Pending", companions: 2 },
    { id: 5, name: "David Wilson", email: "david@example.com", status: "Attending", companions: 1 },
  ]

  const stats = [
    { label: "Total Invited", value: "142", color: "primary" },
    { label: "Attending", value: "98", color: "secondary" },
    { label: "Not Attending", value: "28", color: "destructive" },
    { label: "Pending", value: "16", color: "muted" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Attending":
        return <CheckCircle2 className="w-4 h-4 text-secondary" />
      case "Not Attending":
        return <XCircle className="w-4 h-4 text-destructive" />
      case "Pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Attending":
        return "bg-secondary/10 text-secondary border border-secondary/20"
      case "Not Attending":
        return "bg-destructive/10 text-destructive border border-destructive/20"
      case "Pending":
        return "bg-muted text-muted-foreground border border-border"
      default:
        return ""
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Header
        showBackButton
        backHref={`/admin/${weddingId}/dashboard`}
        title="Guest List"
        rightContent={
          <Button size="sm" variant="outline" className="border-border bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        }
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Guest List</h1>
          <p className="text-muted-foreground">Manage RSVPs and track guest attendance</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 border border-border shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button variant="outline" className="border-border bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Companions
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest, index) => (
                  <tr
                    key={guest.id}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{guest.name}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{guest.email}</td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(guest.status)}`}
                      >
                        {getStatusIcon(guest.status)}
                        {guest.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">{guest.companions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  )
}

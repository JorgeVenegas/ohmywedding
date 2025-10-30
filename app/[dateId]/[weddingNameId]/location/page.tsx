"use client"
import { Card } from "@/components/ui/card"
import { MapPin, Phone, ParkingCircle } from "lucide-react"
import { Header } from "@/components/header"

interface LocationPageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { dateId, weddingNameId } = await params
  
  return <LocationPageClient dateId={dateId} weddingNameId={weddingNameId} />
}

function LocationPageClient({ dateId, weddingNameId }: { dateId: string; weddingNameId: string }) {
  const venues = [
    {
      name: "The Grand Ballroom",
      type: "Ceremony",
      address: "123 Main Street, Downtown",
      phone: "(555) 123-4567",
      parking: "Valet parking available",
      icon: "🏛️",
    },
    {
      name: "The Garden Estate",
      type: "Reception",
      address: "456 Oak Avenue, Countryside",
      phone: "(555) 987-6543",
      parking: "Free parking on-site",
      icon: "🌳",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header showBackButton backHref={`/${dateId}/${weddingNameId}`} title="Location" />

      {/* Venues */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Venues & Directions</h1>
          <p className="text-muted-foreground">Find us at these beautiful locations</p>
        </div>
        <div className="space-y-8">
          {venues.map((venue, index) => (
            <Card key={index} className="p-8 sm:p-10 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">{venue.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{venue.name}</h2>
                  <p className="text-sm font-semibold text-primary mt-1">{venue.type}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">ADDRESS</p>
                    <p className="text-foreground">{venue.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">PHONE</p>
                    <p className="text-foreground">{venue.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ParkingCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">PARKING</p>
                    <p className="text-foreground">{venue.parking}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
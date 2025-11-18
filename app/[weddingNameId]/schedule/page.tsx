"use client"
import { Card } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { WeddingFooter } from "@/components/wedding-footer"

interface SchedulePageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { dateId, weddingNameId } = await params
  
  return <SchedulePageClient dateId={dateId} weddingNameId={weddingNameId} />
}

function SchedulePageClient({ dateId, weddingNameId }: { dateId: string; weddingNameId: string }) {
  const schedule = [
    { time: "3:00 PM", event: "Ceremony Begins", location: "The Grand Ballroom" },
    { time: "4:00 PM", event: "Cocktail Hour", location: "Garden Terrace" },
    { time: "5:00 PM", event: "Reception Dinner", location: "The Garden Estate" },
    { time: "6:30 PM", event: "Toasts & Dancing", location: "The Garden Estate" },
    { time: "11:00 PM", event: "Send Off", location: "The Garden Estate" },
  ]

  return (
    <main className="min-h-screen bg-background">

      {/* Timeline */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Wedding Day Timeline</h1>
          <p className="text-muted-foreground">Here's what to expect on our special day</p>
        </div>
        <div className="space-y-4">
          {schedule.map((item, index) => (
            <Card key={index} className="p-6 border border-border hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  {index < schedule.length - 1 && <div className="w-1 h-12 bg-border mt-2" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">{item.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.event}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <WeddingFooter />
    </main>
  )
}
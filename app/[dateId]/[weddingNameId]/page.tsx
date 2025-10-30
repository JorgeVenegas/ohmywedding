import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Heart } from "lucide-react"
import { getWeddingByDateAndNameId, formatWeddingDate, formatWeddingTime, calculateDaysUntilWedding, type Wedding } from "@/lib/wedding-data"
import { notFound } from "next/navigation"

// Default schedule template
const defaultSchedule = [
  { time: "3:30 PM", event: "Guest Arrival & Cocktails" },
  { time: "4:00 PM", event: "Ceremony Begins" },
  { time: "4:45 PM", event: "Recessional & Photos" },
  { time: "5:30 PM", event: "Cocktail Hour" },
  { time: "6:30 PM", event: "Reception & Dinner" },
  { time: "8:00 PM", event: "Toasts & Dancing" },
  { time: "11:00 PM", event: "Send Off" },
]

// Default FAQs template
const defaultFaqs = [
  {
    question: "What is the dress code?",
    answer: "Black tie optional. We want you to feel comfortable and look your best!",
  },
  {
    question: "Can I bring a plus one?",
    answer: "Please refer to your invitation. If a plus one is invited, their name will be listed.",
  },
  {
    question: "Is there parking available?",
    answer: "Yes, complimentary parking is available at both venues. Valet service will be provided.",
  },
  {
    question: "What about dietary restrictions?",
    answer: "Please indicate any dietary restrictions in your RSVP. We'll make sure to accommodate you!",
  },
  {
    question: "Will there be a vegetarian option?",
    answer: "Yes, vegetarian and vegan options will be available. Please let us know your preference.",
  },
  {
    question: "Can I take photos during the ceremony?",
    answer:
      "We ask that you refrain from taking photos during the ceremony to preserve the moment for our photographer.",
  },
]

interface WeddingPageProps {
  params: Promise<{ dateId: string; weddingNameId: string }>
}

export default async function WeddingPage({ params }: WeddingPageProps) {
  const { dateId, weddingNameId } = await params
  const wedding = await getWeddingByDateAndNameId(dateId, weddingNameId)

  if (!wedding) {
    notFound()
  }

  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  const formattedDate = formatWeddingDate(wedding.wedding_date)
  const formattedTime = formatWeddingTime(wedding.wedding_time)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-green-50 to-orange-100">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full text-orange-700 font-medium mb-8 shadow-lg">
            <Heart className="w-4 h-4 fill-current" />
            {daysUntil > 0 ? `${daysUntil} days until the big day` : daysUntil === 0 ? "Today is the day!" : "Just married!"}
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-slate-800 mb-6 leading-tight">
            {wedding.partner1_first_name} & {wedding.partner2_first_name}
          </h1>
          
          <div className="text-xl md:text-2xl text-slate-600 mb-8 font-light">
            {formattedDate} • {formattedTime}
          </div>
          
          {wedding.story && (
            <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-12 leading-relaxed">
              {wedding.story}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/${dateId}/${weddingNameId}/rsvp`}>
                RSVP Now
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/${dateId}/${weddingNameId}/gallery`}>
                View Gallery
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Venue Information */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Ceremony */}
            <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <h3 className="font-serif text-2xl text-slate-800 mb-4">Ceremony</h3>
              <div className="space-y-2">
                <p className="font-medium text-slate-800">{wedding.ceremony_venue_name || "Venue TBA"}</p>
                <p className="text-slate-600">{wedding.ceremony_venue_address || "Address will be shared soon"}</p>
                <p className="text-orange-600 font-medium">{formattedTime}</p>
              </div>
            </Card>

            {/* Reception */}
            <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <h3 className="font-serif text-2xl text-slate-800 mb-4">Reception</h3>
              <div className="space-y-2">
                <p className="font-medium text-slate-800">{wedding.reception_venue_name || wedding.ceremony_venue_name || "Venue TBA"}</p>
                <p className="text-slate-600">{wedding.reception_venue_address || wedding.ceremony_venue_address || "Address will be shared soon"}</p>
                <p className="text-orange-600 font-medium">Following ceremony</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-slate-800 mb-12">
            Schedule of Events
          </h2>
          <div className="grid gap-4">
            {defaultSchedule.map((item, index) => (
              <div key={index} className="flex items-center gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="font-serif text-lg font-semibold text-orange-600 min-w-[100px]">
                  {item.time}
                </div>
                <div className="text-slate-700 text-lg">
                  {item.event}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-slate-800 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {defaultFaqs.map((faq, index) => (
              <Card key={index} className="p-6 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="font-serif text-xl text-slate-800 mb-3">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="p-6 h-auto flex-col gap-2 border-orange-200 hover:bg-orange-50">
              <Link href={`/${dateId}/${weddingNameId}/rsvp`}>
                <Heart className="w-6 h-6" />
                RSVP
              </Link>
            </Button>
            <Button asChild variant="outline" className="p-6 h-auto flex-col gap-2 border-orange-200 hover:bg-orange-50">
              <Link href={`/${dateId}/${weddingNameId}/schedule`}>
                <span className="text-xl">📅</span>
                Schedule
              </Link>
            </Button>
            <Button asChild variant="outline" className="p-6 h-auto flex-col gap-2 border-orange-200 hover:bg-orange-50">
              <Link href={`/${dateId}/${weddingNameId}/location`}>
                <span className="text-xl">📍</span>
                Location
              </Link>
            </Button>
            <Button asChild variant="outline" className="p-6 h-auto flex-col gap-2 border-orange-200 hover:bg-orange-50">
              <Link href={`/${dateId}/${weddingNameId}/gallery`}>
                <span className="text-xl">📸</span>
                Gallery
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
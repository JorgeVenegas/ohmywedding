import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Heart } from "lucide-react"
import { getWeddingByWeddingId, formatWeddingDate, formatWeddingTime, calculateDaysUntilWedding, type Wedding } from "@/lib/wedding-data"
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
  params: Promise<{ weddingId: string }>
}

export default async function WeddingHomePage({ params }: WeddingPageProps) {
  const { weddingId } = await params
  const wedding = await getWeddingByWeddingId(weddingId)

  if (!wedding) {
    notFound()
  }

  const formattedDate = formatWeddingDate(wedding.wedding_date)
  const formattedTime = formatWeddingTime(wedding.wedding_time)
  const daysUntil = calculateDaysUntilWedding(wedding.wedding_date)
  return (
    <main className="min-h-screen bg-background">
      <Header
        rightContent={
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href={`/${weddingId}/gallery`}>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
                Gallery
              </Button>
            </Link>
            <Link href={`/${weddingId}/location`}>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
                Location
              </Button>
            </Link>
            <Link href={`/${weddingId}/rsvp`}>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                RSVP
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-accent/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-12">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Heart className="w-4 h-4 fill-current" />
                You're Invited
              </div>
              
              <div className="space-y-6">
                <h1 className="font-serif text-7xl sm:text-8xl lg:text-9xl font-light text-foreground leading-none">
                  {wedding.partner1_first_name}
                  <span className="block text-primary italic">&</span>
                  <span className="block">{wedding.partner2_first_name}</span>
                </h1>
                <div className="text-2xl text-muted-foreground font-light tracking-wide">
                  are tying the knot
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-3xl font-serif text-foreground">
                  {formattedDate}
                </div>
                <div className="text-xl text-muted-foreground font-light">
                  {formattedTime}
                </div>
              </div>
            </div>

            {/* Elegant Countdown */}
            <div className="inline-flex items-center gap-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl px-12 py-8">
              <Heart className="w-8 h-8 text-primary/50" />
              <div className="text-center">
                <div className="text-sm text-muted-foreground font-light uppercase tracking-wide mb-2">
                  Celebrating in
                </div>
                <div className="text-4xl font-serif font-light text-primary">
                  {daysUntil > 0 ? `${daysUntil} Days` : daysUntil === 0 ? 'Today!' : 'Just Married!'}
                </div>
              </div>
              <Heart className="w-8 h-8 text-primary/50" />
            </div>

            <div className="flex gap-6 justify-center flex-wrap">
              <Link href={`/${weddingId}/rsvp`}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 text-lg">
                  RSVP with Love
                </Button>
              </Link>
              <Link href={`/${weddingId}/gallery`}>
                <Button size="lg" variant="outline" className="border-2 border-primary/20 hover:bg-primary/5 h-14 px-10 text-lg">
                  View Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-32 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl font-light text-foreground mb-6">
              Our <span className="text-primary italic">Love Story</span>
            </h2>
          </div>
          
          <Card className="border-0 bg-card/70 backdrop-blur-sm shadow-xl">
            <div className="p-12 sm:p-16">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary fill-primary" />
                </div>
              </div>
              <blockquote className="text-2xl text-foreground leading-relaxed font-light text-center max-w-4xl mx-auto">
                {wedding.story || "We're excited to share our special day with you!"}
              </blockquote>
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-4 text-muted-foreground font-light">
                  <div className="w-8 h-px bg-border" />
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                  <div className="w-8 h-px bg-border" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl font-light text-foreground mb-6">
              Our <span className="text-primary italic">Special Day</span>
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Join us as we celebrate our love with family and friends
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {defaultSchedule.map((item, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-serif text-primary mb-2">{item.time}</div>
                      <div className="text-xl text-foreground font-light">{item.event}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Venue Information */}
      <section className="py-32 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl font-light text-foreground mb-6">
              Where <span className="text-primary italic">Love</span> Gathers
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Join us at these beautiful venues as we celebrate our union
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            <Card className="border-0 bg-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-10">
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="font-serif text-3xl font-light text-foreground">Ceremony</h3>
                  <p className="text-lg text-muted-foreground font-light">
                    {wedding.ceremony_venue_name || "Venue TBA"}
                    {wedding.ceremony_venue_address && (
                      <span className="block text-sm mt-1">{wedding.ceremony_venue_address}</span>
                    )}
                  </p>
                  <div className="pt-6">
                    <Link href={`/${weddingId}/location`}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full h-12">
                        Get Directions
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="border-0 bg-card/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-10">
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-secondary" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="font-serif text-3xl font-light text-foreground">Reception</h3>
                  <p className="text-lg text-muted-foreground font-light">
                    {wedding.reception_venue_name || "Venue TBA"}
                    {wedding.reception_venue_address && (
                      <span className="block text-sm mt-1">{wedding.reception_venue_address}</span>
                    )}
                  </p>
                  <div className="pt-6">
                    <Link href={`/${weddingId}/location`}>
                      <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground w-full h-12">
                        Get Directions
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know</p>
        </div>
        <div className="space-y-4">
          {defaultFaqs.map((faq, index) => (
            <Card key={index} className="p-6 border border-border hover:border-primary/50 transition-colors">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground hover:text-primary transition-colors">
                  <span>{faq.question}</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{faq.answer}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">More Information</h2>
          <p className="text-muted-foreground">Explore other sections of our wedding</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href={`/${weddingId}/gallery`}>
            <Card className="p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group h-full">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Gallery</h3>
              <p className="text-muted-foreground mb-4 text-sm">Browse our engagement photos</p>
              <div className="flex items-center text-primary text-sm font-medium">View more →</div>
            </Card>
          </Link>
          <Link href={`/${weddingId}/location`}>
            <Card className="p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group h-full">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Location</h3>
              <p className="text-muted-foreground mb-4 text-sm">Find directions and parking info</p>
              <div className="flex items-center text-primary text-sm font-medium">View more →</div>
            </Card>
          </Link>
          <Link href={`/${weddingId}/rsvp`}>
            <Card className="p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group h-full">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">✉️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">RSVP</h3>
              <p className="text-muted-foreground mb-4 text-sm">Confirm your attendance</p>
              <div className="flex items-center text-primary text-sm font-medium">RSVP now →</div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>
            &copy; 2025 {wedding.partner1_first_name} & {wedding.partner2_first_name}. Made with OhMyWedding.
          </p>
        </div>
      </footer>
    </main>
  )
}

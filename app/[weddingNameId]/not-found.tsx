import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Home } from "lucide-react"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ohmy.wedding'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <Card className="p-12">
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-light text-foreground">
                Wedding Not Found
              </h1>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                We couldn't find the wedding you're looking for. It may have been moved or the link might be incorrect.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={BASE_URL}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </a>
              <a href={`${BASE_URL}/create-wedding`}>
                <Button size="lg" variant="outline" className="border-2 border-primary/20 hover:bg-primary/5">
                  Create Wedding
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
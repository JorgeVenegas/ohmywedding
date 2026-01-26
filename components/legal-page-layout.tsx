import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"

interface LegalPageLayoutProps {
  type: "privacy" | "terms"
  title: string
  subtitle: string
  children: React.ReactNode
}

export function LegalPageLayout({ type, title, subtitle, children }: LegalPageLayoutProps) {
  const typeLabel = type === "privacy" ? "Privacy" : "Terms"

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header with branding */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/images/logos/OMW Logo Gold.png"
                alt="OhMyWedding"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-serif text-lg sm:text-xl font-light text-foreground">
                OhMyWedding
              </span>
            </Link>
            <nav className="flex items-center gap-6 sm:gap-8">
              <Link
                href="/"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/privacy"
                className={`text-xs sm:text-sm transition-colors ${
                  type === "privacy"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className={`text-xs sm:text-sm transition-colors ${
                  type === "terms"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero section with branding */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Legal & Transparency</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light leading-tight">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 sm:py-20">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">OhMyWedding</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Creating beautiful wedding websites that help couples celebrate their love story with elegance and ease.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@ohmy.wedding" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/#faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              Made with{" "}
              <Heart className="w-4 h-4 text-primary fill-primary" />{" "}
              by OhMyWedding
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

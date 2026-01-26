import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/legal-page-layout"

export const metadata: Metadata = {
  title: "Terms of Service | OhMyWedding",
  description:
    "Review the rules that govern your use of OhMyWedding, covering account responsibilities, content, and how we evolve the experience.",
}

const expectationPoints = [
  "Keep account credentials confidential and notify us right away if you suspect unauthorized access.",
  "Use the platform only for wedding-related planning, keeping third-party advertising or inappropriate content out of guest areas.",
  "Obtain consent before sharing photos or personal information in galleries, guest messages, or RSVPs.",
]

const restrictionPoints = [
  "Do not scrape, reverse engineer, or attempt to copy our services for competing platforms.",
  "Respect intellectual property rights—only upload assets you own or have permission to display.",
  "Avoid sending spammy invitations or promotions that violate our communication standards.",
]

export default function TermsPage() {
  return (
    <LegalPageLayout
      type="terms"
      title="Terms of Service"
      subtitle="These terms explain how you may use OhMyWedding, what we expect from you, and how we manage the platform for every couple building their celebration site."
    >

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Account Responsibilities</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account belongs to you. Keep credentials secure, keep your wedding details accurate, and reach out if you
            need to transfer ownership or update collaborators.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            {expectationPoints.map((point) => (
              <li key={point} className="list-disc pl-5">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            OhMyWedding is built for heartfelt celebrations. Please keep the experience respectful and avoid abusing any
            feature meant to bring couples and their guests together.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            {restrictionPoints.map((point) => (
              <li key={point} className="list-disc pl-5">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Content & Guest Experience</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You remain responsible for content uploaded to your wedding site, including photos, schedules, and registry
            information. Provide accurate event details so guests can plan with confidence.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Guests who abuse RSVP, gallery, or registry features may be removed; contact us if you encounter issues.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Our Commitments</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to update these terms, pause or remove content, and iterate features as long as we
            provide notice on this page or via email. If you disagree with a change, contact support so we can help.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            While we strive for reliability, OhMyWedding is provided &quot;as is&quot; and we disclaim warranties to the fullest
            extent permitted by law. Your remedies are limited to contacting support for assistance.
          </p>
        </section>
      </LegalPageLayout>
    )
  }

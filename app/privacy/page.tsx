import type { Metadata } from "next"
import { LegalPageLayout } from "@/components/legal-page-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | OhMyWedding",
  description:
    "Learn how OhMyWedding collects, uses, and protects your data when you manage your wedding site or view a guest experience page.",
}

const collectionPoints = [
  "Information you provide when creating or editing a wedding (names, dates, guest lists, photos, and messages).",
  "Communications you send through the platform, including RSVPs, messages, and guest notes.",
  "Usage data such as which sections of the wedding site you visit and how guests interact with RSVP, gallery, and registry features.",
  "Technical details like browser, device type, and IP address that help keep the service secure.",
]

const usagePoints = [
  "Delivering your wedding website and letting guests view schedules, RSVP, and browse galleries or registries.",
  "Sending transactional communications such as invitations updates, plan reminders, and security notices.",
  "Improving the product by understanding how couples and guests navigate the site and which features they use most.",
  "Protecting accounts by detecting suspicious activity, enforcing access controls, and maintaining backups.",
]

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      type="privacy"
      title="How We Handle Your Information"
      subtitle="OhMyWedding is committed to treating your information with care. This page explains what data we collect, why we keep it, and how you can influence what stays on the platform."
    >

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We gather the minimum information required to build a beautiful, personalized wedding site and keep each
            experience secure.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            {collectionPoints.map((point) => (
              <li key={point} className="list-disc pl-5">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">How We Use It</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data powers the experiences you and your guests enjoy. We never sell your information to third parties.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            {usagePoints.map((point) => (
              <li key={point} className="list-disc pl-5">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Your Choices</h2>
          <p className="text-sm text-foreground leading-relaxed">
            You control what appears on your wedding site. Update or remove details anytime from the settings panel, and
            let guests know how they can contact you before sharing private materials.
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="list-disc pl-5">
              Adjust visibility for galleries, RSVPs, and registries through the admin panels.
            </li>
            <li className="list-disc pl-5">
              Opt out of marketing communications by using the unsubscribe link inside every promotional email.
            </li>
            <li className="list-disc pl-5">
              Reach out to support@ohmy.wedding to request access to your data or delete an account if needed.
            </li>
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/50 bg-card px-6 py-8 shadow-lg shadow-border/20">
          <h2 className="text-2xl font-semibold">Security & Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use encryption, access controls, and routine audits to protect the information you entrust to us. Content is
            retained as long as your wedding site exists; closing an account removes content subject to backups used for
            disaster recovery.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Updates to this policy will be posted here with a clear effective date. Check back occasionally for the newest
            version or reach out if you have questions.
          </p>
        </section>
      </LegalPageLayout>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useTranslation } from '@/components/contexts/i18n-context'

export function LuxuryFooter() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#420c14] border-t border-[#DDA46F]/10 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-16 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <Image
                src="/images/logos/OMW Logo Gold.png"
                alt="OhMyWedding"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
              <span className="font-serif text-2xl text-[#f5f2eb] tracking-[0.1em]">OhMyWedding</span>
            </div>
            <p className="text-[#f5f2eb]/50 leading-relaxed max-w-md">
              Creating beautiful wedding websites that help couples celebrate their love story 
              with elegance and sophistication.
            </p>
          </div>

          <div>
            <h4 className="text-[#f5f2eb] font-medium mb-6 tracking-[0.2em] text-sm uppercase">{t('landing.footer.product')}</h4>
            <ul className="space-y-4">
              {[
                { label: t('landing.nav.features'), href: '#features' },
                { label: t('landing.pricing.label'), href: '#pricing' },
                { label: t('landing.templates.label'), href: '#demos' },
                { label: t('landing.footer.faq'), href: '#faq' },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors duration-500 text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f5f2eb] font-medium mb-6 tracking-[0.2em] text-sm uppercase">{t('landing.footer.support')}</h4>
            <ul className="space-y-4">
              {[
                { label: t('landing.footer.contactUs'), href: 'mailto:support@ohmy.wedding' },
                { label: t('landing.footer.privacyPolicy'), href: '/privacy' },
                { label: t('landing.footer.termsOfService'), href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[#f5f2eb]/50 hover:text-[#DDA46F] transition-colors duration-500 text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#DDA46F]/10 pt-10 text-center space-y-4">
          <p className="text-[#f5f2eb]/30 text-sm tracking-wide">
            &copy; {new Date().getFullYear()} OhMyWedding. {t('landing.footer.madeWith')}{' '}
            <Heart className="w-4 h-4 inline text-[#DDA46F] fill-[#DDA46F] mx-1" />
          </p>
          <p className="text-[#f5f2eb]/20 text-[11px] leading-relaxed max-w-2xl mx-auto">
            {t('landing.footer.privacyDescription')} <Link href="/privacy" className="text-[#DDA46F] hover:underline">{t('landing.footer.privacyPolicy')}</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

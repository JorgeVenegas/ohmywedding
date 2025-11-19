import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Calendar, MapPin } from 'lucide-react'
import { SectionWrapper } from '../section-wrapper'
import { BaseRSVPProps } from './types'

export function RSVPCallToActionVariant({
  dateId,
  weddingNameId,
  theme,
  alignment
}: BaseRSVPProps) {
  return (
    <SectionWrapper theme={theme} alignment={alignment} background="primary" id="rsvp">
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Heart className="w-16 h-16 mx-auto mb-6" 
                  style={{ color: theme?.colors?.accent }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" 
                style={{ color: theme?.colors?.foreground }}>
              Join Our Celebration
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your presence would make our special day even more meaningful. 
              Please let us know if you can celebrate with us!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>RSVP by [Date]</span>
            </div>
            <span className="hidden sm:inline text-gray-400">•</span>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>Ceremony & Reception</span>
            </div>
          </div>

          <Button 
            asChild 
            size="lg" 
            className="px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: theme?.colors?.primary,
              borderColor: theme?.colors?.primary
            }}
          >
            <Link href={`/${weddingNameId}/rsvp`}>
              RSVP Now
            </Link>
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Questions? Contact us at [email] or [phone]
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}
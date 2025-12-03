import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps, getColorScheme } from './types'
import { useI18n } from '@/components/contexts/i18n-context'

export function OurStoryMinimalVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  showHowWeMetPhoto = false,
  showProposalPhoto = false,
  sectionTitle,
  sectionSubtitle,
  howWeMetText,
  howWeMetPhoto,
  proposalText,
  proposalPhoto,
  useColorBackground = false,
  backgroundColorChoice
}: BaseOurStoryProps) {
  const { t } = useI18n()
  
  // Use translated defaults if not provided
  const title = sectionTitle || t('ourStory.title')
  const subtitle = sectionSubtitle
  
  // Get enhanced color scheme with complementary palette colors
  const { bgColor, titleColor, subtitleColor, sectionTextColor, sectionTextColorAlt, accentColor, contrastColor, colorLight, colorDark, cardBg, bodyTextColor, isColored, isLightBg } = getColorScheme(theme, backgroundColorChoice, useColorBackground)
  
  // Rich color scheme - high contrast for titles, low contrast for decorative
  const sectionTitleColor = isColored ? sectionTextColor : theme?.colors?.foreground
  const headingColor = isColored ? titleColor : theme?.colors?.primary  // Darkest for headings
  const textColor = isColored ? sectionTextColorAlt : undefined
  const accentLineColor = isColored ? subtitleColor : theme?.colors?.accent  // Lower contrast for decoration

  return (
    <SectionWrapper 
      theme={isColored ? undefined : theme} 
      alignment={alignment} 
      background="default" 
      id="our-story"
      style={isColored ? { backgroundColor: bgColor } : undefined}
    >
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16" 
              style={{ color: sectionTitleColor }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-center -mt-12 mb-12 max-w-2xl mx-auto" style={{ color: isColored ? sectionTextColorAlt : theme?.colors?.muted }}>
              {subtitle}
            </p>
          )}
          
          <div className="space-y-6 sm:space-y-8">
            {showHowWeMet && (
              <div className="space-y-8">
                {showHowWeMetPhoto && howWeMetPhoto && (
                  <div 
                    className="relative w-full max-w-2xl mx-auto h-64 md:h-96 rounded-lg overflow-hidden shadow-lg"
                    style={isColored ? { boxShadow: `0 8px 32px rgba(0,0,0,0.2)` } : undefined}
                  >
                    <Image
                      src={howWeMetPhoto}
                      alt={t('ourStory.howWeMet')}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="prose prose-lg mx-auto">
                  <h3 className="text-2xl font-semibold mb-6" 
                      style={{ color: headingColor }}>
                    {t('ourStory.howWeMet')}
                  </h3>
                  <p className={`leading-relaxed text-lg ${isColored ? '' : 'text-gray-600'}`}
                     style={{ color: textColor }}>
                    {howWeMetText || t('ourStory.howWeMetDefault')}
                  </p>
                </div>
              </div>
            )}
            
            {showProposal && (
              <div className="space-y-8">
                {showProposalPhoto && proposalPhoto && (
                  <div 
                    className="relative w-full max-w-2xl mx-auto h-64 md:h-96 rounded-lg overflow-hidden shadow-lg"
                    style={isColored ? { boxShadow: `0 8px 32px rgba(0,0,0,0.2)` } : undefined}
                  >
                    <Image
                      src={proposalPhoto}
                      alt={t('ourStory.theProposal')}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="prose prose-lg mx-auto">
                  <h3 className="text-2xl font-semibold mb-6" 
                      style={{ color: headingColor }}>
                    {t('ourStory.theProposal')}
                  </h3>
                  <p className={`leading-relaxed text-lg ${isColored ? '' : 'text-gray-600'}`}
                     style={{ color: textColor }}>
                    {proposalText || t('ourStory.proposalDefault')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
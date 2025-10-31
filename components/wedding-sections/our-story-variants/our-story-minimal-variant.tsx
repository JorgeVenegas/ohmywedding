import React from 'react'
import Image from 'next/image'
import { SectionWrapper } from '../section-wrapper'
import { BaseOurStoryProps } from './types'

export function OurStoryMinimalVariant({
  theme,
  alignment,
  showHowWeMet = true,
  showProposal = true,
  howWeMetText = "We met at...",
  proposalText = "The proposal was..."
}: BaseOurStoryProps) {
  return (
    <SectionWrapper theme={theme} alignment={alignment} background="default" id="our-story">
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16" 
              style={{ color: theme?.colors?.foreground }}>
            Our Love Story
          </h2>
          
          <div className="space-y-12">
            {showHowWeMet && (
              <div className="prose prose-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-6" 
                    style={{ color: theme?.colors?.primary }}>
                  How We Met
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {howWeMetText}
                </p>
              </div>
            )}
            
            {showProposal && (
              <div className="prose prose-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-6" 
                    style={{ color: theme?.colors?.primary }}>
                  The Proposal
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {proposalText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
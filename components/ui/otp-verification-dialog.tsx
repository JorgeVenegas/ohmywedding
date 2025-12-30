"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useI18n } from '@/components/contexts/i18n-context'
import { CheckCircle2, Phone, X } from 'lucide-react'

interface OTPVerificationDialogProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (verificationToken: string) => void
  groupId: string
  phoneNumbers: string[]
  buttonColor?: string
  textColor?: string
}

export function OTPVerificationDialog({
  isOpen,
  onClose,
  onVerified,
  groupId,
  phoneNumbers = [],
  buttonColor = '#d4a574',
  textColor = '#333'
}: OTPVerificationDialogProps) {
  const { t } = useI18n()
  const [step, setStep] = useState<'select' | 'sent' | 'verified'>('select')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [enteredPhone, setEnteredPhone] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  const hasMultiplePhones = phoneNumbers.length > 1

  // Auto-select if only one phone number
  useEffect(() => {
    if (phoneNumbers.length === 1 && !selectedPhone) {
      setSelectedPhone(phoneNumbers[0])
    }
  }, [phoneNumbers, selectedPhone])

  // Get last 2 digits of phone for display
  const getPhoneHint = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return digits.slice(-2)
  }

  const handleSendOTP = async () => {
    if (!selectedPhone) {
      setError(t('rsvp.selectPhone'))
      return
    }

    setError('')
    setIsSending(true)

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedPhone,
          groupId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('rsvp.error'))
        return
      }

      setStep('sent')
    } catch (err) {
      setError(t('rsvp.error'))
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!enteredPhone || enteredPhone.length < 8) {
      setError(t('rsvp.invalidPhone'))
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedPhone,
          enteredPhone: enteredPhone,
          groupId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Map API error messages to translated keys
        if (data.error === 'Phone number does not match') {
          setError(t('rsvp.phoneDoesNotMatch'))
        } else {
          setError(data.error || t('rsvp.phoneVerificationFailed'))
        }
        return
      }

      setStep('verified')
      onVerified(data.verificationToken)
    } catch (err) {
      setError(t('rsvp.error'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRetry = () => {
    setEnteredPhone('')
    setError('')
    setStep('select')
  }

  const handleClose = () => {
    if (step !== 'verified') {
      setStep('select')
      setSelectedPhone('')
      setEnteredPhone('')
      setError('')
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-8 border-2"
        style={{ 
          backgroundColor: '#fff',
          borderColor: `${buttonColor}30`
        }}
      >
        {/* Close button */}
        {step !== 'verified' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110"
            style={{ 
              color: buttonColor,
              backgroundColor: `${buttonColor}10`
            }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Select Phone Step */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg" style={{ backgroundColor: buttonColor }}>
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-serif font-semibold" style={{ color: buttonColor }}>
                {t('rsvp.phoneVerification')}
              </h2>
              <p className="text-sm" style={{ color: `${textColor}99` }}>
                {t('rsvp.selectPhoneToVerify')}
              </p>
            </div>

            {hasMultiplePhones ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium" style={{ color: textColor }}>
                  {t('rsvp.selectPhoneNumber')}
                </label>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhone(phone)
                        setError('')
                      }}
                      className={`w-full px-4 py-4 rounded-lg border-2 text-center font-semibold transition-all duration-200 ${
                        selectedPhone === phone 
                          ? 'scale-[1.02] shadow-lg' 
                          : 'hover:scale-[1.01] hover:brightness-95'
                      }`}
                      style={{
                        borderColor: selectedPhone === phone ? buttonColor : '#d1d5db',
                        color: selectedPhone === phone ? 'white' : textColor,
                        backgroundColor: selectedPhone === phone ? buttonColor : '#f3f4f6',
                        ...(selectedPhone === phone && { boxShadow: `0 4px 12px ${buttonColor}40` })
                      }}
                    >
                      <span className="text-lg tracking-wider">**{getPhoneHint(phone)}</span>
                      {selectedPhone === phone && (
                        <span className="ml-2 text-white">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: textColor }}>
                  {t('rsvp.phone')}
                </label>
                <div 
                  className="w-full px-4 py-3 rounded-lg border-2 text-center font-medium cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ 
                    borderColor: buttonColor, 
                    color: 'white', 
                    backgroundColor: buttonColor
                  }}
                  onClick={() => setSelectedPhone(phoneNumbers[0] || '')}
                >
                  <span className="text-lg tracking-wider">**{getPhoneHint(phoneNumbers[0] || '')}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              onClick={handleSendOTP}
              disabled={isSending || !selectedPhone}
              className="w-full text-white transition-all duration-300 hover:scale-105 py-6 text-base font-semibold shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: buttonColor }}
            >
              {isSending ? t('rsvp.submitting') : t('rsvp.continue')}
            </Button>
          </div>
        )}

        {/* Enter Phone Step */}
        {step === 'sent' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg" style={{ backgroundColor: buttonColor }}>
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-serif font-semibold" style={{ color: buttonColor }}>
                {t('rsvp.verifyPhone')}
              </h2>
              <p className="text-sm" style={{ color: `${textColor}99` }}>
                {t('rsvp.enterCompletePhone')}
              </p>
              <div className="mt-4 py-3 px-6 rounded-lg inline-block" style={{ backgroundColor: `${buttonColor}15` }}>
                <p className="text-xs font-medium mb-1" style={{ color: `${textColor}99` }}>
                  {t('rsvp.phoneEndsIn')}
                </p>
                <p className="text-4xl font-bold tracking-wider" style={{ color: buttonColor }}>
                  **{getPhoneHint(selectedPhone)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: textColor }}>
                {t('rsvp.completePhoneNumber')}
              </label>
              <input
                type="tel"
                value={enteredPhone}
                onChange={(e) => {
                  setEnteredPhone(e.target.value)
                  setError('')
                }}
                placeholder={t('rsvp.enterCompletePhoneNumber')}
                className="w-full px-4 py-3 rounded-lg border-2 text-center text-lg font-medium focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: buttonColor,
                  color: textColor
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleVerifyPhone}
                disabled={isVerifying || !enteredPhone}
                className="w-full text-white transition-all duration-300 hover:scale-105 py-6 text-base font-semibold shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: buttonColor }}
              >
                {isVerifying ? t('rsvp.submitting') : t('rsvp.verify')}
              </Button>
              
              <button
                onClick={handleRetry}
                disabled={isSending}
                className="w-full py-2 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 rounded-lg"
                style={{ 
                  color: buttonColor,
                  backgroundColor: `${buttonColor}10`
                }}
              >
                {t('rsvp.tryDifferentPhone')}
              </button>
            </div>
          </div>
        )}

        {/* Verified Step */}
        {step === 'verified' && (
          <div className="space-y-6 text-center py-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full shadow-xl animate-pulse mb-4" style={{ backgroundColor: buttonColor }}>
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-semibold mb-2" style={{ color: buttonColor }}>
                {t('rsvp.phoneVerified')}
              </h2>
              <p className="text-sm" style={{ color: `${textColor}99` }}>
                {t('rsvp.submittingResponse')}...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

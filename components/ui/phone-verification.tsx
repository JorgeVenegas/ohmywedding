"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useI18n } from '@/components/contexts/i18n-context'
import { CheckCircle2, Phone } from 'lucide-react'

interface PhoneVerificationProps {
  groupId: string
  phoneNumber?: string
  phoneNumbers?: string[]
  onVerified: (verificationToken: string) => void
  buttonColor?: string
  textColor?: string
}

export function PhoneVerification({
  groupId,
  phoneNumber: initialPhoneNumber,
  phoneNumbers = [],
  onVerified,
  buttonColor = '#d4a574',
  textColor = '#333'
}: PhoneVerificationProps) {
  const { t } = useI18n()
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '')
  const [otpCode, setOtpCode] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  // Use the first available phone number if none is pre-selected
  const availablePhones = phoneNumbers.length > 0 ? phoneNumbers : (initialPhoneNumber ? [initialPhoneNumber] : [])
  const hasMultiplePhones = availablePhones.length > 1

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      setError(t('rsvp.enterPhoneNumber'))
      return
    }

    setError('')
    setIsSending(true)

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          groupId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('rsvp.error'))
        return
      }

      setIsOtpSent(true)
    } catch (err) {
      setError(t('rsvp.error'))
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError(t('rsvp.invalidCode'))
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otpCode,
          groupId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('rsvp.invalidCode'))
        return
      }

      setIsVerified(true)
      onVerified(data.verificationToken)
    } catch (err) {
      setError(t('rsvp.error'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    setOtpCode('')
    setError('')
    await handleSendOTP()
  }

  if (isVerified) {
    return (
      <div className="space-y-4 p-6 rounded-lg border-2" style={{ borderColor: buttonColor, backgroundColor: 'rgba(212, 165, 116, 0.05)' }}>
        <div className="flex items-center gap-3 justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <span className="font-medium text-green-700" style={{ color: textColor }}>
            {t('rsvp.phoneVerified')}
          </span>
        </div>
      </div>
    )
  }

  if (!isOtpSent) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: textColor }}>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              {t('rsvp.phoneVerification')}
            </div>
          </label>
          <p className="text-sm opacity-75" style={{ color: textColor }}>
            {t('rsvp.phoneVerificationDescription')}
          </p>
        </div>

        {hasMultiplePhones ? (
          <div className="space-y-2">
            <label className="block text-xs font-medium opacity-75" style={{ color: textColor }}>
              {t('rsvp.selectPhoneNumber')}
            </label>
            <select
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSending}
              className="w-full px-4 py-3 rounded-lg border-2 text-center text-lg"
              style={{ borderColor: buttonColor, color: textColor }}
            >
              <option value="">{t('rsvp.selectPhone')}</option>
              {availablePhones.map((phone, idx) => (
                <option key={idx} value={phone}>{phone}</option>
              ))}
            </select>
          </div>
        ) : (
          <Input
            type="tel"
            value={phoneNumber || availablePhones[0] || ''}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t('rsvp.enterPhoneNumber')}
            disabled={availablePhones.length > 0 || isSending}
            className="text-center text-lg"
            style={{ borderColor: buttonColor }}
          />
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleSendOTP}
          disabled={isSending || !phoneNumber}
          className="w-full text-white transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: buttonColor }}
        >
          {isSending ? t('rsvp.submitting') : t('rsvp.sendVerificationCode')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: textColor }}>
          {t('rsvp.enterVerificationCode')}
        </label>
        <p className="text-sm opacity-75" style={{ color: textColor }}>
          {t('rsvp.codeSentTo')}: {phoneNumber}
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={(value: string) => {
            setOtpCode(value)
            setError('')
          }}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleVerifyOTP}
          disabled={isVerifying || otpCode.length !== 6}
          className="flex-1 text-white transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: buttonColor }}
        >
          {isVerifying ? t('rsvp.submitting') : t('rsvp.verifyCode')}
        </Button>
        
        <Button
          onClick={handleResendOTP}
          variant="outline"
          disabled={isSending}
          className="transition-all duration-300"
          style={{ borderColor: buttonColor, color: buttonColor }}
        >
          {t('rsvp.resendCode')}
        </Button>
      </div>
    </div>
  )
}

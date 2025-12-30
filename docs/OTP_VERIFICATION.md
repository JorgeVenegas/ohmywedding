# RSVP OTP Verification Implementation

## Overview
This implementation adds SMS-based OTP (One-Time Password) verification to the RSVP confirmation process using Supabase's built-in phone authentication feature. This ensures that only guests with the correct phone number can submit RSVP responses.

## Features
- ✅ SMS OTP verification using Supabase Auth
- ✅ 6-digit OTP code input with elegant UI
- ✅ OTP expiration (10 minutes for sending, 1 hour for verification token)
- ✅ Resend OTP functionality
- ✅ Multi-language support (English & Spanish)
- ✅ Applied to all RSVP variants (Elegant, Minimalistic, Cards)

## How It Works

### 1. Database Schema
A new table `rsvp_otp_verifications` tracks verification sessions:
- Stores guest group ID and phone number
- Contains verification token after successful OTP validation
- Tracks expiration times
- Located in: `/supabase/schemas/09_otp_verification.sql`

### 2. API Endpoints

#### Send OTP: `/api/otp/send`
- Validates phone number matches guest group
- Uses Supabase Auth to send SMS OTP
- Creates verification record in database
- OTP expires in 10 minutes

#### Verify OTP: `/api/otp/verify`
- Validates OTP code with Supabase Auth
- Generates unique verification token
- Token valid for 1 hour

### 3. RSVP Submission
The `/api/rsvps` endpoint now:
- Requires valid `verificationToken`
- Validates token hasn't expired (1 hour)
- Only processes RSVP if verification is valid

### 4. UI Components

#### PhoneVerification Component
Located: `/components/ui/phone-verification.tsx`
- Handles phone number input
- Displays 6-digit OTP input
- Shows verification status
- Supports resend functionality

#### Input OTP Component
Located: `/components/ui/input-otp.tsx`
- Uses `input-otp` library
- Clean 6-digit code input
- Visual feedback for active slot

## Setup Requirements

### 1. Configure Supabase Auth for SMS
In your Supabase project:
1. Go to Authentication > Providers
2. Enable Phone authentication
3. Configure SMS provider (Twilio, MessageBird, etc.)
4. Add phone number settings

### 2. Environment Variables
Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Migration
Apply the OTP schema migration:
```bash
supabase migration up
```

## Usage Flow

1. **Guest opens RSVP page** with their group invitation link
2. **Guest selects attendance** for each person in their group
3. **Phone verification appears**:
   - If multiple phone numbers exist in the group (from guest_group or individual guests), a dropdown appears
   - Guest selects which phone number to receive the OTP
   - If only one phone number exists, it's pre-filled
   - Guest clicks "Send Verification Code"
4. **Backend validates** that the selected phone number belongs to someone in the guest group
5. **Guest receives SMS** with 6-digit OTP code
6. **Guest enters OTP code** in the input field
7. **System validates OTP** with Supabase Auth
8. **Verification successful** - checkmark appears
9. **Guest can now submit RSVP** - submit button becomes enabled
10. **RSVP is saved** with verification token validation

## Phone Number Selection

The system intelligently handles phone numbers:
- **Multiple phones**: Shows dropdown with all phone numbers from the guest group and individual guests
- **Single phone**: Pre-fills the phone number field
- **Backend validation**: Only phone numbers associated with the guest group are accepted
- **No duplicates**: Duplicate phone numbers are filtered out automatically

## Translations

All OTP-related text supports English and Spanish:
- `rsvp.verifyPhone` - "Verify Phone Number"
- `rsvp.phoneVerification` - "Phone Verification"
- `rsvp.sendVerificationCode` - "Send Verification Code"
- `rsvp.enterVerificationCode` - "Enter verification code"
- `rsvp.verifyCode` - "Verify Code"
- `rsvp.resendCode` - "Resend Code"
- `rsvp.phoneVerified` - "Phone number verified!"
- `rsvp.invalidCode` - "Invalid verification code"
- `rsvp.verificationRequired` - "Phone verification is required"
- `rsvp.selectPhoneNumber` - "Select a phone number"
- `rsvp.selectPhone` - "Select phone number..."

## Security Features

1. **Phone number validation**: System verifies phone belongs to guest group (checks both guest_group.phone_number and individual guests.phone_number)
2. **OTP expiration**: Codes expire after 10 minutes
3. **Token expiration**: Verification tokens expire after 1 hour
4. **Supabase Auth**: Leverages Supabase's secure OTP system
5. **RLS policies**: Database protected by row-level security
6. **Backend validation**: Only phone numbers associated with the guest group can receive OTPs

## Testing

### Local Development
1. Start local Supabase: `supabase start`
2. Run dev server: `npm run dev`
3. Configure phone auth in local Supabase dashboard
4. Test with real phone number (SMS will be sent)

### Production
1. Ensure SMS provider configured in Supabase
2. Test with multiple phone formats
3. Verify OTP delivery and expiration
4. Check verification token validation

## Troubleshooting

### OTP Not Sending
- Check Supabase SMS provider configuration
- Verify phone number format (international format recommended)
- Check Supabase logs for errors

### Invalid OTP Error
- Ensure OTP is entered within 10 minutes
- Check for typos in 6-digit code
- Use resend feature if needed

### Verification Token Expired
- Tokens expire 1 hour after verification
- Guest needs to verify phone again
- System will show clear error message

## Future Enhancements
- [ ] Rate limiting for OTP requests
- [ ] Remember device feature (skip OTP for 30 days)
- [ ] Support for WhatsApp OTP
- [ ] Admin override for verification bypass
- [ ] Analytics for verification success rates

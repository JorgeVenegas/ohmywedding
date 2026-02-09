# Stripe Webhook Setup Guide - Complete

## Overview
Oh My Wedding uses three separate Stripe webhooks for different purposes:

1. **Subscriptions Webhook** - Handles plan upgrades (platform account level)
2. **Registry Webhook** - Handles gift contributions (connected account level)
3. **Connect Webhook** - Handles account verification & status (connected account level)

Each webhook is a **separate endpoint with its own signing secret**. You must create all three in your Stripe Dashboard.

---

## Webhook Endpoints Summary

| Webhook | URL | Purpose | Secret Env Var | Events |
|---------|-----|---------|---|--------|
| Subscriptions | `/api/subscriptions/webhook` | User plan upgrades | `STRIPE_WEBHOOK_SECRET` | `checkout.session.completed` |
| Registry | `/api/registry/webhook` | Gift contributions | `STRIPE_REGISTRY_WEBHOOK_SECRET` | `checkout.session.completed`, `checkout.session.expired`, `payment_intent.*`, `charge.*` |
| Connect | `/api/connect/webhook` | Account verification | `STRIPE_CONNECT_WEBHOOK_SECRET` | `account.updated`, `account.application.deauthorized` |

---

## Quick Setup Checklist

- [ ] Create 3 webhook endpoints in Stripe Dashboard (Developers > Webhooks)
- [ ] For each endpoint, copy its signing secret and add to `.env` with the correct variable name
- [ ] Verify webhook events are being received (check Stripe Dashboard > Recent deliveries)

---

# Stripe Connect Webhook Setup Guide

## Overview
This guide explains how to set up the Stripe Connect webhook for the Oh My Wedding platform. The webhook receives real-time account status updates from Stripe, allowing us to automatically update your account verification status.

## Prerequisites
- A Stripe account with Stripe Connect enabled
- Access to the Stripe Dashboard
- The webhook endpoint URL

## Webhook Endpoint URL
Your webhook endpoint is hosted at:
```
https://yourdomain.com/api/connect/webhook
```

For local development with ngrok:
```
https://your-ngrok-url.ngrok.io/api/connect/webhook
```

## Step-by-Step Setup

### 1. Access Stripe Webhooks Settings
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **Webhooks**
3. Click **Add endpoint**

### 2. Create the Webhook Endpoint
1. In the "Endpoint URL" field, paste your webhook URL:
   ```
   https://yourdomain.com/api/connect/webhook
   ```

2. In the "Select events to listen to" section, select:
   - `account.updated` - Required for receiving account verification status updates
   - `account.application.deauthorized` - Required for handling disconnected accounts

3. Click **Add endpoint**

### 3. Retrieve Your Webhook Signing Secret
1. After creating the endpoint, you'll see a "Signing secret" field
2. Click the **Reveal** button to show your secret
3. It will look like: `whsec_1234567890abcdef...`

### 4. Add to Environment Variables
Add the webhook secret to your `.env.local` file:

**For Local Development:**
```bash
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_your_secret_here
```

**For Production:**
Add `STRIPE_CONNECT_WEBHOOK_SECRET` to your production environment variables.

### 5. Verify the Webhook
1. The webhook should now be listening for events
2. You can test it by:
   - Completing a Stripe Connect account onboarding
   - Submitting account verification details
   - Disconnecting an account

3. Check the webhook logs in your Stripe Dashboard to verify delivery

## Webhook Events Reference

### `account.updated`
Triggered when:
- Account details are submitted
- Account passes verification
- Payouts are enabled
- Account is restricted
- Any account configuration changes

**Database Update:** 
- `stripe_onboarding_completed` → `details_submitted`
- `payouts_enabled` → `payouts_enabled && charges_enabled`

### `account.application.deauthorized`
Triggered when:
- User disconnects the connected account
- App is deauthorized from accessing the account

**Database Update:**
- `stripe_onboarding_completed` → `false`
- `payouts_enabled` → `false`

## Testing Webhooks Locally

### Using ngrok
1. Install [ngrok](https://ngrok.com/download)
2. Run your local development server (should be running on `localhost:3000`)
3. In another terminal, run:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL from ngrok output (e.g., `https://abc123.ngrok.io`)
5. Add to your webhook endpoint: `https://abc123.ngrok.io/api/connect/webhook`
6. Add to `.env.local`:
   ```bash
   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_your_test_secret
   ```

### View Webhook Deliveries
1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click on your endpoint
3. Scroll to "Recent deliveries" to see:
   - Event type
   - Timestamp
   - Response status
   - Payload details

## Environment Variables Checklist

Make sure you have all three webhook secrets in your `.env.local`:

```bash
# Stripe Main Account (Platform) - for subscription payments
STRIPE_WEBHOOK_SECRET=whsec_...          # from /api/subscriptions/webhook endpoint

# Stripe Registry Webhook - for registry contribution payments (from connected accounts)
STRIPE_REGISTRY_WEBHOOK_SECRET=whsec_... # from /api/registry/webhook endpoint

# Stripe Connect Webhook - for account verification & status updates (from connected accounts)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...  # from /api/connect/webhook endpoint

# Other required vars
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Troubleshooting

### Webhook Not Triggering
1. Verify the webhook URL is publicly accessible
2. Check that the webhook is enabled in Stripe Dashboard
3. Ensure the signing secret matches exactly
4. Look for typos in environment variable names

### 401 Unauthorized Errors
1. Double-check your `STRIPE_CONNECT_WEBHOOK_SECRET`
2. Make sure it's set correctly in your `.env.local`
3. Restart your development server after changing env vars

### Database Not Updating
1. Check that the Stripe webhook is actually sending events
2. Verify the API endpoint is receiving the webhook
3. Check application logs for errors
4. Ensure Supabase service role key is correct

### Webhook Delivery Failures
1. Verify your endpoint URL is correct and publicly accessible
2. Check the webhook logs in Stripe Dashboard for error messages
3. Ensure your server is running and not blocking requests
4. Check for any firewall or network issues

## Security Notes

- Keep your `STRIPE_CONNECT_WEBHOOK_SECRET` private
- Never commit secrets to version control
- Rotate webhook signing secrets periodically
- Verify webhook signatures on every request (already done in the code)

## Production Deployment

1. Create a separate webhook endpoint for production
2. Use your production domain URL
3. Generate a new webhook signing secret
4. Add the production secret to your environment variables
5. Test thoroughly before going live

## Support

For issues with Stripe Connect or webhooks:
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Dashboard Help](https://support.stripe.com/questions)

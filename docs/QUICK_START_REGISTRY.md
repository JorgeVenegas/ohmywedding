# Quick Start Guide - Custom Registry

## 🚀 Quick Setup (5 minutes)

### Step 1: Apply Database Migration
```bash
cd /Users/jorgevenegas/Desktop/projects/ohmywedding
supabase db push
```

### Step 2: Add Environment Variables
Copy and edit `.env.local`:
```bash
# Add these to your .env.local file:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Get Stripe Keys
1. Visit [stripe.com/register](https://stripe.com/register)
2. Go to **Developers** → **API keys**
3. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`, click "Reveal")

### Step 4: Setup Webhook (for local testing)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/registry/webhook
```
Copy the webhook secret (starts with `whsec_`) to your `.env.local`

### Step 5: Start Development Server
```bash
npm run dev
```

## 🎉 You're Ready!

### Test It Out:

**As Wedding Couple:**
1. Visit: `http://localhost:3000/admin/[your-wedding-id]/registry`
2. Click "Add Item"
3. Create a test item:
   - Title: "Honeymoon Fund"
   - Description: "Help us have an amazing honeymoon!"
   - Goal: 5000
4. Click "Create Item"

**As Guest:**
1. Visit: `http://localhost:3000/[your-wedding-name-id]/registry`
2. Click "Contribute" on the item
3. Enter:
   - Amount: 100
   - Name: Test Guest
4. Click "Proceed to Payment"
5. Use test card: `4242 4242 4242 4242`
6. Use any future date and any 3-digit CVC
7. Complete payment

**Verify:**
- Contribution shows in admin dashboard
- Item's current amount increases
- Progress bar updates

## 📝 Production Setup

### For Production Deployment:

1. **Use Production Stripe Keys:**
   - Go to Stripe Dashboard
   - Toggle from "Test mode" to "Live mode"
   - Get production keys (start with `pk_live_` and `sk_live_`)

2. **Setup Production Webhook:**
   - Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/registry/webhook`
   - Select event: `checkout.session.completed`
   - Copy webhook signing secret

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

4. **Deploy:**
   ```bash
   # Push database changes
   supabase db push
   
   # Deploy application
   vercel --prod
   # or your deployment method
   ```

## 🔍 Troubleshooting

### Webhooks not working locally?
Make sure Stripe CLI is running:
```bash
stripe listen --forward-to localhost:3000/api/registry/webhook
```

### Can't see registry items?
Check:
1. Items are marked as "Active" in admin dashboard
2. You're using the correct wedding name ID in the URL

### Payment not processing?
Verify:
1. All Stripe environment variables are set
2. Webhook secret matches the one from Stripe CLI or dashboard
3. Check browser console for errors

### Database errors?
Run migration again:
```bash
supabase db reset
```

## 📚 More Information

See detailed documentation in:
- [CUSTOM_REGISTRY.md](./CUSTOM_REGISTRY.md) - Full documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

## 🆘 Need Help?

Common issues and solutions:
1. **"Invalid API Key"** → Check your `.env.local` has correct Stripe keys
2. **"Webhook signature verification failed"** → Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output
3. **"Table does not exist"** → Run `supabase db push` to apply migrations
4. **"Access denied"** → Verify you're logged in and own the wedding

---

Happy fundraising! 💝

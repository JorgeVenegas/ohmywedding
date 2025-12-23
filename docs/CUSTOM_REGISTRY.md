# Custom Registry Feature

This feature allows couples to create custom registry items for experiences, funds, and special requests that cannot be purchased from a traditional store. Guests can contribute to these items using Stripe payments.

## Features

- **Admin Dashboard**: Create, edit, and manage custom registry items
- **Guest View**: Beautiful interface for guests to view items and contribute
- **Stripe Integration**: Secure payment processing via Stripe Checkout
- **Real-time Progress**: Track contributions and funding progress
- **Flexible Items**: Support for honeymoon funds, home down payments, experiences, etc.

## Setup Instructions

### 1. Database Migration

Run the migration to create the necessary database tables:

```bash
# Apply the migration
supabase db push

# Or if using local development
supabase db reset
```

This creates two new tables:
- `custom_registry_items`: Stores registry items with title, description, goal amount, current amount, etc.
- `registry_contributions`: Tracks individual contributions from guests

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Base URL (for Stripe redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL
```

### 3. Stripe Setup

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Go to Developers → API keys
   - Copy your publishable key (pk_test_...) to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy your secret key (sk_test_...) to `STRIPE_SECRET_KEY`

3. **Set up Webhooks**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL: `https://yourdomain.com/api/registry/webhook`
   - Select event: `checkout.session.completed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Test Webhooks Locally** (using Stripe CLI):
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to your Stripe account
   stripe login
   
   # Forward webhooks to your local server
   stripe listen --forward-to localhost:3000/api/registry/webhook
   ```

## Usage

### For Couples (Admin)

1. Navigate to your wedding admin dashboard
2. Click on "Registry" in the sidebar (or visit `/admin/[weddingId]/registry`)
3. Click "Add Item" to create a new custom registry item
4. Fill in:
   - **Title**: e.g., "Honeymoon Fund", "Dream Home Down Payment"
   - **Description**: Explain what the funds will be used for
   - **Goal Amount**: Target amount you'd like to raise
5. Click "Create Item"
6. Toggle items active/inactive as needed
7. View contributions and track progress in real-time

### For Guests

1. Visit the wedding website
2. Navigate to the Registry section
3. Click on a custom registry item to view details
4. Click "Contribute" to make a donation
5. Enter:
   - Contribution amount
   - Your name (optional)
   - Your email (optional)
   - A message (optional)
6. Click "Proceed to Payment"
7. Complete payment via Stripe Checkout
8. Receive confirmation email from Stripe

### Linking from Main Wedding Page

The custom registry items will automatically appear in the wedding page's registry section if:
1. The registry section is enabled on the wedding page
2. `showCustomRegistry` is set to `true` in the section configuration
3. There are active custom registry items

You can also link directly to the registry page from navigation or custom buttons using:
```
https://yourdomain.com/[weddingNameId]/registry
```

## API Routes

### POST /api/registry/checkout

Creates a Stripe checkout session for a registry contribution.

**Request Body:**
```json
{
  "itemId": "uuid",
  "amount": 100.00,
  "contributorName": "John Doe",
  "contributorEmail": "john@example.com",
  "message": "Congratulations!"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/registry/webhook

Stripe webhook handler that processes payment completion and updates contribution status.

**Handles Events:**
- `checkout.session.completed`: Updates contribution status and item current amount

## Database Schema

### custom_registry_items

```sql
- id: uuid (primary key)
- wedding_name_id: text (foreign key to weddings)
- title: text
- description: text (nullable)
- goal_amount: decimal(10,2)
- current_amount: decimal(10,2)
- image_urls: text[] (array of image URLs)
- is_active: boolean (controls visibility to guests)
- display_order: integer
- created_at: timestamp
- updated_at: timestamp
```

### registry_contributions

```sql
- id: uuid (primary key)
- custom_registry_item_id: uuid (foreign key)
- wedding_name_id: text (foreign key to weddings)
- contributor_name: text (nullable)
- contributor_email: text (nullable)
- amount: decimal(10,2)
- message: text (nullable)
- stripe_payment_intent_id: text (unique)
- stripe_checkout_session_id: text (unique)
- payment_status: text ('pending', 'completed', 'failed')
- created_at: timestamp
```

## Security

- All tables have Row Level Security (RLS) enabled
- Guests can only view active items and create contributions
- Only wedding owners/collaborators can manage registry items
- Stripe handles all payment processing securely
- Webhook signatures are verified to prevent fraud

## Testing

### Test Cards (Stripe Test Mode)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## Troubleshooting

### Webhooks not working locally

Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/registry/webhook
```

### Contributions not updating

Check that:
1. Webhook is properly configured in Stripe dashboard
2. `STRIPE_WEBHOOK_SECRET` environment variable is set correctly
3. Check server logs for webhook errors

### Can't see registry items

Verify:
1. Items are marked as `is_active = true`
2. `wedding_name_id` matches your wedding
3. RLS policies are correctly applied

## Future Enhancements

- Image uploads for registry items
- Gift messages visible to couples
- Email notifications for contributions
- Multiple currency support
- Recurring contribution options
- Gift matching/doubling campaigns

#!/bin/bash

# Start Stripe webhook listeners for local development
# This script starts 3 webhook endpoints with specific event filtering:
# 
# 1. Subscriptions webhook (platform account - payment funnel tracking):
#    - payment_intent.created
#    - payment_intent.requires_action
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - checkout.session.completed
#
# 2. Registry webhook (connected account - registry checkout tracking):
#    - charge.succeeded
#    - charge.failed
#    - charge.refunded
#
# 3. Connect webhook (connected account - Stripe Connect lifecycle):
#    - account.updated
#    - account.external_account.created
#    - account.external_account.updated

set -e

echo "🚀 Starting Stripe Webhook Listeners..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "${YELLOW}⚠️  Stripe CLI is not installed${NC}"
    echo "Install from: https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo "${GREEN}✓ Stripe CLI found${NC}"
echo ""

# Create a temporary directory to store listener processes
LISTENERS_DIR="/tmp/stripe-webhooks"
mkdir -p "$LISTENERS_DIR"

# Function to start a webhook listener
start_webhook() {
    local name=$1
    local endpoint=$2
    local env_var=$3
    local events=$4
    
    echo "${BLUE}Starting $name webhook...${NC}"
    
    # Start listener in background, redirecting output to log file
    stripe listen --forward-to "localhost:3000$endpoint" --events "$events" > "$LISTENERS_DIR/$name.log" 2>&1 &
    local pid=$!
    echo $pid > "$LISTENERS_DIR/$name.pid"
    
    # Wait a moment for the listener to start
    sleep 3
    
    # Extract signing secret from log
    local secret=$(grep "webhook signing secret is" "$LISTENERS_DIR/$name.log" | head -1 | sed 's/.*webhook signing secret is //' | awk '{print $1}')
    
    if [ -z "$secret" ]; then
        echo "${YELLOW}⚠️  Could not extract signing secret for $name. Trying again...${NC}"
        sleep 2
        secret=$(grep "webhook signing secret is" "$LISTENERS_DIR/$name.log" | tail -1 | sed 's/.*webhook signing secret is //' | awk '{print $1}')
    fi
    
    if [ -n "$secret" ]; then
        echo "${GREEN}✓ $name running (PID: $pid)${NC}"
        echo "${BLUE}  Signing secret: $secret${NC}"
        echo "${BLUE}  Listening to events: $events${NC}"
        echo ""
    else
        echo "${YELLOW}⚠️  Could not extract signing secret. Check $LISTENERS_DIR/$name.log${NC}"
        echo ""
    fi
}

# Start all three webhooks with their specific events
# Subscriptions: payment funnel tracking (platform account)
start_webhook "subscriptions" "/api/subscriptions/webhook" "STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET" \
    "payment_intent.created,payment_intent.requires_action,payment_intent.succeeded,payment_intent.payment_failed,checkout.session.completed"

# Registry: checkout tracking (connected account events)
start_webhook "registry" "/api/registry/webhook" "STRIPE_REGISTRY_WEBHOOK_SECRET" \
    "charge.succeeded,charge.failed,charge.refunded"

# Connect: connected account lifecycle events
start_webhook "connect" "/api/connect/webhook" "STRIPE_CONNECT_WEBHOOK_SECRET" \
    "account.updated,account.external_account.created,account.external_account.updated"

echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✓ All webhook listeners started!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "${YELLOW}📝 Next steps:${NC}"
echo "  1. Check the .env.local file for webhook signing secrets"
echo "  2. Update the signing secrets if they've changed:"
echo "     - STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET"
echo "     - STRIPE_REGISTRY_WEBHOOK_SECRET"  
echo "     - STRIPE_CONNECT_WEBHOOK_SECRET"
echo ""
echo "${YELLOW}📊 Webhook Output:${NC}"
echo "  Real-time events will be displayed above as they're received."
echo "  Logs are also saved to: $LISTENERS_DIR/"
echo ""
echo "${YELLOW}🧪 To test webhooks, use:${NC}"
echo ""
echo "${BLUE}Subscriptions (platform account):${NC}"
echo "  stripe trigger payment_intent.created"
echo "  stripe trigger payment_intent.requires_action"
echo "  stripe trigger payment_intent.succeeded"
echo "  stripe trigger checkout.session.completed"
echo ""
echo "${BLUE}Registry (connected account):${NC}"
echo "  stripe trigger charge.succeeded"
echo "  stripe trigger charge.refunded"
echo ""
echo "${BLUE}Connect (connected account):${NC}"
echo "  stripe trigger account.updated"
echo "  stripe trigger account.external_account.created"
echo ""
echo "${YELLOW}⚠️  Important:${NC}"
echo "  Keep this script running while testing!"
echo "  Logs are saved to: $LISTENERS_DIR/"
echo ""
echo "Press Ctrl+C to stop all listeners"
echo ""

# Wait for all background jobs
wait

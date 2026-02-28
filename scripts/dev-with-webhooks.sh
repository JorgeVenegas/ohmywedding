#!/bin/bash
# Start webhook listeners and dev server together
set -m

echo "🚀 Starting Stripe webhooks and dev server..."
./scripts/start-webhooks.sh &
WEBHOOKS_PID=$!

# Give webhooks time to start
sleep 5

# Start dev server in foreground
next dev --hostname ohmy.local

# Cleanup webhooks when dev server stops
trap "kill $WEBHOOKS_PID 2>/dev/null" EXIT

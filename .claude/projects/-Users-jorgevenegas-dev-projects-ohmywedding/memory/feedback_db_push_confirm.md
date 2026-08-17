---
name: feedback_db_push_confirm
description: Always ask before running supabase db push to production — user wants to control when prod migrations run
metadata:
  type: feedback
---

Always confirm with the user before running `supabase db push` (which targets the remote/production database). Run `supabase migration up` for local only without asking, but treat `supabase db push` as a destructive/shared-state action that requires explicit approval.

**Why:** User rejected an automatic `supabase db push` mid-session with "not yet for prod" — they want to control the timing of production migrations.

**How to apply:** After applying a local migration with `supabase migration up`, tell the user what was applied and remind them to run `supabase db push` when they're ready to push to production.

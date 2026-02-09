Always run npm run build --debug, never forget the --debug flag since it provides more detailed output that can help catch warnings and notices that might be missed otherwise.

Do not create new supabase migrations, update the declarative schema and then generate a new migration from the diff.
Do not create unnecessary MD files.

Sections for the wedding site should follow the same approach all of them, to be consistent. All implemntations should consider this.

Config forms for each section should use the same layout and style as the other config forms. Also they should use the same components for bg color picker, text alignment, etc

Do not do supabase db push, everything has to be tested first locally with supabase migration up, also, i dont like supabase db reset since it can break backwards compatible stuff. Avoid those 2 commands.

NEVER DO supabase db reset --linked

never do supabase commands to the remote directly. Always test locally first.

Never do psql

Avoid doing supabase db reset, instead create new migrations and apply them with supabase migration up

at the end of every chat, do the npm run build to verify no build errors exist

you should aim to reduce the amount of code thorugh simplificaitons, reutilizations, standardizaiton and use of compoents. Avoid repeating yourself

after the build, start the dev server again to coninue working

When you make changes to the i18n files, always update both en.ts and es.ts to keep them in sync

When you add new i18n keys, make sure to also update the types.ts file to include the new keys for type safety

avoid running commands with 2>&1 | tail -50, i like to see full output to catch warnings and notices

You need to take into account responsiveness and mobile design for every change you do to the wedding site. Always verify the result in mobile viewports

You should always aim to improve performance and reduce bundle size with every change you do

aim for security a dn integrity of data, avoid data loss or leaks with every change you do. Ensure only people with the right roles can access sensitive data or perform critical actions.

You should not create very large files. You should aim to create reusable components and separate pages in smaller components and sections.

Fors super large files, you should aim to extract components and logic into smaller files to improve maintainability and readability.

For animations try to use framer motion whenever possible to keep consistency across the app

Securituy is top priority, always follow best practices to avoid vulnerabilities. Avoid APIs that can expose sensitive data or operations to unauthorized users. Always limit what information is sent to the client. 

Do not run anything locally with sql to create stuff. Everything should be on. a migration since local changes will be pushed to remote db, and they have to be consistet.

Use shadcn components when possible and just customize them with the tailwind classes. Avoid creating new components when a shadcn one can be used with custom classes.If dependency issues, fix.

When working on the wedding site, always ensure that the user experience is smooth and intuitive. Prioritize usability and accessibility in every design and development decision.

When running the build, wait for it to complete before trying to run it again. After running npm run build, wait for 10 seconds for it to complete. If you try to run it again before it completes, it can cause issues and errors. Always give it enough time to finish before running it again. 

Nothing in the db should be dependant on the wedding name id, since it can change. Always use the wedding id for db operations and only use the wedding name id for display purposes and urls.

## Stripe Webhooks - Local Testing

When testing Stripe features (subscriptions, registry, or Connect), you MUST have the webhook listeners running:

**Before testing, start the webhooks:**
```bash
./scripts/start-webhooks.sh
```

This starts 3 webhook listeners:
- **Subscriptions**: `/api/subscriptions/webhook` - Tracks payment funnel events (payment_intent.created, payment_intent.requires_action, payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed)
- **Registry**: `/api/registry/webhook` - Tracks registry checkout events  
- **Connect**: `/api/connect/webhook` - Tracks Stripe Connect account events

The script will output the signing secrets. Update `.env.local` if they change:
- `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`
- `STRIPE_REGISTRY_WEBHOOK_SECRET`
- `STRIPE_CONNECT_WEBHOOK_SECRET`

**To test webhooks manually:**
```bash
stripe trigger payment_intent.created
stripe trigger checkout.session.completed
stripe trigger payment_intent.requires_action
```

Keep the webhook script running in a separate terminal while testing.
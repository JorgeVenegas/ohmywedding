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
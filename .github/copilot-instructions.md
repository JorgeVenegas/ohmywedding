Do not create new supabase migrations, update the declarative schema and then generate a new migration from the diff.
Do not create unnecessary MD files.

Sections for the wedding site should follow the same approach all of them, to be consistent. All implemntations should consider this.

Do not do supabase db push, everything has to be tested first locally with supabase migration up, also, i dont like supabase db reset since it can break backwards compatible stuff. Avoid those 2 commands.

NEVER DO supabase db reset --linked

never do supabase commands to the remote directly. Always test locally first.

Never do psql

Avoid doing supabase db reset, instead create new migrations and apply them with supabase migration up
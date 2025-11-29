-- Fix the update policy for weddings to use auth.jwt() instead of subquery
drop policy if exists "Owners and collaborators can update weddings" on weddings;

create policy "Owners and collaborators can update weddings" on weddings
  for update using (
    owner_id = auth.uid() -- Owner can edit
    or auth.jwt() ->> 'email' = any(collaborator_emails) -- Collaborators can edit
  );

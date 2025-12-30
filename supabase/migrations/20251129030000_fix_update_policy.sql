-- Fix the update policy for weddings to use proper subquery syntax
drop policy if exists "Owners and collaborators can update weddings" on weddings;

create policy "Owners and collaborators can update weddings" on weddings
  for update using (
    owner_id = auth.uid() -- Owner can edit
    or (select email from auth.users where id = auth.uid()) = any(collaborator_emails) -- Collaborators can edit
  );

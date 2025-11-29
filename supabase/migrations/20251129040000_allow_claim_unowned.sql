-- Allow authenticated users to claim ownership of unowned weddings
drop policy if exists "Owners and collaborators can update weddings" on weddings;

create policy "Owners and collaborators can update weddings" on weddings
  for update using (
    owner_id = auth.uid() -- Owner can edit
    or owner_id is null -- Anyone logged in can claim/edit unowned weddings
    or auth.jwt() ->> 'email' = any(collaborator_emails) -- Collaborators can edit
  );

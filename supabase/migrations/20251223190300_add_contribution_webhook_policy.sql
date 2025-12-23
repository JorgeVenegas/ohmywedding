-- Add policy to allow webhooks to read contributions by checkout session ID
create policy "Anyone can read registry contributions by checkout session" on registry_contributions
  for select using (stripe_checkout_session_id is not null);

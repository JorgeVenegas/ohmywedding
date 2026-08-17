-- Enable RLS on guest_photos table
alter table guest_photos enable row level security;

-- Wedding owners can manage all photos for their wedding
create policy "wedding_owners_can_manage_guest_photos"
  on guest_photos for all
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
    )
  );

-- Approved photos are publicly readable (for the guest-facing section)
create policy "approved_photos_are_public"
  on guest_photos for select
  using (status = 'approved');

-- Extend activity_logs to allow guest photo upload events
alter table activity_logs
  drop constraint if exists activity_logs_activity_type_check;

alter table activity_logs
  add constraint activity_logs_activity_type_check
  check ("activity_type" in (
    'invitation_opened',
    'rsvp_confirmed',
    'rsvp_declined',
    'rsvp_updated',
    'travel_info_updated',
    'guest_added',
    'guest_removed',
    'group_added',
    'group_removed',
    'message_sent',
    'registry_contribution',
    'guest_photo_uploaded'
  ));

-- Keep conversations.last_message_at / last_message_preview / unread_count /
-- session_expires_at in sync via a DB trigger rather than application-level
-- read-then-write — avoids races between the instant-push and sweep processing
-- paths both landing a message for the same conversation around the same time.

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'inbound' then
    update conversations
    set last_message_at = new.created_at,
        last_message_preview = left(coalesce(new.body, initcap(new.message_type)), 200),
        unread_count = unread_count + 1,
        session_expires_at = new.created_at + interval '24 hours'
    where id = new.conversation_id;
  else
    update conversations
    set last_message_at = new.created_at,
        last_message_preview = left(coalesce(new.body, initcap(new.message_type)), 200)
    where id = new.conversation_id;
  end if;
  return new;
end;
$$;

create trigger "on_message_created"
  after insert on messages
  for each row
  execute function public.handle_new_message();

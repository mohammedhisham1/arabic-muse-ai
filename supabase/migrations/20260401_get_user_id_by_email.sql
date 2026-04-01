-- Lookup auth user by email (for teacher dashboard).
-- Run in Supabase SQL Editor (or via migrations apply).

create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_id uuid;
begin
  select u.id into v_id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  return v_id;
end;
$$;

grant execute on function public.get_user_id_by_email(text) to authenticated;


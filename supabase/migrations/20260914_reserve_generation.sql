create or replace function public.reserve_generation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_job_id uuid;
  required_credits constant integer := 10;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'Authentication required';
  end if;

  update public.profiles
  set credits = credits - required_credits
  where user_id = current_user_id
    and credits >= required_credits;

  if not found then
    raise exception using errcode = 'P0001', message = 'Insufficient credits';
  end if;

  insert into public.jobs (user_id, status)
  values (current_user_id, 'queued')
  returning id into new_job_id;

  return new_job_id;
end;
$$;

grant execute on function public.reserve_generation() to authenticated;

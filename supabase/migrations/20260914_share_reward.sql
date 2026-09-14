-- Share-to-earn: adds 50 credits when the user shares a finished video.
-- Pays out at most once per day and only to users who have a finished render to share.
alter table public.profiles
add column if not exists share_reward_claimed_at timestamptz;

create or replace function public.claim_share_reward()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  reward constant integer := 50;
  new_balance integer;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.jobs where user_id = current_user_id and status = 'done'
  ) then
    raise exception using errcode = 'P0001', message = 'No finished video to share';
  end if;

  update public.profiles
  set credits = credits + reward,
      share_reward_claimed_at = now()
  where user_id = current_user_id
    and (share_reward_claimed_at is null or share_reward_claimed_at < now() - interval '1 day')
  returning credits into new_balance;

  if not found then
    raise exception using errcode = 'P0001', message = 'Reward already claimed today';
  end if;

  return new_balance;
end;
$$;

grant execute on function public.claim_share_reward() to authenticated;

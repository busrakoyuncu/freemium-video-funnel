-- Moves a job forward and refunds the reserved credits when it fails.
-- Only the server may call this: it is revoked from anon and authenticated
-- and is invoked with the service role key.
create or replace function public.settle_job(job_id uuid, next_status text, next_video_url text default null)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.jobs;
  reserved_credits constant integer := 10;
begin
  select * into job from public.jobs where id = job_id for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Job not found';
  end if;

  if job.status in ('done', 'failed') then
    return job;
  end if;

  update public.jobs
  set status = next_status,
      video_url = coalesce(next_video_url, video_url)
  where id = job_id
  returning * into job;

  if next_status = 'failed' then
    update public.profiles
    set credits = credits + reserved_credits
    where user_id = job.user_id;
  end if;

  return job;
end;
$$;

revoke execute on function public.settle_job(uuid, text, text) from public, anon, authenticated;

-- Lets the owner fail their own unfinished job and get the reserved credits back.
-- Used by the app when a render cannot be advanced. Terminal jobs are left alone,
-- so it can never refund a finished render or refund twice.
create or replace function public.fail_job(job_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.jobs;
  reserved_credits constant integer := 10;
begin
  select * into job
  from public.jobs
  where id = job_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Job not found';
  end if;

  if job.status in ('done', 'failed') then
    return job;
  end if;

  update public.jobs
  set status = 'failed'
  where id = job_id
  returning * into job;

  update public.profiles
  set credits = credits + reserved_credits
  where user_id = job.user_id;

  return job;
end;
$$;

grant execute on function public.fail_job(uuid) to authenticated;

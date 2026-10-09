-- Students may change enrollment state, but progress is maintained only by server-side triggers.
revoke update on public.enrollments from authenticated;
grant update (status) on public.enrollments to authenticated;

-- XP is deterministic so a browser cannot award itself arbitrary points.
create or replace function public.normalize_lesson_xp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.xp = case when new.completed then 100 else 0 end;
  new.completed_at = case when new.completed then coalesce(new.completed_at, now()) else null end;
  return new;
end;
$$;

create trigger lesson_progress_normalize_xp
  before insert or update on public.lesson_progress
  for each row execute function public.normalize_lesson_xp();

revoke update on public.lesson_progress from authenticated;
grant update (completed, completed_at) on public.lesson_progress to authenticated;
